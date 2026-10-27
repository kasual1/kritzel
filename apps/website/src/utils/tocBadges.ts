import type { TOCItem } from '@docusaurus/mdx-loader';

/** Maps heading ids to the badge label shown next to that heading in the table of contents. */
export type TocBadges = Record<string, string>;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Reads the `toc_badges` front matter of a doc, e.g.
 *
 * ```yaml
 * toc_badges:
 *   object-titlebar: Preview
 * ```
 */
export function getTocBadges(frontMatter: Record<string, unknown>): TocBadges | undefined {
  const badges = frontMatter.toc_badges;
  if (!badges || typeof badges !== 'object') {
    return undefined;
  }
  return badges as TocBadges;
}

// TOC item values are rendered as HTML, so the badge is appended as markup.
export function withTocBadges(toc: readonly TOCItem[], badges: TocBadges | undefined): readonly TOCItem[] {
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
      value: `<span class="toc-badge-label">${item.value}</span><span class="toc-badge">${escapeHtml(badge)}</span>`,
    };
  });
}
