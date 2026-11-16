import React, { type ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import { UPMADE_LOGO_PATH, UPMADE_LOGO_STROKE_WIDTH, UPMADE_LOGO_VIEWBOX } from "@site/src/components/Landing/paths";
import styles from "./styles.module.css";

/**
 * Extra line weight of the mark in this lockup, in path units (the mark is ~349 units tall): a same-coloured
 * outline that brings the hand-drawn lines closer to the bold "Upmade" next to them. Only this lockup gets it,
 * not the favicons or the other logo files. The viewBox grows by the outline, so the CSS height is the inked height.
 */
export const BRAND_MARK_WEIGHT = 0;

const [vx, vy, vw, vh] = UPMADE_LOGO_VIEWBOX.split(" ").map(Number);
const pad = BRAND_MARK_WEIGHT / 2;
const viewBox = [vx - pad, vy - pad, vw + BRAND_MARK_WEIGHT, vh + BRAND_MARK_WEIGHT].join(" ");

/**
 * The Upmade logo + name, linking home. The same lockup in every header: landing and agentic heroes, the blog
 * navigation and the docs navbar. Callers only position it (`className`).
 */
export default function UpmadeBrand({ className }: { className?: string }): ReactNode {
  return (
    <Link to="/" className={clsx(styles.brand, className)}>
      <svg className={styles.mark} viewBox={viewBox} aria-hidden="true">
        <path
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={UPMADE_LOGO_STROKE_WIDTH + BRAND_MARK_WEIGHT}
          strokeLinejoin="round"
          d={UPMADE_LOGO_PATH}
        />
      </svg>
      {/* one flex item, so "up" and "made" stay one word */}
      <span>
        <span className={styles.up}>Up</span>made
      </span>
    </Link>
  );
}
