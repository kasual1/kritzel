import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import CallToAction from "@site/src/components/CallToAction";
import FAQAccordionItem from "@site/src/components/FAQAccordionItem";
import Heading from "@theme/Heading";
import { ArrowRight } from "lucide-react";

import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { getPreferredFramework, frameworkPaths, subscribeToPreferredFramework } from "@site/src/utils/frameworkPreference";

import styles from "./index.module.css";
import React from "react";

const quickStartPaths: Record<keyof typeof frameworkPaths, string> = {
  angular: "/docs/angular/getting-started/quick-start",
  react: "/docs/react/getting-started/quick-start",
  vue: "/docs/vue/getting-started/quick-start",
};

const productHighlights = [
  {
    eyebrow: "Made for scale",
    title: "A canvas that keeps up with every idea",
    description:
      "Give people room to think. Kritzel renders an expansive workspace with responsive panning, zooming, and spatial indexing built in.",
    image: "/img/highlights/infinite-canvas.png",
    imageAlt: "Kritzel editor showing an infinite canvas workspace",
  },
  {
    eyebrow: "Built around your product",
    title: "Compose the experience your users need",
    description:
      "Start with a polished editor or use the engine directly. Customize tools, objects, UI, and workflows without working around someone else's product decisions.",
    image: "/img/highlights/customizable-editor.png",
    imageAlt: "Kritzel editor with drawing tools and a customized workspace",
  },
  {
    eyebrow: "Ready for every team",
    title: "Collaboration that feels immediate",
    description:
      "Bring shared workspaces to life with realtime synchronization, persistence, and a foundation that works across desktop, tablet, and mobile.",
    image: "/img/highlights/realtime-collaboration.png",
    imageAlt: "Kritzel collaborative workspace with multiple objects on the canvas",
  },
] as const;

function ProductHighlights() {
  return (
    <section className={styles.productHighlights} aria-label="Kritzel capabilities">
      <div className="container">
        {productHighlights.map((highlight, index) => (
          <article
            className={clsx(styles.productHighlight, index % 2 === 1 && styles.productHighlightReversed)}
            key={highlight.title}
          >
            <div className={styles.productHighlightImage}>
              <img src={highlight.image} alt={highlight.imageAlt} loading="lazy" />
            </div>
            <div className={styles.productHighlightContent}>
              <p className={styles.productHighlightEyebrow}>{highlight.eyebrow}</p>
              <Heading as="h2" className={styles.productHighlightTitle}>
                {highlight.title}
              </Heading>
              <p className={styles.productHighlightDescription}>{highlight.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HomepageEditorEmbed() {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isMobileViewport, setIsMobileViewport] = React.useState(false);
  const isMobileViewportRef = React.useRef(isMobileViewport);
  const pendingSwitchTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    isMobileViewportRef.current = isMobileViewport;
  }, [isMobileViewport]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const determineViewportMode = (containerWidth: number, containerHeight: number, currentMode: boolean) => {
      const aspectThreshold = 24;

      if (containerHeight > containerWidth + aspectThreshold) {
        return true;
      }

      if (containerWidth > containerHeight + aspectThreshold) {
        return false;
      }

      return currentMode;
    };

    const measureAndSwitchViewportMode = (confirmChange: boolean) => {
      const containerElement = containerRef.current;
      if (!containerElement) {
        return;
      }

      const nextMode = determineViewportMode(
        containerElement.clientWidth,
        containerElement.clientHeight,
        isMobileViewportRef.current,
      );

      if (nextMode === isMobileViewportRef.current) {
        if (pendingSwitchTimeoutRef.current !== null) {
          window.clearTimeout(pendingSwitchTimeoutRef.current);
          pendingSwitchTimeoutRef.current = null;
        }
        return;
      }

      if (!confirmChange) {
        if (pendingSwitchTimeoutRef.current !== null) {
          window.clearTimeout(pendingSwitchTimeoutRef.current);
        }

        pendingSwitchTimeoutRef.current = window.setTimeout(() => {
          pendingSwitchTimeoutRef.current = null;
          measureAndSwitchViewportMode(true);
        }, 140);
        return;
      }

      isMobileViewportRef.current = nextMode;
      setIsMobileViewport(nextMode);
    };

    const containerElement = containerRef.current;
    if (!containerElement) {
      return;
    }

    measureAndSwitchViewportMode(true);

    const resizeObserver = new ResizeObserver(() => {
      measureAndSwitchViewportMode(false);
    });
    resizeObserver.observe(containerElement);

    const onWindowResize = () => {
      measureAndSwitchViewportMode(false);
    };

    window.addEventListener("resize", onWindowResize);

    return () => {
      if (pendingSwitchTimeoutRef.current !== null) {
        window.clearTimeout(pendingSwitchTimeoutRef.current);
        pendingSwitchTimeoutRef.current = null;
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", onWindowResize);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <iframe
        key={isMobileViewport ? "hero-mobile" : "hero-desktop"}
        src={isMobileViewport
          ? "https://kasual1.github.io/kritzel-demos/react/#/website/hero-mobile"
          : "https://kasual1.github.io/kritzel-demos/react/#/website/hero"}
        title={isMobileViewport ? "Kritzel React Hero Mobile Demo" : "Kritzel React Hero Demo"}
        className={styles.editorFrame}
        style={{ width: "100%", height: "100%", border: 0 }}
        loading="eager"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}

function HomepageHeader() {
  const [targetPath, setTargetPath] = React.useState('/docs/react/getting-started/quick-start');
  const [isEditorCardVisible, setIsEditorCardVisible] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      setIsEditorCardVisible(true);
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsEditorCardVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  React.useEffect(() => {
    const preferred = getPreferredFramework();
    setTargetPath(quickStartPaths[preferred]);
    return subscribeToPreferredFramework((framework) => {
      setTargetPath(quickStartPaths[framework]);
    });
  }, []);
  
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className={clsx("hero__title", styles.heroTitle)}>
          The Infinite Canvas
          <br />
          Development Kit
        </Heading>
        <p className={clsx("hero__subtitle", styles.heroSubtitle)}>
          Kritzel is a framework-agnostic infinite canvas library that helps you build custom whiteboard experiences with React, Vue and Angular.
        </p>
        <div className={clsx(styles.editorContainer, isEditorCardVisible && styles.editorContainerVisible)}>
          <HomepageEditorEmbed />
        </div>
        <div className={styles.buttons}>
          <Link
            href="https://app.kritzel.io"
            className="button button--primary button--lg"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            Demo
            <span className="buttonIcon">
              <ArrowRight size={24} aria-hidden="true" />
            </span>
          </Link>
          <Link
            to={targetPath}
            className="button button--secondary button--lg"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            Get started
            <span className="buttonIcon">
              <ArrowRight size={24} aria-hidden="true" />
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
    question: "Can Kritzel handle large, complex boards?",
    answer:
      "Yes. Kritzel is designed to handle large, complex boards. Using spatial indexing and viewport optimizations under the hood, it keeps panning and zooming responsive as your canvas grows.",
  },
  {
    question: "Is Kritzel an alternative to tldraw or Excalidraw?",
    answer:
      "Yes. Kritzel is a lightweight alternative to tldraw and Excalidraw, giving you a core canvas experience without the bloat of heavier engines.",
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
          Frequently Asked Questions
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
                question={item.question}
                answer={item.answer}
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
        {/* <ProductHighlights /> */}
        <hr className={styles.sectionSeparator} />
        <FAQSection />
        <CallToAction />
      </main>
    </Layout>
  );
}
