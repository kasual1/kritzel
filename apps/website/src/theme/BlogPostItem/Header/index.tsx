import React, { type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';
import BlogPostItemHeaderTitle from '@theme/BlogPostItem/Header/Title';
import BlogPostItemHeaderInfo from '@theme/BlogPostItem/Header/Info';
import BlogPostItemHeaderAuthors from '@theme/BlogPostItem/Header/Authors';
import styles from './styles.module.css';

// Shows the post's front matter `thumbnail` video, or else its `image` (the generated thumbnail, see
// scripts/thumbnails), above the title: linked to the post in the blog list, as a header on the post page.
function BlogPostItemHeaderImage(): ReactNode {
  const { metadata, assets, isBlogPostPage } = useBlogPost();
  const video = metadata.frontMatter.thumbnail as string | undefined;
  const image = assets.image ?? metadata.frontMatter.image;
  const videoSrc = useBaseUrl(video ?? '');
  const src = useBaseUrl(image ?? '');
  if (!video && !image) {
    return null;
  }
  const img = video ? (
    <video
      className={styles.image}
      src={videoSrc}
      // placeholder size until the video's metadata arrives (recordings are 16:9)
      width={1920}
      height={1080}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
    />
  ) : (
    <img
      className={styles.image}
      src={src}
      alt=""
      // placeholder size so lazy loading sees a box before the image arrives (generated thumbnails are
      // 1200×630); `height: auto` in CSS keeps the image's own aspect ratio
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
