import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./ui.module.css";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "tertiary"; children: ReactNode };

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={`${styles.button} ${styles[variant]} ${className}`} {...props} />;
}

export function ButtonLink({ href, variant = "primary", children, className = "" }: { href: string; variant?: "primary" | "secondary" | "tertiary"; children: ReactNode; className?: string }) {
  return <a href={href} className={`${styles.button} ${styles[variant]} ${className}`}>{children}</a>;
}
