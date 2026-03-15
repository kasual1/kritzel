import type { ReactNode } from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import CallToAction from "@site/src/components/CallToAction";
import FrameworkAgnosticSvg from "@site/static/img/info_graphic-2.svg";
import ArrowRight from "@site/static/img/arrow_right.svg";

import styles from "./feature.module.css";

export default function FrameworkAgnostic(): ReactNode {
  return (
    <Layout title="Framework Agnostic" description="Seamlessly integrate with Angular, React, or Vue">
      <header className={styles.header}>
        <div className="container">
          <Heading as="h1" className={styles.headerTitle}>
            Framework Agnostic
          </Heading>
          <p className={styles.headerSubtitle}>
            Use with your favorite framework
          </p>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.container}>
          <section className={styles.heroSection}>
            <div className={styles.heroGraphic}>
              <FrameworkAgnosticSvg />
            </div>
            <div className={styles.heroContent}>
              <p className={styles.description}>
                Seamlessly integrate with Angular, React, or Vue. Kritzel adapts to 
                your tech stack, not the other way around. Built with Web Components 
                at its core, Kritzel provides native wrapper components for all major 
                frameworks while maintaining a consistent API across all implementations.
              </p>
            </div>
          </section>

          <section className={styles.detailsSection}>
            <Heading as="h2" className={styles.sectionTitle}>Key Features</Heading>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <Heading as="h3" className={styles.featureCardTitle}>Native Wrappers</Heading>
                <p>Purpose-built wrapper components for Angular, React, and Vue that feel native to each framework's conventions and patterns.</p>
              </div>
              <div className={styles.featureCard}>
                <Heading as="h3" className={styles.featureCardTitle}>Web Components Core</Heading>
                <p>Built on Web Components standards for universal compatibility. Use Kritzel in any web environment, even vanilla JavaScript.</p>
              </div>
              <div className={styles.featureCard}>
                <Heading as="h3" className={styles.featureCardTitle}>Full TypeScript Support</Heading>
                <p>Complete type definitions for all frameworks, enabling excellent IDE support, autocompletion, and compile-time error checking.</p>
              </div>
              <div className={styles.featureCard}>
                <Heading as="h3" className={styles.featureCardTitle}>Consistent API</Heading>
                <p>The same intuitive API across all framework implementations means knowledge transfers seamlessly between projects.</p>
              </div>
            </div>
          </section>

          <section className={styles.frameworksSection}>
            <Heading as="h2" className={styles.sectionTitle}>Supported Frameworks</Heading>
            <div className={styles.frameworksGrid}>
              <div className={styles.frameworkCard}>
                <Heading as="h3">Angular</Heading>
                <p>Full integration with Angular's component model, change detection, and dependency injection.</p>
                <Link to="/docs/angular/overview" className={styles.frameworkLink}>
                  Angular Docs <ArrowRight style={{ width: "1em", height: "1em", verticalAlign: "middle", fill: "black" }} />
                </Link>
              </div>
              <div className={styles.frameworkCard}>
                <Heading as="h3">React</Heading>
                <p>React hooks and components that integrate seamlessly with your existing React application.</p>
                <Link to="/docs/react/overview" className={styles.frameworkLink}>
                  React Docs <ArrowRight style={{ width: "1em", height: "1em", verticalAlign: "middle", fill: "black" }} />
                </Link>
              </div>
              <div className={styles.frameworkCard}>
                <Heading as="h3">Vue</Heading>
                <p>Vue components with full support for Vue 3's Composition API and reactivity system.</p>
                <Link to="/docs/vue/overview" className={styles.frameworkLink}>
                  Vue Docs <ArrowRight style={{ width: "1em", height: "1em", verticalAlign: "middle", fill: "black" }} />
                </Link>
              </div>
            </div>
          </section>

          <section className={styles.useCasesSection}>
            <Heading as="h2" className={styles.sectionTitle}>Use Cases</Heading>
            <ul className={styles.useCasesList}>
              <li>Enterprise applications with existing framework choices</li>
              <li>Multi-team organizations with different tech stacks</li>
              <li>Gradual adoption in legacy applications</li>
              <li>Framework-agnostic design system integration</li>
              <li>Prototyping across different technologies</li>
            </ul>
          </section>
        </div>
        <CallToAction
          title="Ready to integrate with your stack?"
          description="Choose your framework and start building in minutes."
        />
      </main>
    </Layout>
  );
}
