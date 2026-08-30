import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: ['getting-started/quick-start', 'getting-started/basic-usage'],
    },
    {
      type: 'category',
      label: 'Fundamentals',
      collapsed: true,
      items: [
        'fundamentals/tools',
        'fundamentals/objects',
        'fundamentals/viewport',
        'fundamentals/workspaces',
        'fundamentals/persistence',
        'fundamentals/controls',
      ],
    },
    {
      type: 'category',
      label: 'Advanced',
      collapsed: true,
      items: [
        'advanced/user-management',
        'advanced/collaboration',
        'advanced/dynamic-objects',
      ],
    },
    {
      type: 'category',
      label: 'Customization',
      collapsed: true,
      items: [
        'customization/themes',
        'customization/fonts',
        'customization/icons',
        'customization/locales',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      collapsed: true,
      items: ['examples/object-explorer', 'examples/blueprint-defect-mapper', 'examples/slideshow-presentation', 'examples/image-annotation-studio'],
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
      items: ['api-reference/editor', 'api-reference/engine'],
    }
  ],
};

export default sidebars;
