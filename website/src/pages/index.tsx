import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import Heading from "@theme/Heading";
import ArrowRight from "@site/static/img/arrow_right.svg";

import styles from "./index.module.css";
import React from "react";
import Head from "@docusaurus/Head";

function HomepageHeader() {
  function hideNavbarToggle() {
    const toggle = document.querySelector(
      ".navbar__toggle"
    ) as HTMLElement | null;
    if (toggle) {
      toggle.style.display = "none";
    }
  }

  React.useEffect(() => {
    hideNavbarToggle();
  }, []);

  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        {/* <Heading as="h1" className={clsx('hero__title', styles.heroTitle)}>
          Kritzel Documentation
          <br />
        </Heading>
         <p className={clsx('hero__subtitle', styles.heroSubtitle)}>
          Coming soon!
        </p> */}
        <Heading as="h1" className={clsx("hero__title", styles.heroTitle)}>
          Infinite Canvas,
          <br />
          unbound creativity.
        </Heading>
        <p className={clsx("hero__subtitle", styles.heroSubtitle)}>
          Kritzel is a free and framework-agnostic infinite canvas library
          <br />
          for creating endless creative experiences.
        </p>
        <div className={styles.buttons}>
          <Link
            to="/docs/angular/getting-started"
            className="button button--primary button--lg"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            Get started
            <span className="buttonIcon">
              <ArrowRight style={{ width: "24px", height: "24px" }} />
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
