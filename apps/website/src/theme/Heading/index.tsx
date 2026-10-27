import React from "react";
import Heading from "@theme-original/Heading";
import type HeadingType from "@theme/Heading";
import type { WrapperProps } from "@docusaurus/types";
import { useHeadingBadge } from "@site/src/utils/headingBadges";
import styles from "./styles.module.css";

type Props = WrapperProps<typeof HeadingType>;

// Renders the badge declared for this heading in the `heading_badges` front matter next to its title.
export default function HeadingWrapper(props: Props) {
  const badge = useHeadingBadge(props.id);
  if (!badge) {
    return <Heading {...props} />;
  }
  return (
    <Heading {...props}>
      {props.children}
      <span className={styles.badge}>{badge}</span>
    </Heading>
  );
}
