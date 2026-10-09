import React, { type ReactNode } from 'react';
import BlogListPage from '@theme-original/BlogListPage';
import type { Props } from '@theme/BlogListPage';

export default function BlogListPageWrapper(props: Props): ReactNode {
  return <BlogListPage {...props} sidebar={{ ...props.sidebar, items: [] }} />;
}
