import type { ReactNode } from "react";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import CallToAction from "@site/src/components/CallToAction";
import CollaborationSvg from "@site/static/img/info_graphic-3.svg";

import styles from "./feature.module.css";

export default function RealTimeCollaboration(): ReactNode {
  return (
    <Layout title="Real-time Collaboration" description="Work together in real-time with built-in collaboration features">
      <header className={styles.header}>
        <div className="container">
          <Heading as="h1" className={styles.headerTitle}>
            Real-time Collaboration
          </Heading>
          <p className={styles.headerSubtitle}>
            Create together, anywhere
          </p>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.container}>
          <section className={styles.heroSection}>
            <div className={styles.heroGraphic}>
              <CollaborationSvg />
            </div>
            <div className={styles.heroContent}>
              <p className={styles.description}>
                Work together in real-time with built-in collaboration features. 
                See changes instantly as your team creates together, no matter where 
                they are in the world. Kritzel's collaboration features are powered by 
                cutting-edge CRDT technology, ensuring conflict-free concurrent editing.
              </p>
            </div>
          </section>

          <section className={styles.detailsSection}>
            <Heading as="h2" className={styles.sectionTitle}>Key Features</Heading>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <Heading as="h3" className={styles.featureCardTitle}>CRDT-Powered Sync</Heading>
                <p>Real-time synchronization powered by Conflict-free Replicated Data Types ensures everyone sees the same canvas state without conflicts.</p>
              </div>
              <div className={styles.featureCard}>
                <Heading as="h3" className={styles.featureCardTitle}>Live Cursors</Heading>
                <p>See where your collaborators are working with real-time cursor positions and selections, making coordination effortless.</p>
              </div>
              <div className={styles.featureCard}>
                <Heading as="h3" className={styles.featureCardTitle}>Offline Support</Heading>
                <p>Keep working even when disconnected. Changes automatically sync when you reconnect, with intelligent conflict resolution.</p>
              </div>
              <div className={styles.featureCard}>
                <Heading as="h3" className={styles.featureCardTitle}>Presence Awareness</Heading>
                <p>Built-in presence indicators show who's online and what they're working on, fostering team awareness and coordination.</p>
              </div>
            </div>
          </section>

          <section className={styles.useCasesSection}>
            <Heading as="h2" className={styles.sectionTitle}>Use Cases</Heading>
            <ul className={styles.useCasesList}>
              <li>Remote team whiteboarding sessions</li>
              <li>Live design reviews and feedback</li>
              <li>Educational collaborative exercises</li>
              <li>Distributed workshop facilitation</li>
              <li>Pair programming and code reviews</li>
              <li>Client presentations with live editing</li>
            </ul>
          </section>

          <section className={styles.techSection}>
            <Heading as="h2" className={styles.sectionTitle}>How It Works</Heading>
            <div className={styles.techContent}>
              <p>
                Kritzel uses <strong>Yjs</strong>, a high-performance CRDT implementation, 
                to enable real-time collaboration. This means:
              </p>
              <ul>
                <li>No central server required for conflict resolution</li>
                <li>Peer-to-peer sync capabilities</li>
                <li>Efficient binary encoding for minimal bandwidth</li>
                <li>Full history and undo/redo support</li>
                <li>Compatible with various transport layers (WebSocket, WebRTC, etc.)</li>
              </ul>
            </div>
          </section>
        </div>
        <CallToAction
          title="Ready to collaborate?"
          description="Set up real-time collaboration in your application today."
        />
      </main>
    </Layout>
  );
}
