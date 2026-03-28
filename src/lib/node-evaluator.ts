import OpenAI from "openai";
import { generateText } from "./litellm";

export type Node = {
  id: string;
  type: string;
  data: any;
};

export async function evaluateNodeLogic(node: Node, inputs: any): Promise<any> {
  const getFirstInput = () => inputs["default"] || Object.values(inputs)[0] || "";

  switch (node.type) {
    case "inputNode":
      return node.data?.value || getFirstInput();

    case "promptNode": {
      let template = node.data?.template || "";
      for (const [key, val] of Object.entries(inputs)) {
        template = template.replace(new RegExp(`{{${key}}}`, "g"), String(val));
      }
      const firstVal = getFirstInput();
      template = template.replace(new RegExp(`{{default}}`, "g"), String(firstVal));
      return template;
    }

    case "llmNode": {
      const systemPrompt = node.data?.systemPrompt || "You are a helpful assistant.";
      const userPrompt = inputs["prompt"] || getFirstInput();
      
      return await generateText(userPrompt, systemPrompt, {
        model: node.data?.model,
        temperature: node.data?.temperature
      });
    }

    case "imageGenNode": {
      const prompt = inputs["prompt"] || getFirstInput() || node.data?.prompt;
      if (!prompt) throw new Error("No prompt provided for image generation");

      if (!process.env.OPENAI_API_KEY) {
        return `[MOCK IMAGE GENERATED for "${prompt}"] - Add OPENAI_API_KEY to see real image generation.`;
      }
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
        });
        return response.data[0]?.url || "[Image Generation Failed]";
      } catch (err: any) {
        throw new Error(`Image Gen failed: ${err.message}`);
      }
    }

    case "whisperNode":
    case "ttsNode": {
      const text = getFirstInput();
      return `[MOCK Audio process completed for ${node.type} with input length ${String(text).length}]`;
    }

    case "combineNode": {
      return Object.values(inputs).join("\n---\n");
    }

    case "conditionNode": {
      const val = String(getFirstInput()).toLowerCase();
      const isTruthy = val.includes("true") || val.includes("yes") || val.includes("success");
      
      // Pass the state along in a branching decision
      return isTruthy;
    }

    case "searchNode":
    case "googleSearchNode": {
      const query = inputs["query"] || getFirstInput() || node.data?.query;
      if (!query) throw new Error("No query provided for Google Search");

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

    case "newsNode": {
      const query = inputs["query"] || getFirstInput() || node.data?.query;
      
      if (!process.env.SERPER_API_KEY) {
        return `[MOCK NEWS RESULT for "${query}"]: Scientists discover new AI capabilities. Market responds positively.`;
      }

      try {
        const response = await fetch("https://google.serper.dev/news", {
          method: "POST",
          headers: {
            "X-API-KEY": process.env.SERPER_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ q: query }),
        });
        const data = await response.json();
        return data.news?.map((r: any) => `${r.title} - ${r.source}`).join("\n") || "No news found.";
      } catch (error: any) {
        throw new Error(`News search failed: ${error.message}`);
      }
    }

    case "wikiNode": {
      const query = inputs["query"] || getFirstInput() || node.data?.query;
      if (!query) throw new Error("No query provided for Wikipedia Search");

      try {
        const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(query)}`;
        const response = await fetch(wikiUrl);
        const data = await response.json();
        
        const pages = data.query?.pages;
        if (!pages) return "No Wikipedia results found.";
        
        const pageId = Object.keys(pages)[0];
        if (pageId === "-1") return `Wikipedia article for "${query}" not found.`;
        
        return pages[pageId].extract;
      } catch (err: any) {
        throw new Error(`Wikipedia fetch failed: ${err.message}`);
      }
    }

    case "scraperNode":
    case "webScraperNode": {
      const url = inputs["url"] || getFirstInput() || node.data?.url;
      if (!url) throw new Error("No URL provided for Web Scraper");
      
      try {
        const response = await fetch(url);
        const html = await response.text();
        const cleanText = html
          .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
          .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
          .replace(/<[^>]*>?/gm, " ")
          .replace(/\s+/g, " ")
          .trim();
        return cleanText.substring(0, 5000);
      } catch (error: any) {
        throw new Error(`Scraping failed: ${error.message}`);
      }
    }

    case "memoryNode":
    case "mongoNode":
    case "sheetsNode":
    case "notionNode":
    case "airtableNode": {
      const action = node.data?.action || "Retrieve/Storage";
      const payload = getFirstInput();
      return `[MOCK ${node.type} Operation Successful: action=${action}, payload_length=${String(payload).length}]`;
    }

    case "loopNode": {
      const data = inputs["array"] || getFirstInput();
      const isArray = Array.isArray(data);
      return `[MOCK Loop Executed over ${isArray ? data.length : 1} items]`;
    }

    case "delayNode": {
      const delayMs = parseInt(inputs["delay"] || node.data?.delay || "1000", 10);
      await new Promise(r => setTimeout(r, delayMs));
      const val = getFirstInput();
      return val ? val : `[Delayed for ${delayMs}ms]`;
    }

    case "webhookNode": {
      const url = inputs["url"] || node.data?.url;
      const method = node.data?.method || "POST";
      const body = inputs["body"] || Object.values(inputs)[0];
      
      if (!url) throw new Error("No webhook URL configured");
      
      try {
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: method !== "GET" ? JSON.stringify(body) : undefined
        });
        
        if (!response.ok) {
          throw new Error(`Webhook responded with status ${response.status}`);
        }
        
        return await response.text();
      } catch (err: any) {
        throw new Error(`Webhook trigger failed: ${err.message}`);
      }
    }

    case "codeNode": {
      const codeStr = inputs["code"] || node.data?.code;
      if (!codeStr) throw new Error("No code snippet provided");

      try {
        // Simple and potent (but insecure!) JS evaluation:
        const wrappedCode = `
          try {
            ${codeStr}
          } catch(e) {
            return { error: e.message };
          }
        `;
        const fn = new Function("inputs", wrappedCode);
        return fn(inputs);
      } catch (err: any) {
        throw new Error(`Code Execution failed: ${err.message}`);
      }
    }

    case "slackNode":
    case "discordNode":
    case "twitterNode":
    case "emailNode":
    case "stripeNode":
    case "shopifyNode": {
      const payload = getFirstInput();
      return `[MOCK Integration Fired: ${node.type}] successfully delivered payload length ${String(payload).length}.`;
    }

    case "authNode": {
      const token = inputs["token"] || inputs["default"] || node.data?.token;
      return !!token;
    }

    case "outputNode":
      return getFirstInput();

    default:
      console.warn(`No implementation for node type: ${node.type}`);
      return getFirstInput() || null;
  }
}
