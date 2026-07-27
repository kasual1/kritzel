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

function HomepageEditorEmbed() {
  return (
    <iframe
      src="https://kasual1.github.io/kritzel-demos/react/#/website/hero"
      title="Kritzel React Getting Started Demo"
      style={{ width: "100%", height: "100%", border: 0 }}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      allow="clipboard-read; clipboard-write"
    />
  );
}

function HomepageHeader() {
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
          <HomepageEditorEmbed />
        </div>
        <div className={styles.buttons}>
          <Link
            href="https://app.kritzel.io"
            className="button button--primary button--lg"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            Try the Demo
            <span className="buttonIcon">
              <ArrowRight size={24} aria-hidden="true" />
            </span>
          </Link>
          <Link
            to={targetPath}
            className="button button--secondary button--lg"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            Read the Docs
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
        <hr className={styles.sectionSeparator} />
        <FAQSection />
        <CallToAction />
      </main>
    </Layout>
  );
}
