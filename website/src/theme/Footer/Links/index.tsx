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
  const logoUrl = useBaseUrl('/img/logo.svg');

  useEffect(() => {
    return subscribeToPreferredFramework(setFramework);
  }, []);

  const brandSection = {
    title: '',
    items: [
      {
        html: `<div class="kritzel-footer-brand"><div class="kritzel-footer-brand__logo-badge"><img src="${logoUrl}" alt="Kritzel logo" class="kritzel-footer-brand__logo" /></div><p class="kritzel-footer-brand__description">A framework-agnostic canvas library for drawing, real-time collaboration, and AI-powered creative tools.</p></div>`,
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
