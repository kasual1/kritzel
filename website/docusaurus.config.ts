import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Kritzel - Free Infinite Canvas Library",
  tagline: "Kritzel is a open-source infinite canvas editor",
  favicon: "img/logo.svg",
  future: {
    v4: true,
  },
  url: "https://kasual1.github.io",
  baseUrl: process.env.Docusaurus_BASE_URL || "/kritzel/",
  projectName: "kritzel",
  onBrokenLinks: "warn",
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },
  themes: ["@docusaurus/theme-mermaid"],

  presets: [
    [
      "classic",
      {
        docs: false,
        blog: false,
        theme: {
          customCss: [
            require.resolve("./src/css/theming.css"),
            require.resolve("./src/css/typography.css"),
            require.resolve("./src/css/header.css"),
            require.resolve("./src/css/navbar.css"),
            require.resolve("./src/css/hero.css"),
            require.resolve("./src/css/buttons.css"),
            require.resolve("./src/css/general.css"),
            require.resolve("./src/css/footer.css"),
          ],
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    function suppressWebpackCacheWarnings() {
      return {
        name: "suppress-webpack-cache-warnings",
        configureWebpack() {
          return {
            infrastructureLogging: {
              level: "error",
            },
          };
        },
      };
    },
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "angular",
        path: "docs/angular",
        routeBasePath: "docs/angular",
        sidebarPath: "./sidebars.ts",
        breadcrumbs: false,
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "react",
        path: "docs/react",
        routeBasePath: "docs/react",
        sidebarPath: "./sidebars.ts",
        breadcrumbs: false,
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "vue",
        path: "docs/vue",
        routeBasePath: "docs/vue",
        sidebarPath: "./sidebars.ts",
        breadcrumbs: false,
      },
    ],
  ],

  themeConfig: {
    image: "img/docusaurus-social-card.jpg",
    navbar: {
      title: "Kritzel",
      logo: {
        alt: "Kritzel Infinite Canvas",
        src: "img/logo.svg",
        width: 32,
        height: 32,
      },
      items: [
        {
          type: 'dropdown',
          label: 'Features',
          position: 'right',
          items: [
            {
              label: 'Infinite Canvas',
              to: '/features/infinite-canvas',
            },
            {
              label: 'Framework Agnostic',
              to: '/features/framework-agnostic',
            },
            {
              label: 'Real-time Collaboration',
              to: '/features/real-time-collaboration',
            },
            {
              label: 'Drawing Tools',
              to: '/features/drawing-tools',
            },
          ],
        },
        {
          type: 'custom-pricingLink',
          label: 'Pricing',
          to: '/pricing',
          position: 'right',
        },
        {
          type: 'custom-docsLink',
          label: 'Documentation',
          to: '/docs/react/overview',
          position: 'right',
        },
        {
          type: 'dropdown',
          position: 'right',
          label: 'Angular',
          items: [
            {
              label: 'Angular',
              to: '/docs/angular/overview',
              activeBasePath: 'docs/angular'
            },
            {
              label: 'React',
              to: '/docs/react/overview',
              activeBasePath: 'docs/react'
            },
            {
              label: 'Vue',
              to: '/docs/vue/overview',
              activeBasePath: 'docs/vue'
            },
          ],
        },
      ],
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    prism: {
      theme: prismThemes.github,
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/angular/overview',
            },
            {
              label: 'API Reference',
              to: '/docs/general/index',
            },
            {
              label: 'Examples',
              to: '#', // Placeholder
            },
          ],
        },
        {
          title: 'Frameworks',
          items: [
            {
              label: 'Angular',
              to: '/docs/angular/overview',
            },
            {
              label: 'React',
              to: '/docs/react/overview',
            },
            {
              label: 'Vue',
              to: '/docs/vue/overview',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/kasual1/kritzel',
            },
            {
              label: 'Discord',
              href: '#', // Placeholder
            },
            {
              label: 'Twitter',
              href: '#', // Placeholder
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Demo',
              href: 'https://kasual1.github.io/kritzel/demo/',
            },
            {
              label: 'Blog',
              to: '#', // Placeholder
            },
            {
              label: 'Changelog',
              to: '#', // Placeholder
            },
            {
              label: 'License',
              href: 'https://github.com/kasual1/kritzel/blob/main/LICENSE',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Kritzel. All rights reserved.`,
    },
  } satisfies Preset.ThemeConfig,
  headTags: [
    {
      tagName: "link",
      attributes: {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Schoolbell&display=swap",
      },
    },
  ],
};

export default config;
