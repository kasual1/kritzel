import { useEffect, useState, type ReactNode } from "react";
import Layout from "@theme/Layout";
import { HtmlClassNameProvider } from "@docusaurus/theme-common";
import Head from "@docusaurus/Head";
import Hero from "@site/src/components/Agentic/Hero";
import FramesDemo from "@site/src/components/Landing/FramesDemo";
import {
  CliSection,
  Faq,
  Features,
  PlaceholderSection,
  Wordmark,
} from "@site/src/components/Landing/Sections";
import styles from "@site/src/components/Agentic/styles.module.css";
import {
  frameworkPaths,
  getPreferredFramework,
  subscribeToPreferredFramework,
} from "@site/src/utils/frameworkPreference";

const TITLE = "Kritzel - Agentic Canvas Library for React, Vue & Angular";
const DESCRIPTION =
  "Kritzel helps you build agentic canvas experiences featuring dynamic component rendering to power generative UI. Fully open-source and easy to integrate into React, Vue & Angular.";

function usePreferredDocsPath() {
  const [docsPath, setDocsPath] = useState(frameworkPaths.react);

  useEffect(() => {
    setDocsPath(frameworkPaths[getPreferredFramework()]);
    return subscribeToPreferredFramework((framework) => setDocsPath(frameworkPaths[framework]));
  }, []);

  return docsPath;
}

export default function Agentic(): ReactNode {
  const docsPath = usePreferredDocsPath();

  return (
    <HtmlClassNameProvider className="landing-page agentic-page">
      <Layout description={DESCRIPTION}>
        <Head>
          {/* Set directly so the site-wide title is not appended to the page title. */}
          <title>{TITLE}</title>
          <meta property="og:title" content={TITLE} />
          <meta name="twitter:title" content={TITLE} />
        </Head>
        <main className={styles.page}>
          <div className={styles.heroArea}>
            <Hero docsPath={docsPath} variant="agentic" />
            <div aria-hidden="true" className={styles.heroSpacer} />
            <Features variant="agentic" />
          </div>
          <PlaceholderSection headingId="agentic-first-heading" media={<FramesDemo />} />
          <CliSection variant="skill" layout="split" />
          <PlaceholderSection headingId="agentic-third-heading" />
          <Faq variant="agentic" />
          <Wordmark />
        </main>
      </Layout>
    </HtmlClassNameProvider>
  );
}
