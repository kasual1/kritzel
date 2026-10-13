import { useEffect, useState, type ReactNode } from "react";
import Layout from "@theme/Layout";
import { HtmlClassNameProvider } from "@docusaurus/theme-common";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Hero from "@site/src/components/Landing/Hero";
import {
  CliSection,
  Faq,
  Features,
  Wordmark,
} from "@site/src/components/Landing/Sections";
import styles from "@site/src/components/Landing/styles.module.css";
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

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  const docsPath = usePreferredDocsPath();

  return (
    <HtmlClassNameProvider className="landing-page">
      <Layout description={siteConfig.tagline}>
        <main className={styles.page}>
          <div className={styles.heroArea}>
            <Hero docsPath={docsPath} />
            <div aria-hidden="true" className={styles.heroSpacer} />
            <Features />
          </div>
          <CliSection />
          <Faq />
          <Wordmark />
        </main>
      </Layout>
    </HtmlClassNameProvider>
  );
}
