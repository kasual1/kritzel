import React, { type ComponentProps, type ReactNode } from 'react';
import { TitleFormatterProvider } from '@docusaurus/theme-common/internal';

type Formatter = ComponentProps<typeof TitleFormatterProvider>['formatter'];

/**
 * Appends the site title only to page titles that don't already name Updraw, so docs titles like
 * "Quick Start | Updraw for React" stay as they are while "Blog" becomes "Blog | Updraw".
 */
const formatter: Formatter = (params) => {
  const title = params.title?.trim();
  if (title && title.includes(params.siteTitle)) {
    return title;
  }
  return params.defaultFormatter(params);
};

export default function ThemeProviderTitleFormatter({ children }: { children: ReactNode }): ReactNode {
  return <TitleFormatterProvider formatter={formatter}>{children}</TitleFormatterProvider>;
}
