import Link from "next/link";
import styles from "./ui.module.css";

export function Brand() {
  return <Link href="/" className={styles.logo} aria-label="BuildRAX home"><span className={styles.logoMark}>BR</span><span>BuildRAX</span></Link>;
}
