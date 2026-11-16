import React, { type ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./styles.module.css";

/**
 * PREVIEW: the "upmade" lockup with the pointing-hand mark (variant D, "Marker 12", from
 * tools/logo/pointing-hand-variants). The same lockup in every header: landing and agentic heroes, the blog
 * navigation and the docs navbar. Callers only position it (`className`).
 */
export default function UpdrawBrand({ className }: { className?: string }): ReactNode {
  return (
    <Link to="/" className={clsx(styles.brand, className)}>
      <img className={styles.mark} src={useBaseUrl("/img/pointing-hand-marker.svg")} alt="" aria-hidden="true" />
      {/* one flex item, so "up" and "made" stay one word */}
      <span>
        <span className={styles.up}>Up</span>made
      </span>
    </Link>
  );
}
