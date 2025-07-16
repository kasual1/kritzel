import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Kritzel - Free Infinite Canvas Library",
  tagline: "Kritzel is a open-source infinite canvas editor",
  favicon: "img/favicon.svg",
  future: {
    v4: true,
  },
  url: "https://kasual1.github.io",
  baseUrl: "/kritzel/",
  projectName: "kritzel",
  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

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
            require.resolve("./src/css/general.css")
          ],
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
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
        srcDark: "img/logo_dark.svg",
      },
      items: [
        {
          type: 'dropdown',
          position: 'right',
          label: 'Angular',
          items: [
            {
              label: 'Angular',
              to: '/docs/angular/getting-started',
              activeBasePath: 'docs/angular'
            },
            {
              label: 'React',
              to: '/docs/react/getting-started',
              activeBasePath: 'docs/react'
            },
            {
              label: 'Vue',
              to: '/docs/vue/getting-started',
              activeBasePath: 'docs/vue'
            },
          ],
        },
        {
          href: "https://github.com/kasual1/kritzel",
          position: "right",
          className: "header-github-link",
          "aria-label": "GitHub repository",
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
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
