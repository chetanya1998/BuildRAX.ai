import OpenAI from "openai";

export type Node = {
  id: string;
  type: string;
  data: any;
};

export type Edge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
};

export class ExecutionEngine {
  private nodes: Node[];
  private edges: Edge[];
  private nodeMap: Map<string, Node>;
  public results: Record<string, any>;

  constructor(nodes: Node[], edges: Edge[]) {
    this.nodes = nodes;
    this.edges = edges;
    this.nodeMap = new Map(nodes.map(n => [n.id, n]));
    this.results = {};
  }

  // Find execution order using Kahn's algorithm for Topological Sorting
  public getExecutionOrder(): string[] {
    const inDegrees: Map<string, number> = new Map();
    const adjList: Map<string, string[]> = new Map();

    this.nodes.forEach(n => {
      inDegrees.set(n.id, 0);
      adjList.set(n.id, []);
    });

    this.edges.forEach(e => {
      if (inDegrees.has(e.target)) {
        inDegrees.set(e.target, (inDegrees.get(e.target) || 0) + 1);
      }
      if (adjList.has(e.source)) {
        adjList.get(e.source)!.push(e.target);
      }
    });

    const queue: string[] = [];
    inDegrees.forEach((deg, id) => {
      if (deg === 0) queue.push(id);
    });

    const order: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      order.push(current);

      const neighbors = adjList.get(current) || [];
      neighbors.forEach(neighbor => {
        const currentDeg = inDegrees.get(neighbor)! - 1;
        inDegrees.set(neighbor, currentDeg);
        if (currentDeg === 0) {
          queue.push(neighbor);
        }
      });
    }

    if (order.length !== this.nodes.length) {
      throw new Error("Cycle detected in the workflow graph, cannot execute.");
    }
    return order;
  }

  // Prepares the context for a node by gathering outputs from its source connections
  public getInputsForNode(nodeId: string): any {
    const incomingEdges = this.edges.filter(e => e.target === nodeId);
    const inputs: any = {};
    incomingEdges.forEach(e => {
      // Default mapping mechanism
      inputs[e.source] = this.results[e.source];
    });
    return inputs;
  }

  // Evaluate the entire DAG
  public async evaluate(): Promise<Record<string, any>> {
    const order = this.getExecutionOrder();

    for (const nodeId of order) {
      const node = this.nodeMap.get(nodeId);
      if (!node) continue;

      const inputs = this.getInputsForNode(nodeId);
      
      try {
        this.results[nodeId] = await this.evaluateNode(node, inputs);
      } catch (error: any) {
        console.error(`Error evaluating node ${nodeId}:`, error);
        this.results[nodeId] = { error: error.message };
        throw new Error(`Node Execution Failed [${node.type}]: ${error.message}`);
      }
    }

    return this.results;
  }

  // Route evaluation based on node type
  private async evaluateNode(node: Node, inputs: any): Promise<any> {
    switch (node.type) {
      case "inputNode":
        return node.data?.value || "";

      case "promptNode": {
        let template = node.data?.template || "";
        // Basic {{default}} or {{sourceId}} replacement
        Object.keys(inputs).forEach(key => {
          const val = inputs[key] || "";
          template = template.replace(new RegExp(`{{${key}}}`, "g"), val);
          template = template.replace(new RegExp(`{{default}}`, "g"), val); // fallback matcher
        });
        return template;
      }

      case "llmNode": {
        const prompt = Object.values(inputs).join("\n");
        const systemPrompt = node.data?.systemPrompt || "You are a helpful assistant.";
        const temperature = parseFloat(node.data?.temperature || "0.7");
        const model = node.data?.model || "gpt-3.5-turbo"; // or gpt-4o

        // Ensure key exists
        if (!process.env.OPENAI_API_KEY) {
          return `[MOCK LLM RESULT for ${model}]: ` + prompt;
        }

        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY || "",
        });

        const completion = await openai.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature,
        });

        return completion.choices[0].message.content;
      }

      case "combineNode": {
        return Object.values(inputs).join("\n");
      }

      case "conditionNode": {
        // Safe evaluation of boolean
        const val = Object.values(inputs).join("").toLowerCase();
        // A real implementation would parse an expression, but for demo:
        return val.includes("true") || val.includes("yes");
      }

      case "outputNode":
        return Object.values(inputs).join("\n");

      default:
        console.warn(`No handler for node type: ${node.type}`);
        return inputs;
    }
  }
}
