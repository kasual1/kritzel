import React, { type ComponentProps, type ReactNode } from 'react';
import { TitleFormatterProvider } from '@docusaurus/theme-common/internal';

type Formatter = ComponentProps<typeof TitleFormatterProvider>['formatter'];

/**
 * Appends the site title only to page titles that don't already name Kritzel, so docs titles like
 * "Quick Start | Kritzel for React" stay as they are while "Blog" becomes "Blog | Kritzel".
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
