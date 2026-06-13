import type { ReactNode } from "react";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import CallToAction from "@site/src/components/CallToAction";
import InfiniteCanvasSvg from "@site/static/img/info_graphic-1.svg";

import styles from "./feature.module.css";

export default function InfiniteCanvas(): ReactNode {
  return (
    <Layout title="Infinite Canvas Engine" description="Explore a boundless workspace where your creativity has no limits">
      <header className={styles.header}>
        <div className="container">
          <Heading as="h1" className={styles.headerTitle}>
            Infinite Canvas
          </Heading>
          <p className={styles.headerSubtitle}>
            Boundless creativity without limits
          </p>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.container}>
          <section className={styles.heroSection}>
            <div className={styles.heroGraphic}>
              <InfiniteCanvasSvg />
            </div>
            <div className={styles.heroContent}>
              <p className={styles.description}>
                Explore a boundless workspace where your creativity has no limits. 
                Pan, zoom, and navigate freely across an endless digital canvas that 
                grows with your ideas. No more constrained viewports or artificial 
                boundaries—just pure, unlimited creative space.
              </p>
            </div>
          </section>

          <section className={styles.detailsSection}>
            <Heading as="h2" className={styles.sectionTitle}>Key Features</Heading>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <Heading as="h3" className={styles.featureCardTitle}>Unlimited Workspace</Heading>
                <p>Seamlessly pan across an unlimited workspace in any direction. Your canvas extends infinitely, giving you the freedom to organize and create without constraints.</p>
              </div>
              <div className={styles.featureCard}>
                <Heading as="h3" className={styles.featureCardTitle}>Smooth Zooming</Heading>
                <p>Zoom from a bird's-eye overview to pixel-perfect detail with buttery smooth transitions. Navigate between macro and micro views effortlessly.</p>
              </div>
              <div className={styles.featureCard}>
                <Heading as="h3" className={styles.featureCardTitle}>Efficient Rendering</Heading>
                <p>Only visible elements are rendered, ensuring optimal performance even with thousands of objects on your canvas.</p>
              </div>
              <div className={styles.featureCard}>
                <Heading as="h3" className={styles.featureCardTitle}>Intuitive Navigation</Heading>
                <p>Navigate naturally with mouse, touch, and trackpad gestures. Pinch to zoom, drag to pan—it just works the way you expect.</p>
              </div>
            </div>
          </section>

          <section className={styles.useCasesSection}>
            <Heading as="h2" className={styles.sectionTitle}>Use Cases</Heading>
            <ul className={styles.useCasesList}>
              <li>Mind mapping and brainstorming sessions</li>
              <li>Architectural and design layouts</li>
              <li>Interactive presentations and storytelling</li>
              <li>Data visualization dashboards</li>
              <li>Mood boards and creative collections</li>
              <li>Project planning and roadmaps</li>
            </ul>
          </section>
        </div>
        <CallToAction
          title="Ready to explore infinite possibilities?"
          description="Get started with Kritzel and unlock the power of infinite canvas."
        />
      </main>
    </Layout>
  );
}
