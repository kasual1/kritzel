import type { ReactNode } from "react";
import React from "react";
import Link from "@docusaurus/Link";
import Heading from "@theme/Heading";
import { ArrowRight } from "lucide-react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { getPreferredFramework, subscribeToPreferredFramework, type Framework } from "@site/src/utils/frameworkPreference";

import styles from "./styles.module.css";

const quickStartPaths: Record<Framework, string> = {
  angular: "/docs/angular/getting-started/quick-start",
  react: "/docs/react/getting-started/quick-start",
  vue: "/docs/vue/getting-started/quick-start",
};

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
  title = "Ready to create your infinite canvas?",
  description = "Start building with Kritzel today. It's ready to use with your favorite framework.",
  primaryButton = { label: "Get Started", showArrow: true },
}: CallToActionProps): ReactNode {
  const [docsPath, setDocsPath] = React.useState(() => quickStartPaths[getPreferredFramework()]);
  const moonImageUrl = useBaseUrl("/img/moon.png");
  const orionCapsuleImageUrl = useBaseUrl("/img/orion_capsule.png");

  React.useEffect(() => {
    setDocsPath(quickStartPaths[getPreferredFramework()]);
    return subscribeToPreferredFramework((framework) => {
      setDocsPath(quickStartPaths[framework]);
    });
  }, []);

  const resolvedTo = primaryButton.to ?? docsPath;

  return (
    <section className={styles.ctaSection}>
      <div className={styles.ctaContent}>
        <img src={orionCapsuleImageUrl} alt="" className={styles.ctaOrionCapsule} aria-hidden="true" />
        <img src={moonImageUrl} alt="" className={styles.ctaMoon} aria-hidden="true" />
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
