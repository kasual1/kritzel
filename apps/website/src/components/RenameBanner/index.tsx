import type { ReactNode } from "react";
import { UPMADE_LOGO_PATH, UPMADE_LOGO_STROKE_WIDTH, UPMADE_LOGO_VIEWBOX } from "@site/src/components/Landing/paths";
import { KRITZEL_LOGO_PATH, KRITZEL_LOGO_VIEWBOX } from "./kritzelLogo";
import styles from "./styles.module.css";

/**
 * Black notification bar announcing the rename, each name with its logo. Rendered on every page as Docusaurus'
 * announcement bar (src/theme/AnnouncementBar, themeConfig.announcementBar).
 */
export default function RenameBanner(): ReactNode {
  return (
    <div className={styles.banner} role="status">
      <svg className={`${styles.logo} ${styles.oldLogo}`} viewBox={KRITZEL_LOGO_VIEWBOX} aria-hidden="true">
        <path fill="currentColor" stroke="currentColor" d={KRITZEL_LOGO_PATH} />
      </svg>
      <strong>Kritzel</strong> is now{" "}
      <svg className={`${styles.logo} ${styles.newLogo}`} viewBox={UPMADE_LOGO_VIEWBOX} aria-hidden="true">
        <path
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={UPMADE_LOGO_STROKE_WIDTH}
          strokeLinejoin="round"
          d={UPMADE_LOGO_PATH}
        />
      </svg>
      {/* styled like the header lockup (UpmadeBrand): a light italic "up", a semibold "made" */}
      <strong className={styles.upmade}>
        <span className={styles.up}>Up</span>made
      </strong>
    </div>
  );
}
