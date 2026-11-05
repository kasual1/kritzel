import React, { useEffect, useRef, type ReactNode } from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';
import BlogPostItemHeaderTitle from '@theme/BlogPostItem/Header/Title';
import BlogPostItemHeaderInfo from '@theme/BlogPostItem/Header/Info';
import BlogPostItemHeaderAuthors from '@theme/BlogPostItem/Header/Authors';
import blogVideos from '@site/src/data/blog-videos.json';
import styles from './styles.module.css';

/** What `npm run videos:optimize` records about each blog video, keyed by its URL (see tools/blog-videos). */
interface BlogVideo {
  /** The first frame: shown until the video plays, so playback starts without a jump. */
  poster: string;
  /** The most telling frame, for search engines. Never shown on the page. */
  thumbnail: string;
  width: number;
  height: number;
  duration: number;
}

const VIDEOS: Record<string, BlogVideo | undefined> = blogVideos;

/** ISO 8601 duration, as schema.org expects it: 19.1 s → PT19.1S. */
function isoDuration(seconds: number): string {
  return `PT${Math.round(seconds * 100) / 100}S`;
}

/**
 * The post page's video, described for search engines: VideoObject structured data, og:video tags and a preload of
 * the poster, which is the first thing the page paints.
 */
function BlogPostVideoHead({ video, src }: { video: BlogVideo; src: string }): ReactNode {
  const { metadata } = useBlogPost();
  const contentUrl = useBaseUrl(src, { absolute: true });
  const thumbnailUrl = useBaseUrl(video.thumbnail, { absolute: true });
  const posterPath = useBaseUrl(video.poster);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: metadata.title,
    description: metadata.description,
    thumbnailUrl,
    contentUrl,
    uploadDate: metadata.date,
    duration: isoDuration(video.duration),
    width: video.width,
    height: video.height,
  };
  return (
    <Head>
      <link rel="preload" as="image" href={posterPath} fetchPriority="high" />
      <meta property="og:video" content={contentUrl} />
      <meta property="og:video:type" content="video/mp4" />
      <meta property="og:video:width" content={String(video.width)} />
      <meta property="og:video:height" content={String(video.height)} />
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Head>
  );
}

/**
 * A muted, looping video. On the post page it plays right away; in the blog list it loads nothing until it scrolls
 * into view and pauses again when it leaves, so a list of posts doesn't download every video at once.
 */
function BlogVideoPlayer({ src, video, isBlogPostPage }: { src: string; video?: BlogVideo; isBlogPostPage: boolean }): ReactNode {
  const ref = useRef<HTMLVideoElement>(null);
  const poster = useBaseUrl(video?.poster ?? '');

  useEffect(() => {
    const element = ref.current;
    if (isBlogPostPage || !element || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.play().catch(() => {
            // Autoplay can be refused (e.g. data saver); the poster stays visible then.
          });
        } else {
          element.pause();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [isBlogPostPage]);

  return (
    <video
      ref={ref}
      className={styles.image}
      src={src}
      poster={video ? poster : undefined}
      // the real size keeps the layout stable until the poster arrives; `height: auto` in CSS keeps the ratio
      width={video?.width ?? 1920}
      height={video?.height ?? 1080}
      autoPlay={isBlogPostPage}
      muted
      loop
      playsInline
      preload={isBlogPostPage ? 'metadata' : 'none'}
      aria-hidden="true"
    />
  );
}

// Shows the post's front matter `thumbnail` video, or else its `image` (the generated thumbnail, see
// scripts/thumbnails), above the title: linked to the post in the blog list, as a header on the post page.
function BlogPostItemHeaderImage(): ReactNode {
  const { metadata, assets, isBlogPostPage } = useBlogPost();
  const thumbnail = metadata.frontMatter.thumbnail as string | undefined;
  const image = assets.image ?? metadata.frontMatter.image;
  const videoSrc = useBaseUrl(thumbnail ?? '');
  const src = useBaseUrl(image ?? '');
  if (!thumbnail && !image) {
    return null;
  }
  const video = thumbnail ? VIDEOS[thumbnail] : undefined;
  const img = thumbnail ? (
    <BlogVideoPlayer src={videoSrc} video={video} isBlogPostPage={isBlogPostPage} />
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
    <>
      {thumbnail && video && <BlogPostVideoHead video={video} src={thumbnail} />}
      {img}
    </>
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
