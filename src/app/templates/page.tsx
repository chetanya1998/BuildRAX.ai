import type { Metadata } from "next";
import { Brand } from "@/components/ui/brand";
import { ButtonLink } from "@/components/ui/button";
import { TemplateLaunchButton } from "@/components/templates/template-launch-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { templates } from "@/lib/domain/templates";
import styles from "./templates.module.css";

export const metadata: Metadata = { title: "Architecture templates" };

export default function TemplatesPage() {
  return <main className={styles.page}><header className={styles.header}><Brand /><div><ThemeToggle /> <ButtonLink href="/start">Start from scratch</ButtonLink></div></header><section className={styles.hero}><span>Trusted starting points</span><h1>Choose structure. Keep every decision editable.</h1><p>Each template is vendor-neutral, schema-validated and ready for AI review, documentation and export.</p></section><section className={styles.grid}>{templates.map((item) => <article className={styles.card} key={item.id}><div><small>{item.category}</small><h2>{item.name}</h2><p>{item.description}</p></div><div className={styles.cardBottom}><span>{item.diagram.nodes.length} components · {item.diagram.connectors.length} flows</span><TemplateLaunchButton template={item} /></div></article>)}</section></main>;
}
