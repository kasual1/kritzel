import type { ReactNode } from "react";
import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";
import useBaseUrl from "@docusaurus/useBaseUrl";

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Infinite",
    Svg: require("@site/static/img/infinite.svg").default,
    description: (
      <>
        Kritzel provides an infinite canvas experience, allowing you to create
        and explore without boundaries. Whether you&apos;re sketching, painting,
        or designing, the canvas expands to fit your creativity.
      </>
    ),
  },
  {
    title: "Open Source",
    Svg: require("@site/static/img/lock.svg").default,
    description: (
      <>
        Kritzel is free and open source, built with the community in mind. You
        can contribute to its development, suggest features, or simply use it in
        your projects. Join us in making Kritzel better for everyone!
      </>
    ),
  },
  {
    title: "Framework Agnostic",
    Svg: require("@site/static/img/code.svg").default,
    description: (
      <>
        Kritzel is designed to work with any JavaScript framework or library.
        Whether you&apos;re using React, Vue, Angular, or even plain JavaScript,
        Kritzel integrates seamlessly, allowing you to focus on your creative
        projects without worrying about compatibility.
      </>
    ),
  },
];

function Feature({ title,  Svg, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div style={{height: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Svg className={styles.featureSvg} role="img" style={{height: '64px', width: '64px'}}/>
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
