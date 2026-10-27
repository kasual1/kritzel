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
        'fundamentals/objects',
        'fundamentals/tools',
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
        {
          type: 'doc',
          id: 'advanced/collaboration',
          customProps: {
            badge: 'Preview',
          },
        },
        {
          type: 'doc',
          id: 'advanced/dynamic-objects',
          customProps: {
            badge: 'Preview',
          },
        },
        'advanced/import-export',
        {
          type: 'doc',
          id: 'advanced/agentic-cursors',
          customProps: {
            badge: 'Preview',
          },
        },
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
        'customization/object-config',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      collapsed: true,
      items: ['examples/object-explorer', 'examples/blueprint-defect-mapper', 'examples/slideshow-presentation', 'examples/image-annotation-studio', 'examples/performance-showcase'],
    },
    {
      type: 'category',
      label: 'License & Watermark',
      collapsed: true,
      items: ['license'],
    },
    {
      type: 'category',
      label: 'Api Reference',
      collapsed: true,
      items: ['api-reference/editor', 'api-reference/engine', 'api-reference/objects', 'api-reference/tools', 'api-reference/providers', 'api-reference/theming', 'api-reference/icons', 'api-reference/localization-terms'],
    }
  ],
};

export default sidebars;
