import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import CallToAction from "@site/src/components/CallToAction";
import Heading from "@theme/Heading";
import ArrowRight from "@site/static/img/arrow_right.svg";
import InfoGraphic1 from "@site/static/img/info_graphic-1.svg";
import InfoGraphic2 from "@site/static/img/info_graphic-2.svg";
import InfoGraphic3 from "@site/static/img/info_graphic-3.svg";
import InfoGraphic4 from "@site/static/img/info_graphic-4.svg";
import BrowserOnly from "@docusaurus/BrowserOnly";

import useBaseUrl from "@docusaurus/useBaseUrl";

import styles from "./index.module.css";
import React from "react";

// Separate component to properly use hooks
function HomepageEditor({ initialWorkspaceUrl }: { initialWorkspaceUrl: string }) {
  const { KritzelEditor } = require("kritzel-react");
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
      <KritzelEditor editorId="homepage" ref={editorRef} wheelEnabled={false} cursorTarget={containerEl} onIsReady={handleReady} loginConfig={null} isWorkspaceManagerVisible={false} isMoreMenuVisible={false} />
    </div>
  );
}

const infoGraphicsData = [
  {
    Graphic: InfoGraphic1,
    title: "Infinite Canvas",
    description: "Explore a boundless workspace where your creativity has no limits. Pan, zoom, and navigate freely across an endless digital canvas.",
    link: "/features/infinite-canvas",
  },
  {
    Graphic: InfoGraphic2,
    title: "Framework Agnostic",
    description: "Seamlessly integrate with Angular, React, or Vue. Kritzel adapts to your tech stack, not the other way around.",
    link: "/features/framework-agnostic",
  },
  {
    Graphic: InfoGraphic3,
    title: "Powerful Drawing Tools",
    description: "From brushes to shapes, text to images—all the tools you need to bring your ideas to life with precision and ease.",
    link: "/features/real-time-collaboration",
  },
  {
    Graphic: InfoGraphic4,
    title: "Real-time Collaboration",
    description: "Work together in real-time with built-in collaboration features. See changes instantly as your team creates together.",
    link: "/features/drawing-tools",
  },
];

function HomepageHeader() {
  const initialWorkspaceUrl = useBaseUrl('/json/initial_workspace.json');
  
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className={clsx("hero__title", styles.heroTitle)}>
          Infinite Canvas,
          <br />
          unbound creativity.
        </Heading>
        <p className={clsx("hero__subtitle", styles.heroSubtitle)}>
          Kritzel is a framework-agnostic infinite canvas library
          <br />
          for creating endless creative experiences.
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
            Demo
            <span className="buttonIcon">
              <ArrowRight style={{ width: "24px", height: "24px" }} />
            </span>
          </Link>
          <Link
            to="/docs/angular/overview"
            className="button button--primary button--lg"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            Documentation
            <span className="buttonIcon">
              <ArrowRight style={{ width: "24px", height: "24px" }} />
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function InfoGraphicsSection() {
  return (
    <section className={styles.infoSection}>
      {infoGraphicsData.map((item, index) => (
        <div
          key={index}
          className={clsx(
            styles.infoRow,
            index % 2 === 1 && styles.infoRowReverse
          )}
        >
          <div className={styles.infoContent}>
            <Heading as="h2" className={styles.infoTitle}>
              {item.title}
            </Heading>
            <p className={styles.infoDescription}>{item.description}</p>
            <Link to={item.link} className={styles.infoLink}>
              Learn more <ArrowRight style={{ width: "1em", height: "1em", verticalAlign: "middle", fill: "#1a1a2e" }} />
            </Link>
          </div>
          <div className={styles.infoGraphic}>
            <item.Graphic />
          </div>
        </div>
      ))}
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <InfoGraphicsSection />
        <CallToAction />
      </main>
    </Layout>
  );
}
