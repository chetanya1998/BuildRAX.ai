import { ArrowRight } from "lucide-react";
import { Brand } from "@/components/ui/brand";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import styles from "./info-page.module.css";

type PageContent = {
  eyebrow: string;
  title: string;
  intro: string;
  cards: Array<{ title: string; copy: string }>;
};

const content: Record<"how-it-works" | "sandbox" | "security", PageContent> = {
  "how-it-works": {
    eyebrow: "How BuildRAX works",
    title: "Move from an idea to a system your team can build.",
    intro: "Describe the outcome, shape the model on a semantic canvas, then use version-bound reviews and documentation to keep the work aligned.",
    cards: [
      { title: "Describe", copy: "Start with a prompt, a trusted template, or a blank canvas." },
      { title: "Model", copy: "Use typed components and connections to make intent visible." },
      { title: "Decide", copy: "Review trade-offs and export a clear implementation handoff." },
    ],
  },
  sandbox: {
    eyebrow: "Architecture sandbox",
    title: "Test the story your architecture tells.",
    intro: "Explore happy paths, access boundaries and traffic spikes in the same visual model before implementation adds cost and complexity.",
    cards: [
      { title: "Happy path", copy: "Trace a valid request through identity, service and data controls." },
      { title: "Access denied", copy: "See workspace authorization and RLS stop an invalid request." },
      { title: "Traffic spike", copy: "Follow queues and idempotency through a resilient recovery path." },
    ],
  },
  security: {
    eyebrow: "Security by design",
    title: "Make important architecture controls explicit early.",
    intro: "BuildRAX treats permissions, tenancy, data classification and delivery paths as part of the model—not footnotes after the diagram is done.",
    cards: [
      { title: "Reviewable changes", copy: "AI suggestions arrive as a visible preview before they affect the diagram." },
      { title: "Version context", copy: "Reviews and documentation always reference the diagram version they examined." },
      { title: "Safer sharing", copy: "Read-only links are scoped, expiring and revocable when sharing is enabled." },
    ],
  },
};

export function InfoPage({ page }: { page: keyof typeof content }) {
  const item = content[page];
  return <main className={styles.page}>
    <header className={styles.header}><Brand /><div><ButtonLink href="/">Home</ButtonLink><ThemeToggle /></div></header>
    <section className={styles.hero}><span>{item.eyebrow}</span><h1>{item.title}</h1><p>{item.intro}</p><ButtonLink href="/start">Start building <ArrowRight size={16} /></ButtonLink></section>
    <section className={styles.grid}>{item.cards.map((card, index) => <article className={styles.card} key={card.title}><small>0{index + 1}</small><h2>{card.title}</h2><p>{card.copy}</p></article>)}</section>
  </main>;
}
