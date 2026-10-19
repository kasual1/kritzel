import { useEffect, useState, type ReactNode } from "react";
import Layout from "@theme/Layout";
import { HtmlClassNameProvider } from "@docusaurus/theme-common";
import Head from "@docusaurus/Head";
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

const TITLE = "Kritzel - Agentic Canvas SDK for AI Agents in React, Vue & Angular";
const DESCRIPTION =
  "Build agentic whiteboards where AI agents draw, edit and collaborate with your users: a ready made chatbox, programmable cursors, WebMCP tools and LLM generated objects.";

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
          {/* Set directly so the site-wide title is not appended, which would duplicate the home page title. */}
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
          <CliSection variant="skill" />
          <Faq variant="agentic" />
          <Wordmark />
        </main>
      </Layout>
    </HtmlClassNameProvider>
  );
}
