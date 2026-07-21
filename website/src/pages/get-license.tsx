import type { ReactNode } from "react";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";

import styles from "./get-license.module.css";

export default function GetLicensePage(): ReactNode {
  return (
    <Layout
      title="Get License"
      description="Contact us to get a Kritzel license and remove the editor watermark"
    >
      <main className={styles.main}>
        <section className={styles.card}>
          <header className={styles.header}>
            <Heading as="h1" className={styles.title}>
              Get License
            </Heading>
            <p className={styles.copy}>
              Remove the Kritzel editor watermark with a commercial license. Send us a short message and we will get back to you.
            </p>
          </header>

          <form
            className={styles.form}
            action="https://formspree.io/f/xpqvlbvk"
            method="POST"
          >
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="name">
                  Name
                </label>
                <input
                  className={styles.input}
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">
                  Email
                </label>
                <input
                  className={styles.input}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="message">
                How will you use Kritzel?
              </label>
              <textarea
                className={styles.textarea}
                id="message"
                name="message"
                rows={5}
                placeholder="Tell us briefly about your project and licensing needs."
                required
              />
            </div>

            <button type="submit" className={styles.submit}>
              Send license request
            </button>
          </form>
        </section>
      </main>
    </Layout>
  );
}
