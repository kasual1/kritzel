import React, { useState, useEffect, type ReactNode } from 'react';
import Links from '@theme-original/Footer/Links';
import type LinksType from '@theme/Footer/Links';
import type {WrapperProps} from '@docusaurus/types';
import useBaseUrl from '@docusaurus/useBaseUrl';
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
  const logoUrl = useBaseUrl('/img/logo.svg');

  useEffect(() => {
    return subscribeToPreferredFramework(setFramework);
  }, []);

  const brandSection = {
    title: '',
    items: [
      {
        html: `<div class="updraw-footer-brand"><a href="${homeUrl}" class="updraw-footer-brand__logo-badge" aria-label="Go to Updraw home page"><img src="${logoUrl}" alt="Updraw logo" class="updraw-footer-brand__logo" /></a><p class="updraw-footer-brand__description">Build infinite canvas experiences in minutes.</p></div>`,
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
