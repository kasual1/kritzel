import type { ReactNode } from "react";
import React from "react";
import Link from "@docusaurus/Link";
import Heading from "@theme/Heading";
import { ArrowRight } from "lucide-react";
import { getPreferredFramework, frameworkPaths, subscribeToPreferredFramework } from "@site/src/utils/frameworkPreference";

import styles from "./styles.module.css";

interface CallToActionButton {
  label: string;
  to?: string;
  showArrow?: boolean;
}

interface CallToActionProps {
  title?: string;
  description?: string;
  primaryButton?: CallToActionButton;
}

export default function CallToAction({
  title = "Ready to create something amazing?",
  description = "Start building your infinite canvas experience today. It's ready to use with your favorite framework.",
  primaryButton = { label: "Get Started", showArrow: true },
}: CallToActionProps): ReactNode {
  const [docsPath, setDocsPath] = React.useState(() => frameworkPaths[getPreferredFramework()]);

  React.useEffect(() => {
    setDocsPath(frameworkPaths[getPreferredFramework()]);
    return subscribeToPreferredFramework((framework) => {
      setDocsPath(frameworkPaths[framework]);
    });
  }, []);

  const resolvedTo = primaryButton.to ?? docsPath;

  return (
    <section className={styles.ctaSection}>
      <div className={styles.ctaContent}>
        <Heading as="h2" className={styles.ctaTitle}>
          {title}
        </Heading>
        <p className={styles.ctaDescription}>{description}</p>
        <div className={styles.ctaButtons}>
          <Link
            to={resolvedTo}
            className="button button--primary button--lg"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            {primaryButton.label}
            {primaryButton.showArrow && (
              <span className="buttonIcon">
                <ArrowRight size={24} aria-hidden="true" />
              </span>
            )}
          </Link>
        </div>
      </div>
    </section>
  );
}
