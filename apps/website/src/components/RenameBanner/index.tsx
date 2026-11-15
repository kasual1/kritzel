import type { ReactNode } from "react";
import { UPDRAW_LOGO_PATH, UPDRAW_LOGO_STROKE_WIDTH, UPDRAW_LOGO_VIEWBOX } from "@site/src/components/Landing/paths";
import { KRITZEL_LOGO_PATH, KRITZEL_LOGO_VIEWBOX } from "./kritzelLogo";
import styles from "./styles.module.css";

/** Black notification bar shown at the top of the landing pages announcing the rename, each name with its logo. */
export default function RenameBanner(): ReactNode {
  return (
    <div className={styles.banner} role="status">
      <svg className={`${styles.logo} ${styles.oldLogo}`} viewBox={KRITZEL_LOGO_VIEWBOX} aria-hidden="true">
        <path fill="currentColor" stroke="currentColor" d={KRITZEL_LOGO_PATH} />
      </svg>
      <strong>Kritzel</strong> is now{" "}
      <svg className={styles.logo} viewBox={UPDRAW_LOGO_VIEWBOX} aria-hidden="true">
        <path
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={UPDRAW_LOGO_STROKE_WIDTH}
          strokeLinejoin="round"
          d={UPDRAW_LOGO_PATH}
        />
      </svg>
      <strong>Updraw</strong>
    </div>
  );
}
