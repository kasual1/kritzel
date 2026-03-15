import type { ReactNode } from "react";
import Head from "@docusaurus/Head";
import BrowserOnly from "@docusaurus/BrowserOnly";
import useBaseUrl from "@docusaurus/useBaseUrl";
import React from "react";

function DemoEditor({ initialWorkspaceUrl }: { initialWorkspaceUrl: string }) {
  const { KritzelEditor } = require("kritzel-react");
  const editorRef = React.useRef<any>(null);
  const [shouldLoadInitialWorkspace, setShouldLoadInitialWorkspace] =
    React.useState<boolean | null>(null);

  React.useEffect(() => {
    const checkDatabase = async () => {
      try {
        const databases = await indexedDB.databases();
        const hasKritzelWorkspace = databases.some((db) =>
          db.name?.startsWith("kritzel-workspace-demo")
        );
        setShouldLoadInitialWorkspace(!hasKritzelWorkspace);
      } catch {
        setShouldLoadInitialWorkspace(false);
      }
    };
    checkDatabase();
  }, []);

  const handleReady = async () => {
    if (editorRef.current) {
      try {
        if (shouldLoadInitialWorkspace) {
          const response = await fetch(initialWorkspaceUrl);
          const json = await response.text();
          await editorRef.current.loadObjectsFromJson(json);
        }
      } catch (error) {
        console.error("Failed to load initial workspace:", error);
      }
    }
  };

  if (shouldLoadInitialWorkspace === null) {
    return null;
  }

  return (
    <KritzelEditor
      editorId="demo"
      ref={editorRef}
      wheelEnabled={true}
      onIsReady={handleReady}
    />
  );
}

export default function Demo(): ReactNode {
  const initialWorkspaceUrl = useBaseUrl("/json/initial_workspace.json");

  // Force every wrapper element to fill the viewport on mount,
  // and restore everything on unmount so other pages work normally.
  React.useEffect(() => {
    const saved: { el: HTMLElement; prev: string }[] = [];

    // Helper: override an element's style and remember the original
    const override = (el: HTMLElement, css: Partial<CSSStyleDeclaration>) => {
      saved.push({ el, prev: el.style.cssText });
      Object.assign(el.style, css);
    };

    // Hide the navbar
    const navbar = document.querySelector("nav.navbar") as HTMLElement;
    if (navbar) override(navbar, { display: "none" });

    // Walk up from our marker div and set every ancestor to fill viewport
    const marker = document.getElementById("kritzel-demo-root");
    if (marker) {
      let el = marker.parentElement;
      while (el && el !== document.documentElement) {
        override(el, {
          width: "100%",
          height: "100%",
          margin: "0",
          padding: "0",
          overflow: "hidden",
        });
        el = el.parentElement;
      }
    }

    return () => {
      // Restore every element's original inline styles
      for (const { el, prev } of saved) {
        el.style.cssText = prev;
      }
    };
  }, []);

  return (
    <>
      <Head>
        <title>Demo — Kritzel</title>
        <meta
          name="description"
          content="Try Kritzel's infinite canvas editor right in your browser. Draw, sketch, annotate and collaborate freely."
        />
        <style>{`
          html, body {
            width: 100dvw !important;
            height: 100dvh !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            overscroll-behavior-x: none;
          }
          nav.navbar, footer {
            display: none !important;
          }
        `}</style>
      </Head>

      <div
        id="kritzel-demo-root"
        style={{ width: "100%", height: "100%", overflow: "hidden" }}
      >
        <BrowserOnly fallback={<div />}>
          {() => (
            <div style={{ width: "100%", height: "100%" }}>
              <DemoEditor initialWorkspaceUrl={initialWorkspaceUrl} />
            </div>
          )}
        </BrowserOnly>
      </div>
    </>
  );
}
