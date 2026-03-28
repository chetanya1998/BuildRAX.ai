import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Globe, Copy, CheckCircle2, Lock, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface PublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: any[];
  edges: any[];
}

export function PublishModal({ open, onOpenChange, nodes, edges }: PublishModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [title, setTitle] = useState("Untitled Agent");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [publishUrl, setPublishUrl] = useState("");

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: title,
          description,
          nodes,
          edges,
          isPublic,
          category: "Community"
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPublishUrl(`https://buildrax.ai/templates/${data._id}`);
        toast.success("Agent Published Successfully!", {
          description: "You've earned XP for sharing with the community.",
          icon: <Sparkles className="w-4 h-4 text-primary" />,
        });
      } else {
        toast.error("Failed to publish agent.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during publishing.");
    } finally {
      setIsPublishing(false);
    }
  };

  const copyLink = () => {
    if (!publishUrl) return;
    navigator.clipboard.writeText(publishUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/40 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Share2 className="w-5 h-5 text-primary" /> Share & Publish Workflow
          </DialogTitle>
          <DialogDescription>
            Publish your AI agent to the community or share it privately.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Agent Title</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Name your creation..." 
                className="bg-background/50 border-white/10" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea 
                id="desc" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this agent do?" 
                className="resize-none bg-background/50 h-20 border-white/10"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Visibility</Label>
            <Tabs value={isPublic ? "public" : "private"} onValueChange={(v) => setIsPublic(v === "public")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-background/50 border border-white/5">
                <TabsTrigger value="public" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 transition-all">
                  <Globe className="w-3.5 h-3.5" /> Public Gallery
                </TabsTrigger>
                <TabsTrigger value="private" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 transition-all">
                  <Lock className="w-3.5 h-3.5" /> Private Link
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-[10px] text-muted-foreground/60 mt-2 uppercase tracking-tight">
              {isPublic 
                ? "Public agents appear in the Community Gallery and grant maximum XP." 
                : "Private agents are only accessible via a direct link."}
            </p>
          </div>

          {!publishUrl && (
            <div className="flex items-center justify-between rounded-2xl border border-primary/20 p-4 bg-primary/5">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Ready to earn XP?
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Publishing your first agent rewards you with 2,500 XP.
                </p>
              </div>
            </div>
          )}
        </div>

        {publishUrl ? (
          <div className="space-y-4 animate-in fade-in zoom-in duration-300">
             <div className="flex items-center gap-2">
                <Input 
                  readOnly 
                  value={publishUrl} 
                  className="h-10 bg-background/50 text-xs font-mono truncate border-primary/20"
                />
                <Button size="icon" variant="secondary" className="h-10 w-10 shrink-0 rounded-xl" onClick={copyLink}>
                  {isCopied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Button variant="outline" className="w-full rounded-xl" onClick={() => onOpenChange(false)}>
                Done
              </Button>
          </div>
        ) : (
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button 
              onClick={handlePublish} 
              disabled={isPublishing || !title.trim()} 
              className="rounded-xl px-8 shadow-lg shadow-primary/20 flex-1 sm:flex-none"
            >
              {isPublishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Publish Agent
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
