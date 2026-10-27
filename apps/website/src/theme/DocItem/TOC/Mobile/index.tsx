import React, { type ReactNode, useMemo } from 'react';
import clsx from 'clsx';
import { ThemeClassNames } from '@docusaurus/theme-common';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import TOCCollapsible from '@theme/TOCCollapsible';
import { getTocBadges, withTocBadges } from '@site/src/utils/tocBadges';
import styles from './styles.module.css';

// Same as the original component, but renders the badges declared in the `toc_badges` front matter.
export default function DocItemTOCMobile(): ReactNode {
  const { toc, frontMatter } = useDoc();
  const badgedToc = useMemo(() => withTocBadges(toc, getTocBadges(frontMatter)), [toc, frontMatter]);
  return (
    <TOCCollapsible
      toc={badgedToc}
      minHeadingLevel={frontMatter.toc_min_heading_level}
      maxHeadingLevel={frontMatter.toc_max_heading_level}
      className={clsx(ThemeClassNames.docs.docTocMobile, styles.tocMobile)}
    />
  );
}
