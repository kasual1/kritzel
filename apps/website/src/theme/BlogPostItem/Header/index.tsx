import React, { type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';
import BlogPostItemHeaderTitle from '@theme/BlogPostItem/Header/Title';
import BlogPostItemHeaderInfo from '@theme/BlogPostItem/Header/Info';
import BlogPostItemHeaderAuthors from '@theme/BlogPostItem/Header/Authors';
import styles from './styles.module.css';

// Shows the post's front matter `image` (the generated thumbnail, see scripts/thumbnails) above the title:
// linked to the post in the blog list, as a header image on the post page.
function BlogPostItemHeaderImage(): ReactNode {
  const { metadata, assets, isBlogPostPage } = useBlogPost();
  const image = assets.image ?? metadata.frontMatter.image;
  const src = useBaseUrl(image ?? '');
  if (!image) {
    return null;
  }
  const img = (
    <img
      className={styles.image}
      src={src}
      alt=""
      width={1200}
      height={630}
      loading={isBlogPostPage ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
  return isBlogPostPage ? (
    img
  ) : (
    <Link to={metadata.permalink} tabIndex={-1} aria-hidden="true" className={styles.link}>
      {img}
    </Link>
  );
}

export default function BlogPostItemHeader(): ReactNode {
  return (
    <header>
      <BlogPostItemHeaderImage />
      <BlogPostItemHeaderTitle />
      <BlogPostItemHeaderInfo />
      <BlogPostItemHeaderAuthors />
    </header>
  );
}
