import { ArchitectureSandbox } from "@/components/landing/architecture-sandbox";
import { LandingHeader } from "@/components/landing/landing-header";
import styles from "@/components/landing/landing.module.css";

export default function SandboxPage() {
  return <div className={styles.page}>
    <LandingHeader />
    <main id="main"><ArchitectureSandbox /></main>
  </div>;
}
