import { createContext, useContext } from 'react';
import type { TOCItem } from '@docusaurus/mdx-loader';

/** Maps heading ids to the badge label shown next to that heading, e.g. `Preview`. */
export type HeadingBadges = Record<string, string>;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Reads the `heading_badges` front matter of a doc, e.g.
 *
 * ```yaml
 * heading_badges:
 *   object-titlebar: Preview
 * ```
 */
export function getHeadingBadges(frontMatter: Record<string, unknown>): HeadingBadges | undefined {
  const badges = frontMatter.heading_badges;
  if (!badges || typeof badges !== 'object') {
    return undefined;
  }
  return badges as HeadingBadges;
}

// Provided by DocItem/Content, so headings outside of docs never get a badge.
export const HeadingBadgesContext = createContext<HeadingBadges | undefined>(undefined);

export function useHeadingBadge(id: string | undefined): string | undefined {
  const badges = useContext(HeadingBadgesContext);
  const badge = id ? badges?.[id] : undefined;
  return typeof badge === 'string' ? badge : undefined;
}

// TOC item values are rendered as HTML, so the badge is appended as markup. The TOC column is too narrow
// for a text badge next to longer headings, so the badge is a small marker with the label as tooltip.
export function withTocBadges(toc: readonly TOCItem[], badges: HeadingBadges | undefined): readonly TOCItem[] {
  if (!badges) {
    return toc;
  }
  return toc.map((item) => {
    const badge = badges[item.id];
    if (typeof badge !== 'string') {
      return item;
    }
    return {
      ...item,
      value: `${item.value}<span class="toc-badge" role="img" title="${escapeHtml(badge)}" aria-label="${escapeHtml(badge)}"></span>`,
    };
  });
}
