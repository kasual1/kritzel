import type { ReactNode } from "react";
import styles from "./ImageCard.module.css";

export default function ImageCard({ children }: { children: ReactNode }) {
  return <div className={styles.card}>{children}</div>;
}
