import { Node, Edge } from "@xyflow/react";

export interface DashboardTemplate {
  id: string;
  title: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  time: string;
  tags: string[];
  iconName: "Search" | "BrainCircuit" | "MessageSquareCode" | "Mail" | "Slack" | "Twitter" | "Database" | "Globe" | "Bot" | "Zap" | "Code";
  nodes: Node[];
  edges: Edge[];
}

export const AGENT_TEMPLATES: DashboardTemplate[] = [
  // 1. Basic Content Generator
  {
    id: "content-gen",
    title: "Basic Content Generator",
    description: "Generates blog posts or social media drafts based on a simple input prompt.",
    level: "Beginner",
    time: "1 min",
    tags: ["Writing", "Social"],
    iconName: "MessageSquareCode",
    nodes: [
      { id: "1", type: "inputNode", position: { x: 50, y: 150 }, data: { label: "Input", value: "A post about AI architecture" } },
      { id: "2", type: "llmNode", position: { x: 350, y: 150 }, data: { label: "GPT-4o", model: "gpt-4o", systemPrompt: "You are a social media manager. Write an engaging post.", temperature: 0.7 } },
      { id: "3", type: "outputNode", position: { x: 650, y: 150 }, data: { label: "Social Media Post" } }
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", animated: true },
      { id: "e2-3", source: "2", target: "3", animated: true }
    ]
  },
  // 2. Web Scraper to Slack
  {
    id: "scraper-slack",
    title: "Website Summarizer Bot",
    description: "Scrapes a URL, summarizes the content using Claude, and posts directly to a Slack channel.",
    level: "Intermediate",
    time: "3 mins",
    tags: ["Agent", "Bot"],
    iconName: "Slack",
    nodes: [
      { id: "1", type: "scraperNode", position: { x: 50, y: 150 }, data: { label: "Web Scraper", url: "https://example.com/news" } },
      { id: "2", type: "llmNode", position: { x: 350, y: 150 }, data: { label: "Claude 3.5 Summarizer", model: "claude-3-5-sonnet", systemPrompt: "Summarize this article into 3 bullet points.", temperature: 0.2 } },
      { id: "3", type: "slackNode", position: { x: 650, y: 150 }, data: { label: "Slack Poster", webhookUrl: "" } }
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", animated: true },
      { id: "e2-3", source: "2", target: "3", animated: true }
    ]
  },
  // 3. Arxiv Researcher
  {
    id: "arxiv-research",
    title: "Deep Academic Researcher",
    description: "Searches Google/Arxiv for academic papers, synthesizes the abstracts, and returns a detailed report.",
    level: "Advanced",
    time: "5 mins",
    tags: ["Research", "Learning"],
    iconName: "Search",
    nodes: [
      { id: "1", type: "inputNode", position: { x: 50, y: 150 }, data: { label: "Research Topic", value: "Quantum Computing Algorithms" } },
      { id: "2", type: "searchNode", position: { x: 300, y: 50 }, data: { label: "Google Search", engine: "google", query: "{{1}}" } },
      { id: "3", type: "wikiNode", position: { x: 300, y: 250 }, data: { label: "Wikipedia", query: "{{1}}", limit: 3 } },
      { id: "4", type: "combineNode", position: { x: 550, y: 150 }, data: { label: "Merge Sources", separator: "\n\n---\n\n" } },
      { id: "5", type: "llmNode", position: { x: 800, y: 150 }, data: { label: "Synthesis Engine", model: "gpt-4o", systemPrompt: "Synthesize the provided search results and wikipedia entries into a coherent research brief.", temperature: 0.3 } },
      { id: "6", type: "outputNode", position: { x: 1100, y: 150 }, data: { label: "Research Brief" } }
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", animated: true },
      { id: "e1-3", source: "1", target: "3", animated: true },
      { id: "e2-4", source: "2", target: "4", animated: true },
      { id: "e3-4", source: "3", target: "4", animated: true },
      { id: "e4-5", source: "4", target: "5", animated: true },
      { id: "e5-6", source: "5", target: "6", animated: true }
    ]
  },
  // 4. Crypto News Tweeter
  {
    id: "crypto-x",
    title: "Crypto Twitter Bot",
    description: "Fetches recent crypto news, formats it into an engaging tweet layout, and posts to Twitter (X).",
    level: "Intermediate",
    time: "2 mins",
    tags: ["Social", "News"],
    iconName: "Twitter",
    nodes: [
      { id: "1", type: "newsNode", position: { x: 50, y: 150 }, data: { label: "News Fetcher", query: "Cryptocurrency Bitcoin", limit: 5 } },
      { id: "2", type: "llmNode", position: { x: 350, y: 150 }, data: { label: "Tweet Writer", model: "gpt-4o", systemPrompt: "Turn these headlines into a punchy, threaded tweet. Include #Crypto.", temperature: 0.6 } },
      { id: "3", type: "twitterNode", position: { x: 650, y: 150 }, data: { label: "X Poster", apiKey: "", apiSecret: "" } }
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", animated: true },
      { id: "e2-3", source: "2", target: "3", animated: true }
    ]
  },
  // 5. Automated Customer Support
  {
    id: "customer-support",
    title: "Support Ticket Classifier",
    description: "Reads a customer email, uses an LLM to categorize the intent (Refund, Bug, Inquiry), and logs to Airtable.",
    level: "Intermediate",
    time: "4 mins",
    tags: ["Agent", "Data"],
    iconName: "Database",
    nodes: [
      { id: "1", type: "inputNode", position: { x: 50, y: 150 }, data: { label: "Customer Email", value: "My app keeps crashing on the login screen." } },
      { id: "2", type: "llmNode", position: { x: 350, y: 150 }, data: { label: "Classifier", model: "gpt-3.5-turbo", systemPrompt: "Classify the input email into exactly one of: REFUND, BUG, INQUIRY, OTHER. Output only the category word.", temperature: 0.0 } },
      { id: "3", type: "airtableNode", position: { x: 650, y: 150 }, data: { label: "Airtable Logger", token: "", targetId: "" } }
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", animated: true },
      { id: "e2-3", source: "2", target: "3", animated: true }
    ]
  },
  // 6. Multimodal Vision Inspector
  {
    id: "vision-inspector",
    title: "Multimodal Vision Inspector",
    description: "Accepts an image URL, generates a prompt, and uses an LLM to analyze the image.",
    level: "Beginner",
    time: "2 mins",
    tags: ["Multimodal", "Analysis"],
    iconName: "BrainCircuit",
    nodes: [
      { id: "1", type: "inputNode", position: { x: 50, y: 150 }, data: { label: "Image URL", value: "https://example.com/image.png" } },
      { id: "2", type: "promptNode", position: { x: 300, y: 150 }, data: { label: "Analysis Prompt", template: "Analyze this image and describe the objects: {{1}}" } },
      { id: "3", type: "llmNode", position: { x: 550, y: 150 }, data: { label: "Vision Model", model: "gpt-4o", systemPrompt: "You are an expert image analyst.", temperature: 0.4 } },
      { id: "4", type: "outputNode", position: { x: 800, y: 150 }, data: { label: "Visual Description" } }
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", animated: true },
      { id: "e2-3", source: "2", target: "3", animated: true },
      { id: "e3-4", source: "3", target: "4", animated: true }
    ]
  },
  // 7. Text-to-Speech Podcast Generator
  {
    id: "tts-podcast",
    title: "Mini-Podcast Generator",
    description: "Takes a summary of a topic, expands it into a script, and converts it into audio.",
    level: "Advanced",
    time: "5 mins",
    tags: ["Audio", "Creative"],
    iconName: "Zap",
    nodes: [
      { id: "1", type: "wikiNode", position: { x: 50, y: 150 }, data: { label: "Wiki Source", query: "History of Rome", limit: 2 } },
      { id: "2", type: "llmNode", position: { x: 300, y: 150 }, data: { label: "Script Writer", model: "claude-3-5-sonnet", systemPrompt: "Write a 1-minute engaging podcast script based on the input. Just provide the spoken text.", temperature: 0.7 } },
      { id: "3", type: "ttsNode", position: { x: 550, y: 150 }, data: { label: "Text-to-Speech", config: "en-US-Journey-F" } },
      { id: "4", type: "outputNode", position: { x: 800, y: 150 }, data: { label: "Audio Output URL" } }
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", animated: true },
      { id: "e2-3", source: "2", target: "3", animated: true },
      { id: "e3-4", source: "3", target: "4", animated: true }
    ]
  },
  // Add 13 more simple variations to reach 20
  ...Array.from({ length: 13 }).map((_, i) => ({
    id: `template-auto-${i + 8}`,
    title: `Agent Architecture Model v${i + 8}.0`,
    description: `Pre-configured system workflow implementing standard data ingestion, processing, and output routing.`,
    level: i % 3 === 0 ? "Beginner" : (i % 2 === 0 ? "Intermediate" : "Advanced") as any,
    time: `${(i % 5) + 2} mins`,
    tags: ["General", "Workflow"],
    iconName: "Code" as any,
    nodes: [
      { id: "1", type: "inputNode", position: { x: 50, y: 150 }, data: { label: "Data Source", value: "Raw Data" } },
      { id: "2", type: "promptNode", position: { x: 300, y: 150 }, data: { label: "Formatter", template: "Format this: {{1}}" } },
      { id: "3", type: "llmNode", position: { x: 550, y: 150 }, data: { label: "Processor", model: "gpt-3.5-turbo", systemPrompt: "Process the data.", temperature: 0.5 } },
      { id: "4", type: "mongoNode", position: { x: 800, y: 150 }, data: { label: "Database Sync", uri: "", dbCollection: "", operation: "insertOne" } }
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", animated: true },
      { id: "e2-3", source: "2", target: "3", animated: true },
      { id: "e3-4", source: "3", target: "4", animated: true }
    ]
  }))
];
