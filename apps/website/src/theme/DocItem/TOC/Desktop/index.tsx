import React, { type ReactNode, useMemo } from 'react';
import { ThemeClassNames } from '@docusaurus/theme-common';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import TOC from '@theme/TOC';
import { getHeadingBadges, withTocBadges } from '@site/src/utils/headingBadges';

// Same as the original component, but renders the badges declared in the `heading_badges` front matter.
export default function DocItemTOCDesktop(): ReactNode {
  const { toc, frontMatter } = useDoc();
  const badgedToc = useMemo(() => withTocBadges(toc, getHeadingBadges(frontMatter)), [toc, frontMatter]);
  return (
    <TOC
      toc={badgedToc}
      minHeadingLevel={frontMatter.toc_min_heading_level}
      maxHeadingLevel={frontMatter.toc_max_heading_level}
      className={ThemeClassNames.docs.docTocDesktop}
    />
  );
}
