import os
import json
from datetime import datetime
from typing import Annotated, Literal, List, Sequence

from dotenv import load_dotenv
load_dotenv()

# Check for API key
api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
if not api_key:
    print("WARNING: No API key found. Create a .env file with GEMINI_API_KEY=your_key")

# =====================================================================
# NEW LIBRARY: httpx
# =====================================================================
# httpx is a modern Python HTTP client. It lets us make network requests
# to fetch web pages — similar to the 'requests' library but supports
# both synchronous and async usage and has better timeout handling.
import httpx

# =====================================================================
# NEW LIBRARY: BeautifulSoup (bs4)
# =====================================================================
# When you fetch a web page with httpx, you get raw HTML like:
#   <html><body><h1>Title</h1><p>Some text...</p></body></html>
# BeautifulSoup parses that HTML tree and lets you extract just the
# clean readable text, stripping all the tags away.
from bs4 import BeautifulSoup

# =====================================================================
# NEW CONCEPT: Pydantic BaseModel
# =====================================================================
# Pydantic lets you define data schemas as Python classes with strict
# type enforcement. If a field is declared as `str`, Pydantic will
# reject any non-string value at runtime, preventing silent data bugs.
# We'll use this to define the exact shape of a saved bookmark.
from pydantic import BaseModel, Field

# LangChain / LangGraph imports
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage, SystemMessage
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
import langchain_google_genai.chat_models as chat_models
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from typing_extensions import TypedDict

# =====================================================================
# MONKEYPATCH: thought_signature fix for Gemini 3+ models
# =====================================================================
# Gemini 3.5 Flash requires a 'thought_signature' bytes field on every
# Part object that contains a tool/function call when it's passed back
# in conversation history. The current langchain-google-genai library
# doesn't handle this automatically yet, so we patch it here.
orig_parse_chat_history = chat_models._parse_chat_history

def patched_parse_chat_history(*args, **kwargs):
    system_instruction, history = orig_parse_chat_history(*args, **kwargs)
    for content in history:
        for part in content.parts:
            if part.function_call:
                part.thought_signature = b"skip_thought_signature_validator"
    return system_instruction, history

chat_models._parse_chat_history = patched_parse_chat_history

# =====================================================================
# PYDANTIC SCHEMA: What a Bookmark looks like
# =====================================================================
# This class defines the exact shape of data we expect Gemini to return
# when it analyzes a web page. Field(...) lets us add a description
# which is sent to the LLM so it understands what each field means.
class BookmarkSchema(BaseModel):
    title: str = Field(..., description="The title of the web page or article")
    summary: str = Field(..., description="A concise 2-3 sentence summary of the page content")
    category: str = Field(..., description="One of: AI, Dev, Design, Finance, Productivity, News, Other")
    tags: List[str] = Field(..., description="3-5 lowercase keyword tags relevant to the content")

# Path to our local JSON database file
DB_PATH = "bookmarks.json"

# =====================================================================
# HELPER: Load & Save the JSON database
# =====================================================================
# Python's built-in `json` module lets us read and write JSON files.
# We use this as a simple file-based database — no SQL or MongoDB needed.

def load_db() -> list:
    """Load all bookmarks from the JSON file. Returns empty list if file doesn't exist."""
    if not os.path.exists(DB_PATH):
        return []
    with open(DB_PATH, "r") as f:
        return json.load(f)

def save_db(data: list):
    """Write the full bookmarks list back to the JSON file."""
    with open(DB_PATH, "w") as f:
        # indent=2 makes the JSON file human-readable (pretty-printed)
        json.dump(data, f, indent=2)

# =====================================================================
# SEPARATE LLM for structured output (no tools bound)
# =====================================================================
# We use .with_structured_output(BookmarkSchema) to force Gemini to
# return a response that exactly matches our Pydantic schema — not
# free-form text, but a typed Python object we can safely read fields from.
summarizer_llm = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash",
    temperature=0.3,
    google_api_key=api_key,
).with_structured_output(BookmarkSchema)

# =====================================================================
# 1. DEFINE TOOLS
# =====================================================================

@tool
def fetch_and_summarize_url(url: str) -> str:
    """
    Fetch a web page from the given URL, extract its readable text content,
    summarize it using AI, auto-categorize it, and return the structured result
    as a JSON string ready to be saved.
    """
    print(f"\n  [Tool] Fetching: {url}")
    try:
        # httpx.get() sends an HTTP GET request to the URL.
        # timeout=15 means we wait at most 15 seconds before giving up.
        # headers lets us pretend to be a real browser so sites don't block us.
        response = httpx.get(
            url,
            timeout=15,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (compatible; BookmarkAgent/1.0)"}
        )
        response.raise_for_status()  # Raises an error if the status code is 4xx or 5xx

    except httpx.TimeoutException:
        return "Error: The request timed out. The site may be slow or blocking requests."
    except httpx.HTTPStatusError as e:
        return f"Error: Received HTTP {e.response.status_code} from {url}"
    except Exception as e:
        return f"Error fetching URL: {str(e)}"

    # BeautifulSoup parses the raw HTML string
    soup = BeautifulSoup(response.text, "html.parser")

    # Remove script and style tags — we only want readable content
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()

    # .get_text() extracts all visible text, joined by newlines
    raw_text = soup.get_text(separator="\n", strip=True)

    # Truncate to avoid hitting token limits on the LLM (keep first 3000 chars)
    truncated_text = raw_text[:3000]

    print(f"  [Tool] Summarizing with Gemini...")

    # Ask Gemini to analyze the content and return a structured BookmarkSchema object
    prompt = f"Analyze this web page content and provide a structured summary:\n\nURL: {url}\n\nContent:\n{truncated_text}"
    result: BookmarkSchema = summarizer_llm.invoke(prompt)

    # Convert the Pydantic object to a dict and return as JSON string
    return json.dumps({
        "url": url,
        "title": result.title,
        "summary": result.summary,
        "category": result.category,
        "tags": result.tags,
    })


@tool
def save_bookmark(bookmark_json: str) -> str:
    """
    Save a bookmark to the local JSON database. Expects a JSON string with
    fields: url, title, summary, category, tags.
    """
    try:
        bookmark = json.loads(bookmark_json)
    except json.JSONDecodeError:
        return "Error: Invalid JSON data. Could not save bookmark."

    # Add a timestamp so we know when each bookmark was saved
    bookmark["saved_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")

    # Load existing bookmarks, append the new one, and save back
    bookmarks = load_db()

    # Check for duplicate URLs
    for existing in bookmarks:
        if existing.get("url") == bookmark.get("url"):
            return f"This URL is already saved: '{existing['title']}'"

    bookmarks.append(bookmark)
    save_db(bookmarks)

    return (
        f"✅ Bookmark saved!\n"
        f"  Title    : {bookmark['title']}\n"
        f"  Summary  : {bookmark['summary']}\n"
        f"  Category : {bookmark['category']}\n"
        f"  Tags     : {', '.join(bookmark['tags'])}"
    )


@tool
def search_bookmarks(query: str) -> str:
    """
    Search saved bookmarks by keyword. Matches against title, summary, tags, and category.
    Returns matching bookmarks or a message if none found.
    """
    bookmarks = load_db()
    if not bookmarks:
        return "No bookmarks saved yet."

    query_lower = query.lower()
    matches = []

    for b in bookmarks:
        # Search across all relevant text fields
        searchable = " ".join([
            b.get("title", ""),
            b.get("summary", ""),
            b.get("category", ""),
            " ".join(b.get("tags", []))
        ]).lower()

        if query_lower in searchable:
            matches.append(b)

    if not matches:
        return f"No bookmarks found matching '{query}'."

    lines = [f"Found {len(matches)} bookmark(s) matching '{query}':\n"]
    for i, b in enumerate(matches, 1):
        lines.append(
            f"{i}. [{b['category']}] {b['title']}\n"
            f"   {b['url']}\n"
            f"   Tags: {', '.join(b.get('tags', []))}\n"
            f"   {b['summary']}\n"
        )
    return "\n".join(lines)


@tool
def list_bookmarks(category: str = "") -> str:
    """
    List all saved bookmarks, optionally filtered by category.
    Leave category empty to list all bookmarks.
    """
    bookmarks = load_db()
    if not bookmarks:
        return "No bookmarks saved yet."

    if category:
        bookmarks = [b for b in bookmarks if b.get("category", "").lower() == category.lower()]
        if not bookmarks:
            return f"No bookmarks found in category '{category}'."

    lines = [f"📚 {len(bookmarks)} bookmark(s):\n"]
    for i, b in enumerate(bookmarks, 1):
        lines.append(
            f"{i}. [{b['category']}] {b['title']}\n"
            f"   {b['url']}\n"
            f"   Saved: {b.get('saved_at', 'unknown')}\n"
        )
    return "\n".join(lines)


# Combine all tools
tools = [fetch_and_summarize_url, save_bookmark, search_bookmarks, list_bookmarks]
tool_node = ToolNode(tools)

# =====================================================================
# 2. AGENT STATE
# =====================================================================
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]

# =====================================================================
# 3. MAIN AGENT LLM & GRAPH NODES
# =====================================================================
model = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash",
    temperature=0.7,
    google_api_key=api_key,
).bind_tools(tools)

def call_model(state: AgentState):
    print("\n[Agent] Thinking...")
    response = model.invoke(state["messages"])
    return {"messages": [response]}

def should_continue(state: AgentState) -> Literal["tools", "__end__"]:
    last = state["messages"][-1]
    if last.tool_calls:
        print(f"[Router] Calling tool: {last.tool_calls[0]['name']}")
        return "tools"
    print("[Router] Done. Responding to user.")
    return "__end__"

# =====================================================================
# 4. BUILD THE GRAPH
# =====================================================================
workflow = StateGraph(AgentState)
workflow.add_node("agent", call_model)
workflow.add_node("tools", tool_node)
workflow.add_edge(START, "agent")
workflow.add_conditional_edges("agent", should_continue)
workflow.add_edge("tools", "agent")
app = workflow.compile()

# =====================================================================
# 5. CLI LOOP
# =====================================================================
def main():
    print("=" * 60)
    print("         📌 Smart Bookmark Manager Agent               ")
    print("=" * 60)
    print("Commands you can try:")
    print("  • Paste a URL to save it")
    print("  • 'List all my bookmarks'")
    print("  • 'List my AI bookmarks'")
    print("  • 'Find bookmarks about langchain'")
    print("  • Type 'exit' to quit\n")

    SYSTEM_MESSAGE = SystemMessage(content=(
        "You are a smart bookmark manager assistant. "
        "When a user provides a URL, always call fetch_and_summarize_url first, "
        "then immediately call save_bookmark with the result. Do not ask for confirmation. "
        "When asked to search or list bookmarks, use the appropriate tool directly. "
        "Be concise in your responses."
    ))

    state = {"messages": [SYSTEM_MESSAGE]}

    while True:
        try:
            user_input = input("\nYou: ").strip()
            if not user_input:
                continue
            if user_input.lower() in ["exit", "quit"]:
                print("Goodbye! 👋")
                break

            state["messages"].append(HumanMessage(content=user_input))

            final_state = state
            for event in app.stream(state, stream_mode="values"):
                if event and "messages" in event:
                    last_msg = event["messages"][-1]
                    if isinstance(last_msg, AIMessage) and not last_msg.tool_calls:
                        print(f"\nAgent: {last_msg.content}")
                    elif isinstance(last_msg, ToolMessage):
                        print(f"\n{last_msg.content}")
                    final_state = event

            state["messages"] = list(final_state["messages"])

        except KeyboardInterrupt:
            print("\nGoodbye! 👋")
            break
        except Exception as e:
            print(f"\nError: {e}")

if __name__ == "__main__":
    main()
