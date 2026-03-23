import { evaluateNodeLogic, Node } from "./node-evaluator";

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
    return evaluateNodeLogic(node, inputs);
  }
}
