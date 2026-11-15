import React, { useState, useEffect, type ReactNode } from 'react';
import Links from '@theme-original/Footer/Links';
import type LinksType from '@theme/Footer/Links';
import type {WrapperProps} from '@docusaurus/types';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { UPDRAW_LOGO_PATH, UPDRAW_LOGO_STROKE_WIDTH, UPDRAW_LOGO_VIEWBOX } from '@site/src/components/Landing/paths';
import {
  getPreferredFramework,
  subscribeToPreferredFramework,
  type Framework,
} from "@site/src/utils/frameworkPreference";

type Props = WrapperProps<typeof LinksType>;

function replaceFrameworkInPath(path: string, framework: Framework): string {
  return path.replace(/\/docs\/(angular|react|vue)\//, `/docs/${framework}/`);
}

export default function LinksWrapper(props: Props): ReactNode {
  const [framework, setFramework] = useState<Framework>(getPreferredFramework);
  const homeUrl = useBaseUrl('/');
  // The mark is drawn inline from the same path data as the header logo (written by `npm run logo:generate`), so
  // the footer can't show an older mark than the header: a separate /img/logo.svg request could be served stale.
  const logoSvg =
    `<svg class="updraw-footer-brand__logo" viewBox="${UPDRAW_LOGO_VIEWBOX}" aria-hidden="true">` +
    `<path fill="currentColor" stroke="currentColor" stroke-width="${UPDRAW_LOGO_STROKE_WIDTH}" stroke-linejoin="round" d="${UPDRAW_LOGO_PATH}"/></svg>`;

  useEffect(() => {
    return subscribeToPreferredFramework(setFramework);
  }, []);

  const brandSection = {
    title: '',
    items: [
      {
        html: `<div class="updraw-footer-brand"><a href="${homeUrl}" class="updraw-footer-brand__logo-badge" aria-label="Go to Updraw home page">${logoSvg}</a><p class="updraw-footer-brand__description">Build infinite canvas experiences in minutes.</p></div>`,
      },
    ],
  };

  const patchedProps = {
    ...props,
    links: [
      brandSection,
      ...props.links.map((section: any) => {
        if (section.title !== 'Documentation') return section;
        return {
          ...section,
          items: section.items.map((item: any) => {
            if (!item.to || !item.to.match(/\/docs\/(angular|react|vue)\//)) return item;
            return { ...item, to: replaceFrameworkInPath(item.to, framework) };
          }),
        };
      }),
    ],
  };

  return (
    <>
      <Links {...patchedProps} />
    </>
  );
}
