import { ArrowBendLeftUp, ArrowRight, Check, ShieldCheck, Scribble } from "@phosphor-icons/react/ssr";
import { ButtonLink } from "@/components/ui/button";
import { Brand } from "@/components/ui/brand";
import { templates } from "@/lib/domain/templates";
import { ArchitectureSandbox } from "./architecture-sandbox";
import { HeroTextMotion } from "./hero-text-motion";
import { LandingHeader } from "./landing-header";
import styles from "./landing.module.css";

const nodes = [
  ["Client", "Product UI", "Browser + mobile"],
  ["Compute", "Application API", "Typed services"],
  ["AI / ML", "Architecture agent", "Schema validated"],
  ["Data", "Primary database", "Tenant isolated"],
  ["Messaging", "Async work", "Retry aware"],
];

export function LandingPage() {
  return <div className={styles.page}>
    <a href="#main" className="skip-link">Skip to content</a>
    <LandingHeader />
    <main id="main">
      <section className={styles.hero}>
        <HeroTextMotion><div className={styles.heroCopyColumn}>
          <div className={styles.eyebrow} data-hero-text><span className={styles.eyebrowDot} />Architecture work, finally connected</div>
          <span className={`${styles.handNote} ${styles.heroNote} animate__animated animate__fadeIn`}><ArrowBendLeftUp size={34} weight="light" /> bring the messy idea</span>
          <h1 data-hero-text>Design software architecture with clarity.</h1>
          <p className={styles.heroCopy} data-hero-text>Describe your system, build it manually, review it with AI and generate implementation-ready documentation—all from one semantic canvas.</p>
          <div className={styles.heroActions} data-hero-text><ButtonLink href="/start">Let&apos;s get started building <ArrowRight size={16} /></ButtonLink><ButtonLink href="/templates" variant="secondary">Explore templates</ButtonLink></div>
        </div></HeroTextMotion>
        <div className={styles.canvasCard} aria-label="Example BuildRAX architecture canvas">
          <div className={styles.canvasTop}><div className={styles.canvasDots}><span /><span /><span /></div><span>Customer support platform · v1</span><span>Saved locally</span></div>
          <div className={styles.canvasArea}>
            {nodes.map(([label, title, meta]) => <div className={styles.demoNode} key={title}><div className={styles.nodeLabel}>{label}</div><div className={styles.nodeTitle}>{title}</div><div className={styles.nodeMeta}>{meta}</div></div>)}
            <ArrowRight className={`${styles.flowArrow} ${styles.arrow1}`} size={30} weight="light" /><ArrowRight className={`${styles.flowArrow} ${styles.arrow2}`} size={30} weight="light" /><ArrowRight className={`${styles.flowArrow} ${styles.arrow3}`} size={30} weight="light" /><ArrowRight className={`${styles.flowArrow} ${styles.arrow4}`} size={30} weight="light" />
            <div className={styles.floatingReview}><div className={styles.reviewTop}><span><ShieldCheck size={13} /> Security review</span><span>3 findings</span></div><div className={styles.reviewText}>Identity is explicit. Add encryption ownership to the data path.</div></div>
            <span className={`${styles.handNote} ${styles.canvasNote}`}><Scribble size={24} /> every connection carries meaning</span>
          </div>
        </div>
      </section>
      <div className={styles.heroBreak} aria-hidden="true" />
      <section id="product" className={styles.section}>
        <div className={styles.sectionHeader}><div><span className={styles.handNote}>one model, many useful views ↓</span><h2>From vague idea to a system you can defend.</h2></div><p>Every action enriches the same typed model. Your canvas, reviews, documentation and exports stay aligned to a known version.</p></div>
        <div className={styles.featureGrid}>{[
          ["01", "Create without friction", "Start from a prompt, a trusted template, or a complete manual canvas. Signup waits until you choose to save."],
          ["02", "Change with control", "AI proposes a visible diff. Apply it as one undoable transaction or cancel without touching your architecture."],
          ["03", "Ship with context", "Generate version-bound reviews and implementation documentation from the semantic model—not from a screenshot."],
        ].map(([index, title, copy]) => <article className={styles.feature} key={index}><span className={styles.featureIndex}>{index}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>
      <ArchitectureSandbox />
      <section id="templates" className={styles.section}>
        <div className={styles.sectionHeader}><div><span className={styles.handNote}>skip the blank-page feeling</span><h2>Begin with proven structure.</h2></div><p>Templates are provider-neutral, validated, editable, and available before authentication.</p></div>
        <div className={styles.templateStrip}>{templates.slice(0, 4).map((item, index) => <a className={styles.template} href={`/start?template=${item.id}`} key={item.id}><span className={styles.templateCode}>0{index + 1} / {item.category}</span><strong>{item.name}</strong><span><Check size={15} /> Open template</span></a>)}</div>
      </section>
      <section id="security" className={styles.cta}><h2>Make the architecture understandable before it becomes expensive.</h2><ButtonLink href="/start" variant="secondary">Create your first diagram <ArrowRight size={16} /></ButtonLink></section>
    </main>
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className={styles.footerBrand}><Brand /><p>Model software architecture with the context to build, review and share it clearly.</p></div>
        <div className={styles.footerLinks}>
          <div><strong>Explore</strong><a href="/how-it-works">How it works</a><a href="/sandbox">Sandbox</a><a href="/templates">Templates</a></div>
          <div><strong>Product</strong><a href="/start">Create a diagram</a><a href="/security">Security</a><a href="/dashboard">Your projects</a></div>
          <div><strong>Resources</strong><a href="/templates">Architecture starters</a><a href="/security">Security approach</a><a href="mailto:hello@buildrax.ai">Contact</a></div>
        </div>
      </div>
      <div className={styles.footerBottom}><span>© 2026 BuildRAX</span><span>Architecture with clarity. AI changes stay reviewable.</span></div>
    </footer>
  </div>;
}
