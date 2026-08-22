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
      items: ['concept-components', 'concept-tools', 'concept-objects',  'concept-viewport', 'concept-workspaces', 'concept-persistence'],
    },
    {
      type: 'category',
      label: 'Advanced',
      collapsed: true,
      items: [
        'advanced/concept-collaboration',
        'advanced/concept-localization',
        'advanced/concept-context-menus',
        'advanced/concept-login-dialog',
      ],
    },
    {
      type: 'category',
      label: 'Customization',
      collapsed: true,
      items: [
        'advanced/customization/concept-theming',
        'advanced/customization/concept-fonts',
        'advanced/customization/concept-custom-icons',
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
      items: ['api-reference-editor', 'api-reference-engine', 'types'],
    }
  ],
};

export default sidebars;
