import React, { type ReactNode, useMemo } from 'react';
import { ThemeClassNames } from '@docusaurus/theme-common';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import TOC from '@theme/TOC';
import { getTocBadges, withTocBadges } from '@site/src/utils/tocBadges';

// Same as the original component, but renders the badges declared in the `toc_badges` front matter.
export default function DocItemTOCDesktop(): ReactNode {
  const { toc, frontMatter } = useDoc();
  const badgedToc = useMemo(() => withTocBadges(toc, getTocBadges(frontMatter)), [toc, frontMatter]);
  return (
    <TOC
      toc={badgedToc}
      minHeadingLevel={frontMatter.toc_min_heading_level}
      maxHeadingLevel={frontMatter.toc_max_heading_level}
      className={ThemeClassNames.docs.docTocDesktop}
    />
  );
}
