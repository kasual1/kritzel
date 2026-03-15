import type { ReactNode } from "react";
import Link from "@docusaurus/Link";
import Heading from "@theme/Heading";
import ArrowRight from "@site/static/img/arrow_right.svg";

import styles from "./styles.module.css";

interface CallToActionButton {
  label: string;
  to: string;
  showArrow?: boolean;
}

interface CallToActionProps {
  title?: string;
  description?: string;
  primaryButton?: CallToActionButton;
  secondaryButton?: CallToActionButton;
}

export default function CallToAction({
  title = "Ready to create something amazing?",
  description = "Start building your infinite canvas experience today. It's free, open-source, and ready to use with your favorite framework.",
  primaryButton = { label: "Get Started", to: "/docs/angular/overview", showArrow: true },
  secondaryButton = { label: "View on GitHub", to: "https://github.com/kasual1/kritzel" },
}: CallToActionProps): ReactNode {
  return (
    <section className={styles.ctaSection}>
      <div className={styles.ctaContent}>
        <Heading as="h2" className={styles.ctaTitle}>
          {title}
        </Heading>
        <p className={styles.ctaDescription}>{description}</p>
        <div className={styles.ctaButtons}>
          <Link
            to={primaryButton.to}
            className="button button--primary button--lg"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            {primaryButton.label}
            {primaryButton.showArrow && (
              <span className="buttonIcon">
                <ArrowRight style={{ width: "24px", height: "24px" }} />
              </span>
            )}
          </Link>
          {secondaryButton && (
            <Link
              to={secondaryButton.to}
              className="button button--secondary button--lg"
            >
              {secondaryButton.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
