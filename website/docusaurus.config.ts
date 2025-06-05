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
  url: "https://your-docusaurus-site.example.com",
  baseUrl: "/",
  
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
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl:
            "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
          breadcrumbs: false,
        },
        theme: {
          customCss: [
            require.resolve("./src/css/theming.css"),
            require.resolve("./src/css/typography.css"),
            require.resolve("./src/css/header.css"),
            require.resolve("./src/css/navbar.css"),
            require.resolve("./src/css/hero.css"),
            require.resolve("./src/css/buttons.css"),
            require.resolve("./src/css/general.css"),
          ],
        },
      } satisfies Preset.Options,
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
          href: 'https://github.com/your-username/your-repo-name', // Replace with your GitHub repo URL
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
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
