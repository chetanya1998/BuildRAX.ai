import OpenAI from "openai";
import { generateText } from "./litellm";

export type Node = {
  id: string;
  type: string;
  data: any;
};

export async function evaluateNodeLogic(node: Node, inputs: any): Promise<any> {
  switch (node.type) {
    case "inputNode":
      return node.data?.value || "";

    case "promptNode": {
      let template = node.data?.template || "";
      // Support for both {{key}} and {{default}}
      for (const [key, val] of Object.entries(inputs)) {
        template = template.replace(new RegExp(`{{${key}}}`, "g"), String(val));
      }
      // Fallback for {{default}} if not explicitly keyed
      const firstVal = Object.values(inputs)[0] || "";
      template = template.replace(new RegExp(`{{default}}`, "g"), String(firstVal));
      return template;
    }

    case "llmNode": {
      const systemPrompt = node.data?.systemPrompt || "You are a helpful assistant.";
      const userPrompt = inputs["prompt"] || inputs["default"] || Object.values(inputs).join("\n");
      
      return await generateText(userPrompt, systemPrompt, {
        model: node.data?.model,
        temperature: node.data?.temperature
      });
    }

    case "combineNode": {
      return Object.values(inputs).join("\n---\n");
    }

    case "conditionNode": {
      const val = String(Object.values(inputs)[0] || "").toLowerCase();
      return val.includes("true") || val.includes("yes") || val.includes("success");
    }

    case "googleSearchNode": {
      const query = inputs["query"] || inputs["default"] || node.data?.query;
      if (!query) throw new Error("No query provided for Google Search");

      // Placeholder for Google Search API (e.g., Serper.dev or SerpAPI)
      if (!process.env.SERPER_API_KEY) {
        return `[MOCK SEARCH RESULT for "${query}"]: BuildRAX is a visual AI logic builder. It uses Kahn's algorithm for topological sorting.`;
      }

      try {
        const response = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "X-API-KEY": process.env.SERPER_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ q: query }),
        });
        const data = await response.json();
        return data.organic?.map((r: any) => `${r.title}: ${r.snippet}`).join("\n") || "No results found.";
      } catch (error: any) {
        throw new Error(`Search failed: ${error.message}`);
      }
    }

    case "webScraperNode": {
      const url = inputs["url"] || inputs["default"] || node.data?.url;
      if (!url) throw new Error("No URL provided for Web Scraper");
      
      try {
        const response = await fetch(url);
        const html = await response.text();
        // Basic text extraction: remove scripts, styles, and tags
        const cleanText = html
          .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
          .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
          .replace(/<[^>]*>?/gm, " ")
          .replace(/\s+/g, " ")
          .trim();
        return cleanText.substring(0, 5000); // Limit to 5k chars for LLM context
      } catch (error: any) {
        throw new Error(`Scraping failed: ${error.message}`);
      }
    }

    case "outputNode":
      return inputs["default"] || Object.values(inputs)[0] || "";

    default:
      console.warn(`No implementation for node type: ${node.type}`);
      return inputs["default"] || Object.values(inputs)[0] || null;
  }
}
