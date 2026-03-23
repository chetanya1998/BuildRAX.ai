const fs = require('fs');

const baseNodes = [
  { id: "1", type: "inputNode", position: { x: 50, y: 150 }, data: { label: "Input", value: "" } },
  { id: "2", type: "llmNode", position: { x: 350, y: 150 }, data: { label: "AI Engine", model: "gpt-4o", systemPrompt: "Process the data.", temperature: 0.5 } },
  { id: "3", type: "outputNode", position: { x: 650, y: 150 }, data: { label: "Output" } }
];
const baseEdges = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e2-3", source: "2", target: "3", animated: true }
];

const topics = [
  "Content Marketing Writer", "Code Review Bot", "Customer Support Classifier", "Arxiv Research Synthesizer", 
  "Stock Market Analyzer", "Web Scraping Agent", "Slack Daily Standup Bot", "Email Newsletter Generator",
  "Discord Auto-Moderator", "Legal Contract Summarizer", "Multimodal Vision Inspector", "Audio Podcast Generator",
  "Twitter Thread Creator", "SEO Blog Optimizer", "Language Translator Pipeline", "Data Cleaning Assistant",
  "Cold Email Personalizer", "Resume & Cover Letter Tailor", "Product Hunt Launch Assistant", "Meeting Minutes Summarizer",
  "Real Estate Listing Generator", "YouTube Script Writer", "E-commerce Product Description Generator", "Travel Itinerary Planner",
  "Financial Report Extractor", "Medical Terminology Simplifier", "Cybersecurity Threat Analyzer", "Personal Fitness Coach Agent",
  "Recipe & Shopping List Generator", "Creative Writing Assistant"
];

const tagsPool = ["Agent", "Bot", "Research", "Analysis", "Social", "Writing", "Automation", "Data", "Audio", "Vision", "Code"];
const iconsPool = ["Search", "BrainCircuit", "MessageSquareCode", "Mail", "Slack", "Twitter", "Database", "Globe", "Bot", "Zap", "Code"];

const items = topics.map((t, i) => {
  const complexity = (i % 3) + 3;
  const nodeCount = (i % 5) + 4;
  const nodeSequence = ["inputNode", "llmNode", "logicNode", "outputNode"].slice(0, nodeCount);
  
  return `{
    id: "template_${i + 1}",
    title: "${t}",
    description: "An automated workflow for ${t.toLowerCase()} tasks.",
    detailedOverview: "This agent architecture intercepts raw input, processes it through multiple reasoning steps, and delivers a final output tailored for ${t.toLowerCase()} use cases.",
    useCases: ["Accelerate daily tasks", "Automate manual data entry", "Ensure consistent output quality"],
    expectedOutput: "A highly refined, properly formatted dataset or text output ready for production.",
    level: "${['Beginner', 'Intermediate', 'Advanced'][i % 3]}",
    complexity: ${complexity},
    nodeCount: ${nodeCount},
    nodeSequence: ${JSON.stringify(nodeSequence)},
    time: "${(i % 5) + 2} mins",
    tags: ["${tagsPool[i % tagsPool.length]}", "${tagsPool[(i+1) % tagsPool.length]}"],
    iconName: "${iconsPool[i % iconsPool.length]}",
    nodes: ${JSON.stringify(baseNodes)},
    edges: ${JSON.stringify(baseEdges)}
  }`;
});

const content = `import { Node, Edge } from "@xyflow/react";

export interface DashboardTemplate {
  id: string;
  title: string;
  description: string;
  detailedOverview?: string;
  useCases?: string[];
  expectedOutput?: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  complexity: number;
  nodeCount: number;
  nodeSequence: string[];
  time: string;
  tags: string[];
  iconName: "Search" | "BrainCircuit" | "MessageSquareCode" | "Mail" | "Slack" | "Twitter" | "Database" | "Globe" | "Bot" | "Zap" | "Code";
  nodes: Node[];
  edges: Edge[];
}

export const AGENT_TEMPLATES: DashboardTemplate[] = [\n${items.join(',\n')}\n];
`;

fs.writeFileSync('src/lib/data/templates.ts', content);
console.log("30 unique templates generated!");
