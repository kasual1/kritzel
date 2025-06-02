import type { ReactNode } from "react";
import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

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
        Experience an infinite canvas that expands with your creativity,
        perfect for sketching, painting, or designing without limits.
      </>
    ),
  },
  {
    title: "Open Source",
    Svg: require("@site/static/img/lock.svg").default,
    description: (
      <>
        Kritzel is free, open source, and community-driven. Contribute,
        suggest features, or just use it in your projects.
      </>
    ),
  },
  {
    title: "Framework Agnostic",
    Svg: require("@site/static/img/code.svg").default,
    description: (
      <>
        Integrates seamlessly with any JavaScript framework like React, Vue,
        Angular, or plain JavaScript. Focus on creativity, not compatibility.
      </>
    ),
  },
  {
    title: "Customizable",
    Svg: require("@site/static/img/palette.svg").default,
    description: (
      <>
        Tailor Kritzel to your needs with a wide range of customizable tools,
        brushes, and settings.
      </>
    ),
  },
  {
    title: "Cross-Platform",
    Svg: require("@site/static/img/cross-device.svg").default,
    description: (
      <>
        Kritzel works on any platform that supports JavaScript, including
        desktops, tablets, and mobile devices. Create anywhere, anytime.
      </>
    ),
  },
  {
    title: "Simple Interface",
    Svg: require("@site/static/img/cable.svg").default,
    description: (
      <>
        Enjoy a clean and intuitive interface that makes it easy to integrate Kritzel
        into your projects.
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
