import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import CallToAction from "@site/src/components/CallToAction";
import FAQAccordionItem from "@site/src/components/FAQAccordionItem";
import Heading from "@theme/Heading";
import ArrowRight from "@site/static/img/arrow_right.svg";
import BrowserOnly from "@docusaurus/BrowserOnly";

import useBaseUrl from "@docusaurus/useBaseUrl";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { getPreferredFramework, frameworkPaths, subscribeToPreferredFramework } from "@site/src/utils/frameworkPreference";

import styles from "./index.module.css";
import React from "react";

// Separate component to properly use hooks
function HomepageEditor({ initialWorkspaceUrl }: { initialWorkspaceUrl: string }) {
  const { KritzelEditor, IndexedDBSyncProvider } = require("kritzel-react");
  const editorRef = React.useRef<any>(null);
  const isLoadedRef = React.useRef(false);
  const observerRef = React.useRef<ResizeObserver | null>(null);
  const prevWidthRef = React.useRef<number>(0);
  const [containerEl, setContainerEl] = React.useState<HTMLDivElement | null>(null);
  const [shouldLoadInitialWorkspace, setShouldLoadInitialWorkspace] = React.useState<boolean | null>(null);
  const containerRef = React.useCallback((el: HTMLDivElement | null) => {
    setContainerEl(el);
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (el) {
      prevWidthRef.current = el.getBoundingClientRect().width;
      observerRef.current = new ResizeObserver((entries) => {
        const newWidth = entries[0].contentRect.width;
        if (newWidth !== prevWidthRef.current && isLoadedRef.current) {
          prevWidthRef.current = newWidth;
          editorRef.current?.centerAllObjects(false);
        }
      });
      observerRef.current.observe(el);
    }
  }, []);

  // Check if an IndexedDB workspace already exists before the editor initializes
  React.useEffect(() => {
    const checkDatabase = async () => {
      try {
        const databases = await indexedDB.databases();
        const hasKritzelWorkspace = databases.some(db =>
          db.name?.startsWith('kritzel-workspace-homepage')
        );
        setShouldLoadInitialWorkspace(!hasKritzelWorkspace);
      } catch {
        setShouldLoadInitialWorkspace(false);
      }
    };
    checkDatabase();
  }, []);

  const handleReady = React.useCallback(async () => {
    if (editorRef.current && !isLoadedRef.current) {
      isLoadedRef.current = true;
      try {
        if (shouldLoadInitialWorkspace) {
          const response = await fetch(initialWorkspaceUrl);
          const json = await response.text();
          await editorRef.current.loadObjectsFromJson(json);
        }
        await editorRef.current.centerAllObjects(false);
      } catch (error) {
        console.error('Failed to load initial workspace:', error);
      }
    }
  }, [initialWorkspaceUrl, shouldLoadInitialWorkspace]);

  React.useEffect(() => {
    if (shouldLoadInitialWorkspace === null) return;
    let mounted = true;
    const checkInit = async () => {
      // Small delay to allow the editor to initialize in case it's remounting
      await new Promise((r) => setTimeout(r, 100));
      if (!mounted || !editorRef.current || isLoadedRef.current) return;

      try {
        const ws = await editorRef.current.getActiveWorkspace();
        if (ws) {
          handleReady();
        }
      } catch (err) {
        // Not ready yet, wait for the onIsReady event
      }
    };
    checkInit();
    return () => {
      mounted = false;
    };
  }, [handleReady, shouldLoadInitialWorkspace]);

  // Wait for database check before rendering editor
  if (shouldLoadInitialWorkspace === null) {
    return <div style={{ width: '100%', height: '100%' }} />;
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <KritzelEditor
        editorId="homepage"
        ref={editorRef}
        syncConfig={{ providers: [IndexedDBSyncProvider] }}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        cursorTarget={containerEl}
        onIsReady={handleReady}
        isWorkspaceManagerVisible={false}
        isMoreMenuVisible={true}
      />
    </div>
  );
}

function HomepageHeader() {
  const initialWorkspaceUrl = useBaseUrl('/json/initial_workspace.json');
  const [targetPath, setTargetPath] = React.useState('/docs/react/overview');

  React.useEffect(() => {
    const preferred = getPreferredFramework();
    setTargetPath(frameworkPaths[preferred]);
    return subscribeToPreferredFramework((framework) => {
      setTargetPath(frameworkPaths[framework]);
    });
  }, []);
  
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className={clsx("hero__title", styles.heroTitle)}>
          Build Infinite Canvas
          <br />
          Experiences in Minutes.
        </Heading>
        <p className={clsx("hero__subtitle", styles.heroSubtitle)}>
          Kritzel is a framework-agnostic, infinite canvas library 
          <br />
          with easy integration for React, Vue, and Angular.
        </p>
        <div className={styles.editorContainer}>
          <BrowserOnly fallback={<div className={styles.editorPlaceholder}>Loading editor...</div>}>
            {() => <HomepageEditor initialWorkspaceUrl={initialWorkspaceUrl} />}
          </BrowserOnly>
        </div>
        <div className={styles.buttons}>
          <Link
            href="https://app.kritzel.io"
            className="button button--primary button--lg"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            Try the Demo
            <span className="buttonIcon">
              <ArrowRight style={{ width: "24px", height: "24px" }} />
            </span>
          </Link>
          <Link
            to={targetPath}
            className="button button--secondary button--lg"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            Read the Docs
            <span className="buttonIcon">
              <ArrowRight style={{ width: "24px", height: "24px" }} />
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

const faqItems = [
  {
    question: "Which frameworks does Kritzel support?",
    answer:
      "Kritzel works seamlessly with React, Vue, Angular, and Vanilla JavaScript. Built on native Web Components with first-class TypeScript support, it provides dedicated framework wrappers so you can use native props and event handlers in your stack.",
  },
  {
    question: "Can Kritzel handle large boards with thousands of elements?",
    answer:
      "Yes. Kritzel is engineered specifically for scale. Using spatial indexing and viewport optimizations under the hood, it maintains smooth 60 FPS panning and zooming even as your canvas grows to thousands of elements.",
  },
  {
    question: "Is Kritzel a rigid whiteboard app or a flexible library?",
    answer:
      "Kritzel is an unstyled, flexible canvas engine—not a restrictive UI kit. It handles the hard math of panning, zooming, and spatial management, leaving you with 100% control over your app’s UI, toolbar design, and styling.",
  },
  {
    question: "Does Kritzel support mobile devices, tablets, and trackpads?",
    answer:
      "Yes. Kritzel includes native gesture handling out of the box. It smoothly manages trackpad pinch-to-zoom, touch gestures on mobile/tablet screens, and traditional mouse wheel inputs across all major browsers.",
  },
  {
    question: "Is Kritzel free to use?",
    answer:
      "Kritzel is completely free for personal, open-source, and evaluation projects (which display a subtle watermark). For production SaaS apps and commercial deployments, you can purchase a Commercial License to remove the watermark.",
  },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  return (
    <section className={styles.faqSection}>
      <div className={styles.faqContent}>
        <Heading as="h2" className={styles.faqTitle}>
          FAQ
        </Heading>
        <p className={styles.faqSubtitle}>
          Answers to common questions about adopting Kritzel in production projects.
        </p>

        <div className={styles.faqList}>
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            const buttonId = `faq-question-${index}`;
            const panelId = `faq-answer-${index}`;

            return (
              <FAQAccordionItem
                key={item.question}
                question={`Q: ${item.question}`}
                answer={`A: ${item.answer}`}
                isOpen={isOpen}
                onToggle={() => setOpenIndex((current) => (current === index ? null : index))}
                buttonId={buttonId}
                panelId={panelId}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout description={siteConfig.tagline}>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <FAQSection />
        <CallToAction />
      </main>
    </Layout>
  );
}
