import type { ReactNode } from "react";
import styles from "./styles.module.css";

/** Black notification bar shown at the top of the landing pages announcing the rename. */
export default function RenameBanner(): ReactNode {
  return (
    <div className={styles.banner} role="status">
      <strong>Kritzel</strong> is now <strong>Updraw</strong>
    </div>
  );
}
