import { LucideIcon, Slack, MessageSquare, Database, FileText, ShoppingCart, CreditCard, Mail, Table, Users, Github } from "lucide-react";

export type FieldType = "string" | "textarea" | "password" | "select" | "number" | "boolean" | "json";

export interface IntegrationField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  description?: string;
}

export interface IntegrationAction {
  id: string; // e.g., 'postMessage', 'createOrder'
  name: string;
  description: string;
  inputs: IntegrationField[];
  outputs: IntegrationField[];
}

export interface IntegrationApp {
  id: string; // e.g., 'slack', 'shopify'
  name: string;
  icon: any; // LucideIcon or similar
  category: "Communication" | "Productivity" | "Commerce" | "Developer" | "Marketing" | "Social";
  color: string; // For node branding (e.g., #4A154B for Slack)
  actions: IntegrationAction[];
  authType: "api_key" | "oauth2" | "none";
}

export const INTEGRATION_REGISTRY: Record<string, IntegrationApp> = {
  slack: {
    id: "slack",
    name: "Slack",
    icon: Slack,
    category: "Communication",
    color: "#4A154B",
    authType: "api_key",
    actions: [
      {
        id: "postMessage",
        name: "Post Message",
        description: "Send a message to a specific Channel or User",
        inputs: [
          { name: "token", label: "Bot Token", type: "password", required: true },
          { name: "channel", label: "Channel ID", type: "string", required: true, description: "e.g., C123456" },
          { name: "text", label: "Message Text", type: "textarea", required: true },
        ],
        outputs: [
          { name: "ts", label: "Message Timestamp", type: "string" },
          { name: "channel", label: "Channel", type: "string" },
        ],
      },
    ],
  },
  discord: {
    id: "discord",
    name: "Discord",
    icon: MessageSquare,
    category: "Communication",
    color: "#5865F2",
    authType: "api_key",
    actions: [
      {
        id: "sendMessage",
        name: "Send Message",
        description: "Post a message to a Discord channel via Webhook or Bot Token",
        inputs: [
          { name: "webhookUrl", label: "Webhook URL", type: "password", required: true },
          { name: "content", label: "Message Content", type: "textarea", required: true },
        ],
        outputs: [
          { name: "id", label: "Message ID", type: "string" },
        ],
      },
    ],
  },
  notion: {
    id: "notion",
    name: "Notion",
    icon: FileText, // Or a custom Notion icon SVG
    category: "Productivity",
    color: "#000000",
    authType: "api_key",
    actions: [
      {
        id: "createPage",
        name: "Create Page",
        description: "Create a new page in a database",
        inputs: [
          { name: "apiKey", label: "Integration Token", type: "password", required: true },
          { name: "databaseId", label: "Database ID", type: "string", required: true },
          { name: "title", label: "Page Title", type: "string", required: true },
          { name: "content", label: "Page Content (Markdown)", type: "textarea" },
        ],
        outputs: [
          { name: "pageId", label: "Page ID", type: "string" },
          { name: "url", label: "Page URL", type: "string" },
        ],
      },
    ],
  },
  shopify: {
    id: "shopify",
    name: "Shopify",
    icon: ShoppingCart,
    category: "Commerce",
    color: "#95BF47",
    authType: "api_key",
    actions: [
      {
        id: "createOrder",
        name: "Create Order",
        description: "Create a new draft or active order",
        inputs: [
          { name: "shopUrl", label: "Store URL (myshopify.com)", type: "string", required: true },
          { name: "accessToken", label: "Admin API Access Token", type: "password", required: true },
          { name: "lineItems", label: "Line Items (JSON Array)", type: "json", required: true },
        ],
        outputs: [
          { name: "orderId", label: "Order ID", type: "string" },
        ],
      },
    ],
  },
  github: {
    id: "github",
    name: "GitHub",
    icon: Github,
    category: "Developer",
    color: "#24292e",
    authType: "api_key",
    actions: [
      {
        id: "createIssue",
        name: "Create Issue",
        description: "Creates a new issue in a specified repository",
        inputs: [
          { name: "token", label: "Personal Access Token", type: "password", required: true },
          { name: "owner", label: "Repository Owner", type: "string", required: true },
          { name: "repo", label: "Repository Name", type: "string", required: true },
          { name: "title", label: "Issue Title", type: "string", required: true },
          { name: "body", label: "Issue Body", type: "textarea" },
        ],
        outputs: [
          { name: "issueNumber", label: "Issue Number", type: "number" },
          { name: "issueUrl", label: "Issue HTML URL", type: "string" },
        ],
      },
    ],
  }
};
