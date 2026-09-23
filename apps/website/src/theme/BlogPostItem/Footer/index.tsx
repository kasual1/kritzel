import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';
import { ThemeClassNames } from '@docusaurus/theme-common';
import EditMetaRow from '@theme/EditMetaRow';
import ReadMoreLink from '@theme/BlogPostItem/Footer/ReadMoreLink';

export default function BlogPostItemFooter(): ReactNode {
  const { metadata, isBlogPostPage } = useBlogPost();
  const { title, editUrl, hasTruncateMarker, lastUpdatedBy, lastUpdatedAt } =
    metadata;

  const truncatedPost = !isBlogPostPage && hasTruncateMarker;
  const renderFooter = truncatedPost || editUrl;

  if (!renderFooter) {
    return null;
  }

  if (isBlogPostPage) {
    const canDisplayEditMetaRow = !!(editUrl || lastUpdatedAt || lastUpdatedBy);

    return (
      <footer className="docusaurus-mt-lg">
        {canDisplayEditMetaRow && (
          <EditMetaRow
            className={clsx(
              'margin-top--sm',
              ThemeClassNames.blog.blogFooterEditMetaRow,
            )}
            editUrl={editUrl}
            lastUpdatedAt={lastUpdatedAt}
            lastUpdatedBy={lastUpdatedBy}
          />
        )}
      </footer>
    );
  }

  return (
    <footer className="row docusaurus-mt-lg">
      {truncatedPost && (
        <div className="col text--right">
          <ReadMoreLink blogPostTitle={title} to={metadata.permalink} />
        </div>
      )}
    </footer>
  );
}