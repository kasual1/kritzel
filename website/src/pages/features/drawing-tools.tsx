import type { ReactNode } from "react";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import CallToAction from "@site/src/components/CallToAction";
import DrawingToolsSvg from "@site/static/img/info_graphic-4.svg";

import styles from "./feature.module.css";

export default function DrawingTools(): ReactNode {
  return (
    <Layout title="Drawing Tools" description="Powerful tools to bring your ideas to life">
      <header className={styles.header}>
        <div className="container">
          <Heading as="h1" className={styles.headerTitle}>
            Powerful Drawing Tools
          </Heading>
          <p className={styles.headerSubtitle}>
            Everything you need to create
          </p>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.container}>
          <section className={styles.heroSection}>
            <div className={styles.heroGraphic}>
              <DrawingToolsSvg />
            </div>
            <div className={styles.heroContent}>
              <p className={styles.description}>
                From brushes to shapes, text to images—all the tools you need to 
                bring your ideas to life with precision and ease. Kritzel provides 
                a comprehensive toolkit designed for both casual sketching and 
                professional design work.
              </p>
            </div>
          </section>

          <section className={styles.detailsSection}>
            <Heading as="h2" className={styles.sectionTitle}>Available Tools</Heading>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <Heading as="h3" className={styles.featureCardTitle}>Brush Tool</Heading>
                <p>Pressure-sensitive brush with customizable size, color, and opacity. Perfect for freehand drawing and sketching.</p>
              </div>
              <div className={styles.featureCard}>
                <Heading as="h3" className={styles.featureCardTitle}>Shape Tools</Heading>
                <p>Create perfect rectangles, ellipses, lines, and polygons. Easily adjust fill, stroke, and corner radius.</p>
              </div>
              <div className={styles.featureCard}>
                <Heading as="h3" className={styles.featureCardTitle}>Text Tool</Heading>
                <p>Rich text editing with font selection, sizing, alignment, and styling options for labels and annotations.</p>
              </div>
              <div className={styles.featureCard}>
                <Heading as="h3" className={styles.featureCardTitle}>Image Tool</Heading>
                <p>Import and manipulate images with support for drag-and-drop, resizing, and basic transformations.</p>
              </div>
              <div className={styles.featureCard}>
                <Heading as="h3" className={styles.featureCardTitle}>Selection Tool</Heading>
                <p>Select, move, resize, and rotate objects with precision. Multi-select with shift-click or drag selection.</p>
              </div>
              <div className={styles.featureCard}>
                <Heading as="h3" className={styles.featureCardTitle}>Eraser Tool</Heading>
                <p>Remove strokes and elements with an intuitive eraser. Works with both paths and objects.</p>
              </div>
            </div>
          </section>

          <section className={styles.featuresListSection}>
            <Heading as="h2" className={styles.sectionTitle}>Additional Features</Heading>
            <div className={styles.featuresColumns}>
              <ul className={styles.featuresList}>
                <li>Undo/Redo with full history</li>
                <li>Copy, paste, and duplicate</li>
                <li>Grouping and ungrouping</li>
                <li>Layer ordering (bring to front/send to back)</li>
                <li>Alignment and distribution tools</li>
              </ul>
              <ul className={styles.featuresList}>
                <li>Customizable keyboard shortcuts</li>
                <li>Touch and stylus support</li>
                <li>Snap to grid and guides</li>
                <li>Export to PNG, SVG, and JSON</li>
                <li>Extensible tool registry</li>
              </ul>
            </div>
          </section>

          <section className={styles.useCasesSection}>
            <Heading as="h2" className={styles.sectionTitle}>Use Cases</Heading>
            <ul className={styles.useCasesList}>
              <li>Digital sketching and illustration</li>
              <li>UI/UX wireframing and prototyping</li>
              <li>Annotating documents and images</li>
              <li>Creating diagrams and flowcharts</li>
              <li>Educational whiteboards</li>
              <li>Quick mockups and visual communication</li>
            </ul>
          </section>
        </div>
        <CallToAction
          title="Ready to start creating?"
          description="Explore all the tools and bring your ideas to life."
        />
      </main>
    </Layout>
  );
}
