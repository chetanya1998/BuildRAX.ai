"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bot, Plus, Loader2, Save, MessageSquare, Play, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AgentModel {
  _id: string;
  name: string;
  description: string;
  systemPrompt: string;
  maxIter: number;
  memoryEnabled: boolean;
  capabilities: string[];
}

export default function AgentsPage() {
  const { data: agents, mutate, isLoading } = useSWR<AgentModel[]>("/api/agents", fetcher);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");

  const selectedAgent = agents?.find((a) => a._id === selectedAgentId);

  const [formData, setFormData] = useState<Partial<AgentModel>>({});

  const handleSelectAgent = (agent: AgentModel) => {
    setSelectedAgentId(agent._id);
    setFormData(agent);
    setChatMessages([{ role: "assistant", content: `Hello! I am ${agent.name}. How can I help you?` }]);
  };

  const handleCreateAgent = async () => {
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Agent",
          description: "A helpful assistant.",
          systemPrompt: "You are an intelligent agent. Use tools as needed.",
          capabilities: ["chat", "tools"],
          memoryEnabled: true,
          maxIter: 5,
        }),
      });
      if (!res.ok) throw new Error("Failed to create agent");
      const newAgent = await res.json();
      mutate();
      handleSelectAgent(newAgent);
      toast.success("Agent created");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSaveAgent = async () => {
    if (!selectedAgentId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/agents/${selectedAgentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to save agent");
      mutate();
      toast.success("Agent saved");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsgs = [...chatMessages, { role: "user", content: chatInput }];
    setChatMessages(newMsgs);
    setChatInput("");

    // Simulate Agent response
    setTimeout(() => {
      setChatMessages([...newMsgs, { role: "assistant", content: `I have received your message: "${chatInput}". I am powered by Gemma 4 and currently in Sandbox mode.` }]);
    }, 1000);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-[#0a0f18]">
      {/* LEFT PANE - Agent List */}
      <aside className="w-64 border-r border-white/10 flex flex-col bg-white/[0.02]">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2 text-white">
            <Bot className="w-4 h-4 text-sky-400" /> My Agents
          </h2>
          <Button variant="ghost" size="icon" onClick={handleCreateAgent} className="w-7 h-7 rounded-lg hover:bg-white/10">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-3 flex-1 overflow-y-auto space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
          ) : agents?.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center p-4">No agents found.</p>
          ) : (
            agents?.map((agent) => (
              <button
                key={agent._id}
                onClick={() => handleSelectAgent(agent)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 border border-transparent",
                  selectedAgentId === agent._id
                    ? "bg-sky-500/10 text-sky-100 border-sky-500/20"
                    : "text-muted-foreground hover:bg-white/[0.05] hover:text-white"
                )}
              >
                <div className="font-medium truncate">{agent.name}</div>
                <div className="text-[10px] truncate opacity-70 mt-0.5">{agent.description}</div>
              </button>
            ))
          )}
        </div>
      </aside>

      {selectedAgentId ? (
        <>
          {/* MIDDLE PANE - Agent Config */}
          <section className="flex-1 border-r border-white/10 flex flex-col bg-transparent">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2 text-white">
                <Settings2 className="w-4 h-4 text-emerald-400" /> Configuration
              </h2>
              <Button onClick={handleSaveAgent} disabled={isSaving} size="sm" className="h-7 text-xs bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded-lg">
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                Save Changes
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-widest">Agent Name</Label>
                  <Input 
                    value={formData.name || ""} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="bg-black/20 border-white/10 text-sm h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-widest">Description</Label>
                  <Input 
                    value={formData.description || ""} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="bg-black/20 border-white/10 text-sm h-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-widest">System Prompt</Label>
                <Textarea 
                  value={formData.systemPrompt || ""} 
                  onChange={e => setFormData({...formData, systemPrompt: e.target.value})}
                  className="bg-black/20 border-white/10 text-sm min-h-[160px] rounded-xl font-mono leading-relaxed"
                  placeholder="Define the persona and rules..."
                />
              </div>

              <div className="space-y-4 max-w-sm">
                <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Persistent Memory</Label>
                    <p className="text-[10px] text-muted-foreground tracking-wide">Allow agent to remember past context.</p>
                  </div>
                  <Switch 
                    checked={formData.memoryEnabled} 
                    onCheckedChange={c => setFormData({...formData, memoryEnabled: c})} 
                  />
                </div>

                <div className="space-y-1.5 bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                  <Label className="text-xs text-muted-foreground uppercase tracking-widest">Max Autonomous Iterations</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Input 
                      type="number" 
                      value={formData.maxIter || 3} 
                      onChange={e => setFormData({...formData, maxIter: parseInt(e.target.value)})}
                      className="bg-black/20 border-white/10 w-24 h-9 text-center text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Limits recursive tool calling to prevent loops.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT PANE - Playground */}
          <section className="w-[380px] flex flex-col bg-black/20">
             <div className="p-4 border-b border-white/10">
              <h2 className="font-semibold text-sm flex items-center gap-2 text-white">
                <Play className="w-4 h-4 text-rose-400" /> Playground Sandbox
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={cn(
                  "px-3 py-2.5 rounded-xl text-sm w-fit max-w-[85%]",
                  msg.role === "user" 
                    ? "bg-rose-500/15 text-rose-50 ml-auto border border-rose-500/20" 
                    : "bg-white/5 text-white/90 border border-white/10 mr-auto"
                )}>
                  {msg.content}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-white/10 bg-white/[0.02]">
              <form onSubmit={handleChatSubmit} className="relative">
                <Input 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Message your agent..."
                  className="w-full bg-black/40 border-white/10 pr-10 rounded-xl h-10 text-sm"
                />
                <Button size="icon" type="submit" variant="ghost" className="absolute right-1 top-1 w-8 h-8 rounded-lg hover:bg-white/10 text-muted-foreground">
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </section>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <Bot className="w-12 h-12 mb-4 opacity-20" />
          <p>Select an agent from the sidebar or create a new one.</p>
        </div>
      )}
    </div>
  );
}
