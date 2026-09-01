"use client";

import { ArrowBendRightDown, ArrowRight, List, X } from "@phosphor-icons/react";
import { useState } from "react";
import { Brand } from "@/components/ui/brand";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useHydrated } from "@/lib/ui/use-hydrated";
import styles from "./landing.module.css";

const navigation = [
  ["How it works", "/how-it-works"],
  ["Sandbox", "/sandbox"],
  ["Templates", "/templates"],
  ["Security", "/security"],
] as const;

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();

  return <header className={styles.headerShell}>
    <div className={styles.nav}>
      <div className={styles.brandGroup}><Brand /></div>
      <nav className={styles.navLinks} aria-label="Primary">{navigation.map(([label, href]) => <a href={href} key={href}>{label}</a>)}</nav>
      <div className={styles.navActions}>
        <ButtonLink href="/sign-in" variant="secondary">Sign in</ButtonLink>
        <ThemeToggle />
        <div className={styles.navCtaWrap}>
          <span className={styles.navNote}>first diagram is free <ArrowBendRightDown size={24} weight="light" /></span>
          <ButtonLink href="/start">Start building <ArrowRight size={15} weight="bold" /></ButtonLink>
        </div>
      </div>
      <div className={styles.mobileActions}><ThemeToggle /><button className={styles.menuButton} disabled={!hydrated} onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Close navigation" : "Open navigation"}>{open ? <X size={20} /> : <List size={22} />}</button></div>
    </div>
    {open && <div id="mobile-navigation" className={styles.mobileMenu}><nav aria-label="Mobile navigation">{navigation.map(([label, href]) => <a href={href} key={href} onClick={() => setOpen(false)}>{label}<ArrowRight size={15} /></a>)}</nav><div><ButtonLink href="/sign-in" variant="secondary">Sign in</ButtonLink><ButtonLink href="/start">Start building <ArrowRight size={15} /></ButtonLink></div></div>}
  </header>;
}
