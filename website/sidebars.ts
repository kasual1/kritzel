import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: ['overview', 'quick-start', 'basic-usage'],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      collapsed: true,
      items: ['concept-components', 'concept-tools', 'concept-objects', 'concept-workspaces', 'theming', 'concept-collaboration'],
    },
    {
      type: 'category',
      label: 'Examples',
      collapsed: true,
      items: ['example-custom-toolbar'],
    },
    {
      type: 'category',
      label: 'License',
      collapsed: true,
      items: ['license'],
    },
    {
      type: 'category',
      label: 'Api Reference',
      collapsed: true,
      items: ['api-reference-editor', 'api-reference-engine', 'types'],
    }
  ],
};

export default sidebars;
