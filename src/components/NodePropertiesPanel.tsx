import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Settings } from "lucide-react";
import { INTEGRATION_REGISTRY } from "@/lib/integrations";

interface NodePropertiesPanelProps {
  selectedNode: any;
  updateNodeData: (id: string, data: any) => void;
}

export function NodePropertiesPanel({ selectedNode, updateNodeData }: NodePropertiesPanelProps) {
  if (!selectedNode) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm p-4 text-center border-2 border-dashed border-border/40 rounded-xl">
        <Settings className="w-8 h-8 mb-2 opacity-50" />
        <p>Select a node to edit its properties</p>
      </div>
    );
  }

  const { id, type, data } = selectedNode;
  
  const handleChange = (key: string, value: any) => {
    updateNodeData(id, { [key]: value });
  };

  const renderFields = () => {
    switch(type) {
      // --- Core Nodes ---
      case "inputNode":
        return (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Input Value</Label>
              <Textarea className="text-xs min-h-[100px] bg-background/50 border-white/10" value={data?.value || ""} onChange={(e) => handleChange("value", e.target.value)} placeholder="Initial data payload..." />
            </div>
          </div>
        );
      case "promptNode":
        return (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Template String</Label>
              <Textarea className="text-xs min-h-[150px] bg-background/50 border-white/10 font-mono" placeholder="Use {{input}} for variables" value={data?.template || ""} onChange={(e) => handleChange("template", e.target.value)} />
            </div>
          </div>
        );
      case "outputNode":
        return (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Output Label</Label>
              <Input className="text-xs bg-background/50 border-white/10" value={data?.label || ""} onChange={(e) => handleChange("label", e.target.value)} placeholder="Final Response" />
            </div>
          </div>
        );
        
      case "integrationNode": {
        const app = data?.appId ? INTEGRATION_REGISTRY[data.appId] : null;
        if (!app) return <div className="text-sm text-red-400">Invalid App ID</div>;

        const selectedAction = app.actions.find(a => a.id === data?.actionId);

        return (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <app.icon className="w-3 h-3" style={{ color: app.color }}/> 
                {app.name} Action
              </Label>
              <Select value={data?.actionId || ""} onValueChange={(val) => handleChange("actionId", val)}>
                <SelectTrigger className="text-xs bg-background/50 border-white/10">
                  <SelectValue placeholder="Select an action" />
                </SelectTrigger>
                <SelectContent>
                  {app.actions.map(action => (
                    <SelectItem key={action.id} value={action.id}>{action.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAction && <p className="text-[10px] text-muted-foreground/60">{selectedAction.description}</p>}
            </div>

            {selectedAction && (
              <div className="space-y-4 pt-4 border-t border-white/[0.05]">
                {selectedAction.inputs.map(input => (
                   <div key={input.name} className="space-y-1.5">
                     <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                       {input.label} {input.required && <span className="text-red-400">*</span>}
                     </Label>
                     {input.type === "textarea" || input.type === "json" ? (
                       <Textarea 
                         className="text-xs min-h-[80px] bg-background/50 border-white/10 font-mono" 
                         value={data?.[input.name] || ""} 
                         onChange={(e) => handleChange(input.name, e.target.value)} 
                         placeholder={input.placeholder || `Enter ${input.label}...`}
                       />
                     ) : input.type === "password" ? (
                       <Input 
                         type="password" 
                         className="text-xs bg-background/50 border-white/10" 
                         value={data?.[input.name] || ""} 
                         onChange={(e) => handleChange(input.name, e.target.value)} 
                       />
                     ) : (
                       <Input 
                         type="text" 
                         className="text-xs bg-background/50 border-white/10" 
                         value={data?.[input.name] || ""} 
                         onChange={(e) => handleChange(input.name, e.target.value)} 
                         placeholder={input.placeholder || `Enter ${input.label}...`}
                       />
                     )}
                     {input.description && <p className="text-[9px] text-muted-foreground/50">{input.description}</p>}
                   </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      // --- AI Models ---
      case "llmNode":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Model</Label>
              <Select value={data?.model || "gpt-4o"} onValueChange={(val) => handleChange("model", val)}>
                <SelectTrigger className="text-xs bg-background/50 border-white/10"><SelectValue placeholder="Select model" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o (OpenAI)</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (OpenAI)</SelectItem>
                  <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet (Anthropic)</SelectItem>
                  <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (Google)</SelectItem>
                  <SelectItem value="llama3">Llama 3 (Ollama)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">System Prompt</Label>
              <Textarea className="text-xs min-h-[120px] bg-background/50 border-white/10" value={data?.systemPrompt || ""} onChange={(e) => handleChange("systemPrompt", e.target.value)} placeholder="You are a helpful assistant..." />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Temperature</Label>
                <span className="text-[10px] text-muted-foreground">{data?.temperature || 0.7}</span>
              </div>
              <Slider max={2} step={0.1} value={[data?.temperature || 0.7]} onValueChange={(vals) => handleChange("temperature", (vals as number[])[0])} />
            </div>
          </div>
        );
      case "imageGenNode":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Image Prompt</Label>
              <Textarea className="text-xs min-h-[100px] bg-background/50 border-white/10" value={data?.prompt || ""} onChange={(e) => handleChange("prompt", e.target.value)} placeholder="A futuristic city landscape..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Resolution</Label>
              <Select value={data?.size || "1024x1024"} onValueChange={(val) => handleChange("size", val)}>
                <SelectTrigger className="text-xs bg-background/50 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="256x256">256x256</SelectItem>
                  <SelectItem value="512x512">512x512</SelectItem>
                  <SelectItem value="1024x1024">1024x1024</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case "whisperNode":
      case "ttsNode":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Language / Voice</Label>
              <Input className="text-xs bg-background/50 border-white/10" value={data?.config || ""} onChange={(e) => handleChange("config", e.target.value)} placeholder="e.g. en-US" />
            </div>
          </div>
        );

      // --- Search & Knowledge ---
      case "searchNode":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Search Query</Label>
              <Input className="text-xs bg-background/50 border-white/10" value={data?.query || ""} onChange={(e) => handleChange("query", e.target.value)} placeholder="Query or {{input}}" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Engine</Label>
              <Select value={data?.engine || "google"} onValueChange={(val) => handleChange("engine", val)}>
                <SelectTrigger className="text-xs bg-background/50 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="bing">Bing</SelectItem>
                  <SelectItem value="duckduckgo">DuckDuckGo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case "scraperNode":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Target URL</Label>
              <Input className="text-xs bg-background/50 border-white/10" value={data?.url || ""} onChange={(e) => handleChange("url", e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">CSS Selector (Optional)</Label>
              <Input className="text-xs bg-background/50 border-white/10 font-mono" value={data?.selector || ""} onChange={(e) => handleChange("selector", e.target.value)} placeholder="article .content" />
            </div>
          </div>
        );
      case "newsNode":
      case "wikiNode":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Query / Topic</Label>
              <Input className="text-xs bg-background/50 border-white/10" value={data?.query || ""} onChange={(e) => handleChange("query", e.target.value)} placeholder="Topic keyword..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Limit Results</Label>
              <Input type="number" className="text-xs bg-background/50 border-white/10" value={data?.limit || 5} onChange={(e) => handleChange("limit", parseInt(e.target.value))} />
            </div>
          </div>
        );

      // --- Data & Persistence ---
      case "memoryNode":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Collection / Namespace</Label>
              <Input className="text-xs bg-background/50 border-white/10" value={data?.collection || ""} onChange={(e) => handleChange("collection", e.target.value)} placeholder="knowledge-base-v1" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Top-K Results</Label>
              <Input type="number" className="text-xs bg-background/50 border-white/10" value={data?.topK || 3} onChange={(e) => handleChange("topK", parseInt(e.target.value))} />
            </div>
          </div>
        );
      case "mongoNode":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Connection String</Label>
              <Input type="password" className="text-xs bg-background/50 border-white/10" value={data?.uri || ""} onChange={(e) => handleChange("uri", e.target.value)} placeholder="mongodb+srv://..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Database.Collection</Label>
              <Input className="text-xs bg-background/50 border-white/10" value={data?.dbCollection || ""} onChange={(e) => handleChange("dbCollection", e.target.value)} placeholder="app.users" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Operation</Label>
              <Select value={data?.operation || "find"} onValueChange={(val) => handleChange("operation", val)}>
                <SelectTrigger className="text-xs bg-background/50 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="find">Find</SelectItem>
                  <SelectItem value="insertOne">Insert One</SelectItem>
                  <SelectItem value="updateOne">Update One</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case "sheetsNode":
      case "notionNode":
      case "airtableNode":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">API Key / Token</Label>
              <Input type="password" className="text-xs bg-background/50 border-white/10" value={data?.token || ""} onChange={(e) => handleChange("token", e.target.value)} placeholder="Secret Token..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Target ID (Doc/Base/Sheet)</Label>
              <Input className="text-xs bg-background/50 border-white/10" value={data?.targetId || ""} onChange={(e) => handleChange("targetId", e.target.value)} placeholder="ID from URL..." />
            </div>
          </div>
        );

      // --- Communication ---
      case "slackNode":
      case "discordNode":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Webhook URL</Label>
              <Input type="password" className="text-xs bg-background/50 border-white/10" value={data?.webhookUrl || ""} onChange={(e) => handleChange("webhookUrl", e.target.value)} placeholder="https://hooks..." />
            </div>
          </div>
        );
      case "twitterNode":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">API Key</Label>
              <Input type="password" className="text-xs bg-background/50 border-white/10" value={data?.apiKey || ""} onChange={(e) => handleChange("apiKey", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">API Secret</Label>
              <Input type="password" className="text-xs bg-background/50 border-white/10" value={data?.apiSecret || ""} onChange={(e) => handleChange("apiSecret", e.target.value)} />
            </div>
          </div>
        );
      case "emailNode":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">To Email</Label>
              <Input type="email" className="text-xs bg-background/50 border-white/10" value={data?.to || ""} onChange={(e) => handleChange("to", e.target.value)} placeholder="user@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Subject Line</Label>
              <Input className="text-xs bg-background/50 border-white/10" value={data?.subject || ""} onChange={(e) => handleChange("subject", e.target.value)} placeholder="Alert: {{input}}" />
            </div>
          </div>
        );

      // --- Logic & Flow ---
      case "conditionNode":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Condition Expression</Label>
              <Textarea className="text-xs min-h-[80px] bg-background/50 border-white/10 font-mono" value={data?.expression || ""} onChange={(e) => handleChange("expression", e.target.value)} placeholder="input.includes('error')" />
              <p className="text-[9px] text-muted-foreground">Must evaluate to true/false</p>
            </div>
          </div>
        );
      case "combineNode":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Separator</Label>
              <Input className="text-xs bg-background/50 border-white/10 font-mono" value={data?.separator || "\\n"} onChange={(e) => handleChange("separator", e.target.value)} placeholder="\n or , " />
            </div>
          </div>
        );
      case "loopNode":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Max Iterations</Label>
              <Input type="number" className="text-xs bg-background/50 border-white/10" value={data?.maxIterations || 10} onChange={(e) => handleChange("maxIterations", parseInt(e.target.value))} />
            </div>
          </div>
        );
      case "delayNode":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Delay Time (ms)</Label>
              <Input type="number" className="text-xs bg-background/50 border-white/10" value={data?.delayMs || 1000} onChange={(e) => handleChange("delayMs", parseInt(e.target.value))} />
            </div>
          </div>
        );
      case "webhookNode":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Endpoint URL</Label>
              <Input className="text-xs bg-background/50 border-white/10" value={data?.url || ""} onChange={(e) => handleChange("url", e.target.value)} placeholder="https://api..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Method</Label>
              <Select value={data?.method || "GET"} onValueChange={(val) => handleChange("method", val)}>
                <SelectTrigger className="text-xs bg-background/50 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Headers (JSON)</Label>
              <Textarea className="text-xs min-h-[80px] bg-background/50 border-white/10 font-mono" value={data?.headers || ""} onChange={(e) => handleChange("headers", e.target.value)} placeholder='{"Authorization": "Bearer..."}' />
            </div>
          </div>
        );
      case "codeNode":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">JavaScript Code</Label>
              <Textarea className="text-xs min-h-[200px] bg-[#0A0A0B] text-green-400 border-white/10 font-mono" value={data?.code || "function run(inputs) {\n  return inputs;\n}"} onChange={(e) => handleChange("code", e.target.value)} />
            </div>
          </div>
        );

      // --- Security & Commerce ---
      case "authNode":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Required API Key/Role</Label>
              <Input type="password" className="text-xs bg-background/50 border-white/10" value={data?.requiredRole || ""} onChange={(e) => handleChange("requiredRole", e.target.value)} />
            </div>
          </div>
        );
      case "stripeNode":
      case "shopifyNode":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">API Token</Label>
              <Input type="password" className="text-xs bg-background/50 border-white/10" value={data?.token || ""} onChange={(e) => handleChange("token", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Action Type</Label>
              <Select value={data?.action || "read"} onValueChange={(val) => handleChange("action", val)}>
                <SelectTrigger className="text-xs bg-background/50 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Read Data</SelectItem>
                  <SelectItem value="write">Create / Update</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 border border-dashed border-white/10 text-center rounded-xl bg-white/[0.02]">
            <p className="text-xs text-muted-foreground">Basic Node (No custom configuration)</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col h-full">
      <div className="mb-2 pb-4 border-b border-border/40 shrink-0">
        <p className="text-[10px] text-primary/80 uppercase tracking-widest font-bold mb-1">{type} settings</p>
        <p className="text-sm font-medium">{id}</p>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
        {renderFields()}
      </div>
    </div>
  );
}
