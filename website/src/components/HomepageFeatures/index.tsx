import type { ReactNode } from "react";
import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";
import useBaseUrl from "@docusaurus/useBaseUrl";

type FeatureItem = {
  title: string;
  imgSrc: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Infinite",
    imgSrc: "/img/infinite.svg",
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
    imgSrc: "/img/lock.svg",
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
    imgSrc: "/img/code.svg",
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

function Feature({ title, imgSrc, description }: FeatureItem) {
  const resolvedImgSrc = useBaseUrl(imgSrc);
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center padding-horiz--md">
        <img
          src={resolvedImgSrc}
          className={styles.featureSvg}
          alt={title}
          role="img"
        />
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
