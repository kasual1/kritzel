import { useEffect, useState, type ReactNode } from "react";
import Layout from "@theme/Layout";
import { HtmlClassNameProvider } from "@docusaurus/theme-common";
import Head from "@docusaurus/Head";
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

const TITLE = "Kritzel - Infinite Canvas Library for React, Vue & Angular";
const DESCRIPTION =
  "Kritzel helps you build infinite canvas experiences featuring real-time collaboration and high-performance drawing tools. Fully open-source and easy to integrate into React, Vue & Angular.";

function usePreferredDocsPath() {
  const [docsPath, setDocsPath] = useState(frameworkPaths.react);

  useEffect(() => {
    setDocsPath(frameworkPaths[getPreferredFramework()]);
    return subscribeToPreferredFramework((framework) => setDocsPath(frameworkPaths[framework]));
  }, []);

  return docsPath;
}

export default function Home(): ReactNode {
  const docsPath = usePreferredDocsPath();

  return (
    <HtmlClassNameProvider className="landing-page">
      <Layout description={DESCRIPTION}>
        <Head>
          {/* Set directly so the site-wide title is not appended to the page title. */}
          <title>{TITLE}</title>
          <meta property="og:title" content={TITLE} />
          <meta name="twitter:title" content={TITLE} />
        </Head>
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
