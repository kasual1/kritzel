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
        Deploy an infinite canvas that expands with your users' creativity, 
        allowing them to sketch, paint, or design without limits.
      </>
    ),
  },
  {
    title: "Realtime Collaboration",
    Svg: require("@site/static/img/lock.svg").default,
    description: (
      <>
        Enable users to collaborate in real-time, making it easy for teams 
        to work together on projects, share ideas, and see changes instantly.
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
    title: "AI Ready",
    Svg: require("@site/static/img/ai.svg").default,
    description: (
      <>
        Enhance your agentic coding workflow with ready made skills and a dedicated MCP server.
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
        <Heading as="h2">{title}</Heading>
        <p className={styles.featureDescription}>{description}</p>
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
