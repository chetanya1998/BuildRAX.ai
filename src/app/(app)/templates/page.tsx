import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BrainCircuit, Box, FileText, Blocks, LayoutPanelTop, Play } from "lucide-react";

const TEMPLATES = [
  {
    title: "Resume Analyzer",
    description: "Upload a resume and get structured feedback.",
    level: "Beginner",
    time: "2 mins",
    tags: ["HR", "Analysis"],
    icon: <FileText className="w-5 h-5 text-blue-400" />
  },
  {
    title: "Research Synthesizer",
    description: "Paste multiple sources and get themes, summaries, and key takeaways.",
    level: "Intermediate",
    time: "5 mins",
    tags: ["Learning", "Memory"],
    icon: <BrainCircuit className="w-5 h-5 text-purple-400" />
  },
  {
    title: "Daily Planner Assistant",
    description: "Turn rough tasks into a prioritized day plan.",
    level: "Beginner",
    time: "3 mins",
    tags: ["Productivity", "Input"],
    icon: <LayoutPanelTop className="w-5 h-5 text-green-400" />
  },
  {
    title: "Content Generator",
    description: "Generate social post drafts from a topic and tone.",
    level: "Beginner",
    time: "2 mins",
    tags: ["Writing", "Social"],
    icon: <Box className="w-5 h-5 text-orange-400" />
  },
  {
    title: "Simple Research Agent",
    description: "Use input + tool + model to gather and summarize knowledge.",
    level: "Advanced",
    time: "10 mins",
    tags: ["Agent", "Tools"],
    icon: <Blocks className="w-5 h-5 text-red-400" />
  }
];

export default function TemplatesPage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-border/40">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Starter Templates</h1>
            <p className="text-muted-foreground">Don't start from scratch. Clone a template and learn how it works.</p>
          </div>
          <div className="flex w-full md:w-auto items-center relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
            <Input placeholder="Search templates..." className="pl-9 h-10 w-full md:w-64 bg-card/30" />
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-card/20 border border-border/40 mb-8 inline-flex flex-wrap h-auto p-1 py-1">
            <TabsTrigger value="all" className="rounded-md">All Templates</TabsTrigger>
            <TabsTrigger value="writing" className="rounded-md">Writing</TabsTrigger>
            <TabsTrigger value="research" className="rounded-md">Research</TabsTrigger>
            <TabsTrigger value="productivity" className="rounded-md">Productivity</TabsTrigger>
            <TabsTrigger value="agents" className="rounded-md">Agents</TabsTrigger>
          </TabsList>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEMPLATES.map((tmpl, index) => (
              <Card key={index} className="bg-card/20 border-border/40 hover:border-primary/40 transition-all flex flex-col group cursor-pointer overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-4 relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-background/50 border border-border/40 flex items-center justify-center">
                      {tmpl.icon}
                    </div>
                    <Badge variant="outline" className="bg-background/50 backdrop-blur-sm">
                      {tmpl.level}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{tmpl.title}</CardTitle>
                  <CardDescription className="text-sm mt-2 line-clamp-2">
                    {tmpl.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 relative z-10">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {tmpl.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 rounded-md bg-secondary/10 text-secondary-foreground font-medium">#{tag}</span>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t border-border/20 flex justify-between items-center relative z-10">
                  <span className="text-xs text-muted-foreground">{tmpl.time} to build</span>
                  <Button size="sm" className="rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all -translate-y-2 group-hover:translate-y-0" asChild>
                    <Link href={`/builder?template=${index}`}>
                      <Play className="w-3.5 h-3.5 mr-1" /> Clone to Builder
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </Tabs>
      </div>
  );
}
