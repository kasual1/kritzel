import type { ReactNode } from "react";
import Link from "@docusaurus/Link";
import { ArrowIcon } from "@site/src/components/Landing/Icon";
import { UPMADE_LOGO_PATH, UPMADE_LOGO_STROKE_WIDTH, UPMADE_LOGO_VIEWBOX } from "@site/src/components/Landing/paths";
import { KRITZEL_LOGO_PATH, KRITZEL_LOGO_VIEWBOX } from "./kritzelLogo";
import styles from "./styles.module.css";

/** The post announcing the rename (blog/2026-11-17-kritzel-is-now-upmade.md). */
const BLOG_POST_PATH = "/blog/2026/11/17/kritzel-is-now-upmade/";

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
      <Link className={styles.link} to={BLOG_POST_PATH} aria-label="Read more about the rename in the blog post">
        Read more<ArrowIcon />
      </Link>
    </div>
  );
}
