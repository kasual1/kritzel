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
      collapsed: false,
      items: ['concept-components', 'concept-tools', 'concept-objects', 'concept-workspaces', 'collaboration', 'theming'],
    },
    {
      type: 'category',
      label: 'Examples',
      collapsed: false,
      items: ['example-custom-toolbar'],
    },
    {
      type: 'category',
      label: 'License',
      collapsed: false,
      items: ['license'],
    },
    {
      type: 'category',
      label: 'Api Reference',
      collapsed: false,
      items: ['api-reference-editor', 'api-reference-engine', 'types'],
    }
  ],
};

export default sidebars;
