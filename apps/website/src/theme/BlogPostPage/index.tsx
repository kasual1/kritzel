import React, { type ReactNode } from 'react';
import BlogPostPage from '@theme-original/BlogPostPage';
import type { Props } from '@theme/BlogPostPage';

export default function BlogPostPageWrapper(props: Props): ReactNode {
  return <BlogPostPage {...props} sidebar={{ ...props.sidebar, items: [] }} />;
}
