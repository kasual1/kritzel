import React, { type ReactNode } from 'react';
import { useAnnouncementBar } from '@docusaurus/theme-common/internal';
import RenameBanner from '@site/src/components/RenameBanner';

/**
 * Docusaurus renders the announcement bar above the navbar on every page (landing, blog, docs). Ours is the
 * "Kritzel is now Updraw" banner with both logos; themeConfig.announcementBar switches it on (not closeable).
 */
export default function AnnouncementBar(): ReactNode {
  const { isActive } = useAnnouncementBar();
  return isActive ? <RenameBanner /> : null;
}
