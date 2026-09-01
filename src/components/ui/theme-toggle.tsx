"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./ui.module.css";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("buildrax-theme");
    const selected = stored === "dark" || (!stored && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
    document.documentElement.dataset.theme = selected;
    const frame = requestAnimationFrame(() => setTheme(selected));
    return () => cancelAnimationFrame(frame);
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("buildrax-theme", next);
    document.documentElement.dataset.theme = next;
  }

  return <button className={styles.iconButton} onClick={toggle} aria-label={`Use ${theme === "light" ? "dark" : "light"} theme`} title={`Use ${theme === "light" ? "dark" : "light"} theme`}>{theme === "light" ? <Moon size={17} /> : <Sun size={17} />}</button>;
}
