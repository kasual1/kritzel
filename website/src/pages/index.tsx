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
import InfoGraphic5 from "@site/static/img/info_graphic-5.svg";
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
        wheelEnabled={false}
        cursorTarget={containerEl}
        onIsReady={handleReady}
        isWorkspaceManagerVisible={false}
        isMoreMenuVisible={true}
      />
    </div>
  );
}

const infoGraphicsData = [
 {
    Graphic: InfoGraphic1,
    title: "Infinite Canvas",
    description: "High-performance, hardware-accelerated canvas supporting infinite panning, zooming, and coordinate mapping out of the box.",
    link: "/features/infinite-canvas",
    linkText: "Learn more",
  },
  {
    Graphic: InfoGraphic2,
    title: "Framework Agnostic",
    description: "Built as native Web Components. Drop Kritzel into React, Angular, Vue, or vanilla JS without worrying about wrapper overhead.",
    link: "/features/framework-agnostic",
    linkText: "Learn more",
  },
  {
    Graphic: InfoGraphic3,
    title: "Extensible Drawing Tools",
    description: "A robust set of built-in primitives—brushes, shapes, text, and images—exposed via a clean API for easy customization and control.",
    link: "/features/drawing-tools",
    linkText: "Learn more",
  },
  {
    Graphic: InfoGraphic4,
    graphicClassName: "infoGraphicSmall",
    title: "Realtime Collaboration",
    description: "Built-in state synchronization hooks and CRDT-ready structures to implement multiplayer collaboration with minimal backend boilerplate.",
    link: "/features/real-time-collaboration",
    linkText: "Learn more",
  },
 {
    Graphic: InfoGraphic5,
    graphicClassName: "infoGraphicLarge",
    title: "AI Native",
    description: "Features built-in Skills and a MCP server, allowing AI agents to read, modify, and render canvas states directly.",
    link: "/features/ai-integration",
    linkText: "Learn more",
  },
];

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
              {item.linkText} <ArrowRight style={{ width: "1em", height: "1em", verticalAlign: "middle", fill: "#1a1a2e" }} />
            </Link>
          </div>
          <div className={clsx(styles.infoGraphic, item.graphicClassName && styles[item.graphicClassName as keyof typeof styles])}>
            <item.Graphic />
          </div>
        </div>
      ))}
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
        <InfoGraphicsSection />
        <CallToAction />
      </main>
    </Layout>
  );
}
