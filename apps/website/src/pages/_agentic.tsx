// Temporarily hidden: the leading underscore excludes this page from Docusaurus routing.
// Rename back to agentic.tsx (and set SHOW_CANVAS_TOGGLE in Landing/Hero.tsx) to restore /agentic.
import { useEffect, useState, type ReactNode } from "react";
import Layout from "@theme/Layout";
import { HtmlClassNameProvider } from "@docusaurus/theme-common";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Hero from "@site/src/components/Agentic/Hero";
import {
  CliSection,
  Faq,
  Features,
  Wordmark,
} from "@site/src/components/Landing/Sections";
import styles from "@site/src/components/Agentic/styles.module.css";
import {
  frameworkPaths,
  getPreferredFramework,
  subscribeToPreferredFramework,
} from "@site/src/utils/frameworkPreference";

function usePreferredDocsPath() {
  const [docsPath, setDocsPath] = useState(frameworkPaths.react);

  useEffect(() => {
    setDocsPath(frameworkPaths[getPreferredFramework()]);
    return subscribeToPreferredFramework((framework) => setDocsPath(frameworkPaths[framework]));
  }, []);

  return docsPath;
}

export default function Agentic(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  const docsPath = usePreferredDocsPath();

  return (
    <HtmlClassNameProvider className="landing-page agentic-page">
      <Layout description={siteConfig.tagline}>
        <div className={styles.page}>
          <div className={styles.heroArea}>
            <Hero docsPath={docsPath} variant="agentic" />
            <div aria-hidden="true" className={styles.heroSpacer} />
            <Features />
          </div>
          <CliSection />
          <Faq />
          <Wordmark />
        </div>
      </Layout>
    </HtmlClassNameProvider>
  );
}
