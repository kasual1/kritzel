import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: ['quick-start', 'basic-usage'],
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
          items: ['components/concept-editor', 'components/concept-engine'],
        },
        'concept-tools',
        'concept-objects',
        'concept-viewport',
        'concept-workspaces',
        'concept-persistence',
      ],
    },
    {
      type: 'category',
      label: 'Advanced',
      collapsed: true,
      items: [
        'advanced/concept-user-management',
        'advanced/concept-collaboration',
        'advanced/concept-dynamic-objects',
      ],
    },
    {
      type: 'category',
      label: 'Customization',
      collapsed: true,
      items: [
        'advanced/customization/concept-theming',
        'advanced/customization/concept-fonts',
        'advanced/customization/concept-icons',
        'advanced/customization/concept-localization',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      collapsed: true,
      items: ['example-object-explorer', 'example-blueprint-defect-mapper', 'example-slideshow-presentation', 'example-image-annotation-studio'],
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
      items: ['api-reference-editor', 'api-reference-engine'],
    }
  ],
};

export default sidebars;
