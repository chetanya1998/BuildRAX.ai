import Link from "next/link";
import { ArrowLeft, Edit3, Github, Globe, Hexagon, Shield, Star, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  const userName = session?.user?.name || "Test User";
  const userEmail = session?.user?.email || "No Email";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <header className="h-16 flex items-center px-6 border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-card/50">
        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full mr-4" asChild>
          <Link href="/dashboard"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <span className="font-semibold">Profile & Progress</span>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-8 space-y-8 mt-4">
        
        {/* Profile Card */}
        <div className="glass-panel p-8 rounded-3xl border-border/40 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="w-24 h-24 rounded-2xl bg-gradient-primary p-0.5 shrink-0 relative z-10">
            <div className="w-full h-full bg-card rounded-2xl flex items-center justify-center overflow-hidden">
              {session?.user?.image ? (
                <img src={session.user.image} alt={userName} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-primary">{userInitial}</span>
              )}
            </div>
          </div>
          
          <div className="flex-1 relative z-10 w-full">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <h1 className="text-3xl font-semibold mb-1">{userName}</h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  {userEmail} <span className="w-1 h-1 rounded-full bg-border/80" /> Joined Today
                </p>
              </div>
              <Button variant="outline" size="sm" className="rounded-full bg-background"><Edit3 className="w-4 h-4 mr-2"/> Edit Profile</Button>
            </div>
            
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
               <div>
                 <p className="text-sm text-muted-foreground mb-1">Total XP</p>
                 <p className="text-2xl font-bold text-primary">150</p>
               </div>
               <div>
                 <p className="text-sm text-muted-foreground mb-1">Workflows</p>
                 <p className="text-2xl font-bold">4</p>
               </div>
               <div>
                 <p className="text-sm text-muted-foreground mb-1">Templates Cloned</p>
                 <p className="text-2xl font-bold">2</p>
               </div>
               <div>
                 <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
                 <p className="text-2xl font-bold text-amber-500">3 Days</p>
               </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="badges">
          <TabsList className="bg-transparent border-b border-border/40 w-full justify-start rounded-none p-0 h-auto mb-8">
            <TabsTrigger value="badges" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-muted-foreground data-[state=active]:text-foreground">Badges</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-muted-foreground data-[state=active]:text-foreground">Detailed Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="badges" className="m-0 space-y-8">
            <h3 className="text-xl font-medium">Earned Badges</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               <div className="bg-card/30 border border-primary/30 p-6 rounded-2xl flex flex-col items-center text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border-2 border-primary/20">
                    <Trophy className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-semibold text-primary">First Build</h4>
                  <p className="text-xs text-muted-foreground mt-2">Completed your first AI workflow execution.</p>
               </div>
               <div className="bg-card/10 border border-border/20 p-6 rounded-2xl flex flex-col items-center text-center opacity-50 grayscale">
                  <div className="w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center mb-4 border-2 border-border/20">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h4 className="font-semibold">Community Builder</h4>
                  <p className="text-xs text-muted-foreground mt-2">Publish a workflow that gets 10+ clones.</p>
               </div>
               <div className="bg-card/10 border border-border/20 p-6 rounded-2xl flex flex-col items-center text-center opacity-50 grayscale">
                  <div className="w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center mb-4 border-2 border-border/20">
                    <Hexagon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h4 className="font-semibold">Prompt Tuner</h4>
                  <p className="text-xs text-muted-foreground mt-2">Edit a prompt node and successfully reduce latency.</p>
               </div>
               <div className="bg-card/10 border border-border/20 p-6 rounded-2xl flex flex-col items-center text-center opacity-50 grayscale">
                  <div className="w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center mb-4 border-2 border-border/20">
                    <Shield className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h4 className="font-semibold">Agent Explorer</h4>
                  <p className="text-xs text-muted-foreground mt-2">Use memory and tools in the same workflow.</p>
               </div>
            </div>
            
            <div className="glass-panel p-6 rounded-2xl border border-border/40 mt-12 text-center">
               <h3 className="font-medium mb-2">Next Level unlocking soon</h3>
               <p className="text-sm text-muted-foreground mb-6">Reach 500 XP to become an AI Builder</p>
               <Progress value={30} className="w-full max-w-md mx-auto h-2 bg-background" />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
