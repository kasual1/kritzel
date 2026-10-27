import React from "react";
import Content from "@theme-original/DocItem/Content";
import type ContentType from "@theme/DocItem/Content";
import type { WrapperProps } from "@docusaurus/types";
import { useDoc } from "@docusaurus/plugin-content-docs/client";
import { getHeadingBadges, HeadingBadgesContext } from "@site/src/utils/headingBadges";

type Props = WrapperProps<typeof ContentType>;

// Makes the badges declared in the `heading_badges` front matter available to the headings of the doc.
export default function ContentWrapper(props: Props) {
  const { frontMatter } = useDoc();
  return (
    <HeadingBadgesContext.Provider value={getHeadingBadges(frontMatter)}>
      <Content {...props} />
    </HeadingBadgesContext.Provider>
  );
}
