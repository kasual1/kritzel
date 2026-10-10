import React from "react";
import Header from "@theme-original/BlogPostItem/Header";
import { useBlogPost } from "@docusaurus/plugin-content-blog/client";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./styles.module.css";

type Props = React.ComponentProps<typeof Header>;

export default function HeaderWrapper(props: Props) {
  const { frontMatter, metadata } = useBlogPost();
  const thumbnail = frontMatter.thumbnail as string | undefined;
  const thumbnailUrl = useBaseUrl(thumbnail ?? "");

  return (
    <>
      {thumbnail && (
        <video
          className={styles.thumbnail}
          src={thumbnailUrl}
          aria-label={metadata.title}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      )}
      <Header {...props} />
    </>
  );
}
