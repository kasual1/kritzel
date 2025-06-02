import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // By default, Docusaurus generates a sidebar from the docs folder structure

  // But you can create a sidebar manually
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Configuration',
      items: [
        'configuration/editor',
        'configuration/toolbar',
        'configuration/icons',
        'configuration/fonts',
      ],
    },
    'theming',
    // {
    //   type: 'category',
    //   label: 'Components',
    //   items: [
    //     'components/core/kritzel-engine',
    //     'components/core/kritzel-editor',
    //   ],
    // },
  ],
};

export default sidebars;
