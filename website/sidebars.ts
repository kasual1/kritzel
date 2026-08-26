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
        {
          type: 'category',
          label: 'Components',
          collapsed: true,
          items: ['fundamentals/components/editor', 'fundamentals/components/engine'],
        },
        'fundamentals/tools',
        'fundamentals/objects',
        'fundamentals/viewport',
        'fundamentals/workspaces',
        'fundamentals/persistence',
      ],
    },
    {
      type: 'category',
      label: 'Advanced',
      collapsed: true,
      items: [
        'advanced/collaboration',
        'advanced/dynamic-objects',
      ],
    },
    {
      type: 'category',
      label: 'Customization',
      collapsed: true,
      items: [
        'customization/theming',
        'customization/fonts',
        'customization/icons',
        'customization/localization',
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
