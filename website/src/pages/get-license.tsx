import { useState, type FormEvent, type ReactNode } from "react";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";

import styles from "./get-license.module.css";

type SubmissionStatus = "idle" | "submitting" | "success" | "error";

export default function GetLicensePage(): ReactNode {
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const form = event.currentTarget;
    setSubmissionStatus("submitting");

    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: new FormData(form),
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        setSubmissionStatus("error");
        return;
      }

      form.reset();
      setSubmissionStatus("success");
    } catch {
      setSubmissionStatus("error");
    }
  };

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
            onSubmit={handleSubmit}
          >
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

            <button
              type="submit"
              className={styles.submit}
              disabled={submissionStatus === "submitting"}
            >
              {submissionStatus === "submitting" ? "Sending…" : "Send license request"}
            </button>

            <div className={styles.status} aria-live="polite">
              {submissionStatus === "success" && (
                <p className={styles.success}>Your request was sent. We will get back to you soon.</p>
              )}
              {submissionStatus === "error" && (
                <p className={styles.error}>We could not send your request. Please try again.</p>
              )}
            </div>
          </form>
        </section>
      </main>
    </Layout>
  );
}
