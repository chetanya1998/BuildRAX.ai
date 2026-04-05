/**
 * Strips sensitive data (like API keys and tokens) from a workflow's nodes
 * to ensure they are not exposed when saving public templates or exporting.
 */
export function scrubSensitiveNodeData(nodes: any[]): any[] {
  if (!Array.isArray(nodes)) return [];
  
  return nodes.map(node => {
    // Clone the node deeply to avoid mutating external state
    const safeNode = JSON.parse(JSON.stringify(node));
    
    if (safeNode.data) {
      // List of properties to delete from the data object
      const sensitiveKeys = ['apiKey', 'token', 'secret', 'password', 'oauth_token'];
      
      // We check all fields inside node.data
      for (const key of Object.keys(safeNode.data)) {
        // Direct matching or if key contains 'apikey', 'token' case-insensitive
        const lowerKey = key.toLowerCase();
        if (
          sensitiveKeys.includes(key) || 
          lowerKey.includes('apikey') || 
          lowerKey.includes('token') ||
          lowerKey.includes('secret')
        ) {
          delete safeNode.data[key];
        }
      }
    }
    
    return safeNode;
  });
}
