import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Globe, Copy, CheckCircle2, Lock } from "lucide-react";

export function PublishModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [isCopied, setIsCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText("https://buildrax.ai/v/res-analyzer-xd8");
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Share2 className="w-5 h-5 text-primary" /> Share Workflow
          </DialogTitle>
          <DialogDescription>
            Publish your AI agent to the community or share it privately.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input id="title" defaultValue="Resume Analyzer" className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea 
                id="desc" 
                defaultValue="Upload or paste a resume and get structured feedback based on standard ATS parameters." 
                className="resize-none bg-background/50 h-20"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Visibility</Label>
            <Tabs defaultValue="public" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-background/50">
                <TabsTrigger value="public" className="data-[state=active]:bg-card data-[state=active]:text-primary flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> Public
                </TabsTrigger>
                <TabsTrigger value="private" className="data-[state=active]:bg-card data-[state=active]:text-primary flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" /> Private Link
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs text-muted-foreground mt-2">
              Public workflows appear in the Template Gallery and can be remixed by the community. Private workflows are only accessible via link.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/40 p-4 bg-background/30">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Allow Remixing</Label>
              <p className="text-xs text-muted-foreground">
                Others can clone this logic to build their own endpoints.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>

        <DialogFooter className="sm:justify-between items-center gap-4">
          <div className="flex flex-1 items-center gap-2 w-full max-w-[65%]">
            <Input 
              readOnly 
              value="https://buildrax.ai/v/res-analyzer-xd8" 
              className="h-9 bg-background/50 text-xs font-mono truncate"
            />
            <Button size="icon" variant="secondary" className="h-9 w-9 shrink-0" onClick={copyLink}>
              {isCopied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <Button onClick={() => onOpenChange(false)} className="rounded-full shadow-lg shadow-primary/20">
            Save & Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
