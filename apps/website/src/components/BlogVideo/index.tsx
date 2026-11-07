import React, { type ReactNode } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import blogVideos from '@site/src/data/blog-videos.json';
import styles from './styles.module.css';

interface BlogVideoMeta {
  poster: string;
  width: number;
  height: number;
}

const VIDEOS: Record<string, BlogVideoMeta | undefined> = blogVideos;

/**
 * A muted, looping video inside a blog post. Poster and size come from `blog-videos.json` (see tools/blog-videos), so
 * the layout stays stable until the video loads.
 */
export default function BlogVideo({ src, label }: { src: string; label?: string }): ReactNode {
  const video = VIDEOS[src];
  const url = useBaseUrl(src);
  const poster = useBaseUrl(video?.poster ?? '');
  return (
    <video
      className={styles.video}
      src={url}
      poster={video ? poster : undefined}
      width={video?.width ?? 1280}
      height={video?.height ?? 720}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
