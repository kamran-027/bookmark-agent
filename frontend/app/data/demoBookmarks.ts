import { Bookmark } from "../components/BookmarkCard";

export const CURATED_DEMO_BOOKMARKS: Bookmark[] = [
  {
    id: 101,
    url: "https://python.langchain.com/docs/concepts/architecture/",
    title: "LangGraph: Stateful Multi-Agent System Architecture",
    summary:
      "A comprehensive architectural blueprint for building resilient, stateful multi-agent workflows with human-in-the-loop interventions, dynamic tool calling, and cyclic graph execution loops.",
    category: "AI/ML",
    tags: ["LangGraph", "Autonomous Agents", "Python", "StateGraph"],
    created_at: "Demo Preview",
  },
  {
    id: 102,
    url: "https://www.anthropic.com/research",
    title: "Anthropic: Constitutional AI & Frontier Model Reasoning",
    summary:
      "Detailed research on alignment principles, self-supervised critique loops, and multi-turn reasoning capabilities governing next-generation Claude frontier architectures.",
    category: "Research",
    tags: ["Anthropic", "Claude 3.5", "LLMs", "Safety"],
    created_at: "Demo Preview",
  },
  {
    id: 103,
    url: "https://nextjs.org/docs/app",
    title: "Next.js App Router: High-Performance Server Components",
    summary:
      "Modern full-stack web architecture leveraging React Server Components, streaming SSR, Server-Sent Events (SSE), and edge caching for sub-100ms global response times.",
    category: "DevTools",
    tags: ["Next.js", "React 19", "Performance", "WebDev"],
    created_at: "Demo Preview",
  },
];
