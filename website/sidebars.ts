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
      label: 'Core Concepts',
      collapsed: true,
      items: ['concept-components', 'concept-tools', 'concept-objects',  'concept-viewport', 'concept-workspaces', 'concept-persistence'],
    },
    {
      type: 'category',
      label: 'Advanced Concepts',
      collapsed: true,
      items: [
        'advanced-concepts/concept-collaboration',
        'advanced-concepts/concept-localization',
        'advanced-concepts/concept-context-menus',
        'advanced-concepts/concept-login-dialog',
      ],
    },
    {
      type: 'category',
      label: 'Customization',
      collapsed: true,
      items: [
        'advanced-concepts/customization/concept-theming',
        'advanced-concepts/customization/concept-fonts',
        'advanced-concepts/customization/concept-custom-icons',
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
