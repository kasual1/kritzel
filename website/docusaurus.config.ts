import { themes as prismThemes } from "prism-react-renderer";
import fs from "node:fs";
import nodePath from "node:path";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const SITE_URL = "https://kritzel.io";
const SITE_BASE_URL = process.env.Docusaurus_BASE_URL || "/";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const DEFAULT_DEMO_BASE_URLS = IS_PRODUCTION
  ? {
    angular: "https://kasual1.github.io/kritzel-demos/angular",
    react: "https://kasual1.github.io/kritzel-demos/react",
    vue: "https://kasual1.github.io/kritzel-demos/vue",
  }
  : {
    angular: "http://localhost:4200",
    react: "http://localhost:5173",
    vue: "http://localhost:5174",
  };

const DEMO_BASE_URLS = {
  angular: process.env.DEMO_BASE_URL_ANGULAR || DEFAULT_DEMO_BASE_URLS.angular,
  react: process.env.DEMO_BASE_URL_REACT || DEFAULT_DEMO_BASE_URLS.react,
  vue: process.env.DEMO_BASE_URL_VUE || DEFAULT_DEMO_BASE_URLS.vue,
};
const ABSOLUTE_URL = (path: string) =>
  `${SITE_URL}${SITE_BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

const FRAMEWORKS = ["angular", "react", "vue"] as const;

// Legacy flat doc paths -> current category-based paths, applied to every framework instance.
const LEGACY_DOC_PATHS: Record<string, string> = {
  "quick-start": "getting-started/quick-start",
  "basic-usage": "getting-started/basic-usage",
  "components/concept-editor": "fundamentals/components/editor",
  "components/concept-engine": "fundamentals/components/engine",
  "concept-tools": "fundamentals/tools",
  "concept-objects": "fundamentals/objects",
  "concept-viewport": "fundamentals/viewport",
  "concept-workspaces": "fundamentals/workspaces",
  "concept-persistence": "fundamentals/persistence",
  "advanced/concept-collaboration": "advanced/collaboration",
  "advanced/concept-dynamic-objects": "advanced/dynamic-objects",
  "advanced/concept-user-management": "advanced/user-management",
  "advanced/customization/concept-theming": "customization/themes",
  "advanced/customization/concept-fonts": "customization/fonts",
  "advanced/customization/concept-icons": "customization/icons",
  "advanced/customization/concept-localization": "customization/locales",
  "example-object-explorer": "examples/object-explorer",
  "example-blueprint-defect-mapper": "examples/blueprint-defect-mapper",
  "example-slideshow-presentation": "examples/slideshow-presentation",
  "example-image-annotation-studio": "examples/image-annotation-studio",
  "example-infinite-canvas-gallery": "examples/infinite-canvas-gallery",
  "api-reference-editor": "api-reference/editor",
  "api-reference-engine": "api-reference/engine",
  "api-reference-tools": "api-reference/tools",
  "api-reference": "api-reference/overview",
  objects: "api-reference/object-types",
  tools: "api-reference/built-in-tools",
  theming: "api-reference/theme-tokens",
  types: "api-reference/types",
};

const DOC_REDIRECTS = FRAMEWORKS.flatMap((framework) =>
  Object.entries(LEGACY_DOC_PATHS)
    // not every page exists for every framework
    .filter(([, to]) => fs.existsSync(nodePath.join(__dirname, "docs", framework, `${to}.md`)))
    .map(([from, to]) => ({
      from: `/docs/${framework}/${from}`,
      to: `/docs/${framework}/${to}`,
    })),
);

const config: Config = {
  title: "Kritzel - Infinite Canvas Library for React, Vue & Angular",
  tagline: "Kritzel helps you build infinite canvas experiences featuring real-time collaboration and high-performance drawing tools. Easily integrate it into React, Vue & Angular.",
  favicon: "img/favicon.svg",
  future: {
    v4: true,
  },
  url: SITE_URL,
  baseUrl: SITE_BASE_URL,
  trailingSlash: true,
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
  customFields: {
    demoBaseUrls: DEMO_BASE_URLS,
  },
  clientModules: [require.resolve("./src/clientModules/pageTransition.ts")],
  themes: ["@docusaurus/theme-mermaid"],

  presets: [
    [
      "classic",
      {
        docs: false,
        blog: {
          showReadingTime: true,
          blogSidebarTitle: 'All posts',
          routeBasePath: 'blog',
        },
        sitemap: {
          changefreq: "weekly",
          priority: 0.5,
          filename: "sitemap.xml",
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
            ignoreWarnings: [
              {
                module: /vscode-languageserver-types/,
                message: /Critical dependency/,
              },
            ],
          };
        },
      };
    },
    [
      "@docusaurus/plugin-client-redirects",
      {
        redirects: DOC_REDIRECTS,
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "angular",
        path: "docs/angular",
        routeBasePath: "docs/angular",
        sidebarPath: "./sidebars.ts",
        breadcrumbs: true,
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "react",
        path: "docs/react",
        routeBasePath: "docs/react",
        sidebarPath: "./sidebars.ts",
        breadcrumbs: true,
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "vue",
        path: "docs/vue",
        routeBasePath: "docs/vue",
        sidebarPath: "./sidebars.ts",
        breadcrumbs: true,
      },
    ],
  ],

  themeConfig: {
    blog: {
      sidebar: {
        groupByYear: false,
      },
    },
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
          type: 'custom-blogLink',
          label: 'Blog',
          position: 'right',
        },
        {
          type: 'custom-docsLink',
          label: 'Documentation',
          to: '/docs/react/getting-started/quick-start',
          position: 'right',
        },
        {
          type: 'dropdown',
          position: 'right',
          label: 'Angular',
          items: [
            {
              label: 'React',
              to: '/docs/react/getting-started/quick-start',
              activeBasePath: 'docs/react'
            },
            {
              label: 'Vue',
              to: '/docs/vue/getting-started/quick-start',
              activeBasePath: 'docs/vue'
            },
            {
              label: 'Angular',
              to: '/docs/angular/getting-started/quick-start',
              activeBasePath: 'docs/angular'
            },
          ],
        },
        {
          label: 'Get License',
          to: '/get-license',
          position: 'right',
          className: 'navbar-get-license-link',
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
              to: '/docs/react/getting-started/quick-start',
            },
            {
              label: 'Examples',
              to: '/docs/react/examples/object-explorer',
            },
          ],
        },
        {
          title: 'Frameworks',
          items: [
            {
              label: 'Angular',
              to: '/docs/angular/getting-started/quick-start',
            },
            {
              label: 'React',
              to: '/docs/react/getting-started/quick-start',
            },
            {
              label: 'Vue',
              to: '/docs/vue/getting-started/quick-start',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              html: '<a href="https://x.com/kritzel_io" target="_blank" rel="noopener noreferrer" class="footer__link-item">X</a>',
            },
            {
              html: '<a href="https://linkedin.com/in/kritzel-app-26721b40b" target="_blank" rel="noopener noreferrer" class="footer__link-item">LinkedIn</a>',
            },
            {
              html: '<a href="https://bsky.app/profile/kritzelio.bsky.social" target="_blank" rel="noopener noreferrer" class="footer__link-item">Bluesky</a>',
            },
            {
              html: '<a href="https://github.com/kritzelapp" target="_blank" rel="noopener noreferrer" class="footer__link-item">GitHub</a>',
            },
            {
              html: '<a href="https://www.npmjs.com/package/kritzel-stencil" target="_blank" rel="noopener noreferrer" class="footer__link-item">NPM</a>',
            },
          ],
        },
      ],
      copyright: `<span class="footer__meta"><span class="footer__meta-item">Copyright © ${new Date().getFullYear()} Kritzel</span></span>`,
    },
  } satisfies Preset.ThemeConfig,
  headTags: [
    {
      tagName: "script",
      attributes: {
        defer: true,
        src: "https://cloud.umami.is/script.js",
        "data-website-id": "f5a72d39-5ee9-4d3d-852c-a0dc99199d9e",
      },
    },
    // Structured data: WebSite (enables Sitelinks Searchbox eligibility)
    {
      tagName: "script",
      attributes: {
        type: "application/ld+json",
      },
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Kritzel",
        alternateName: "Kritzel Infinite Canvas Library",
        url: ABSOLUTE_URL("/"),
        description:
          "Kritzel is a framework-agnostic infinite canvas and collaborative whiteboard library for Angular, React, and Vue.",
      }),
    },
    // Structured data: Organization
    {
      tagName: "script",
      attributes: {
        type: "application/ld+json",
      },
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Kritzel",
        url: ABSOLUTE_URL("/"),
        logo: ABSOLUTE_URL("/img/logo.svg"),
        sameAs: ["https://github.com/kasual1/kritzel"],
      }),
    },
    // Structured data: SiteNavigationElement list (helps Google surface Sitelinks)
    {
      tagName: "script",
      attributes: {
        type: "application/ld+json",
      },
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: [
          {
            "@type": "SiteNavigationElement",
            position: 1,
            name: "Documentation",
            description: "Guides, concepts, and API reference for the Kritzel infinite canvas library.",
            url: ABSOLUTE_URL("/docs/react/getting-started/quick-start"),
          },
          {
            "@type": "SiteNavigationElement",
            position: 2,
            name: "Getting Started",
            description: "Quick start guide to install and integrate Kritzel into your app.",
            url: ABSOLUTE_URL("/docs/react/getting-started/quick-start"),
          },
          {
            "@type": "SiteNavigationElement",
            position: 3,
            name: "API Reference",
            description: "Detailed reference for the Kritzel editor and engine components.",
            url: ABSOLUTE_URL("/docs/react/api-reference/editor"),
          },
          {
            "@type": "SiteNavigationElement",
            position: 4,
            name: "Angular",
            description: "Use Kritzel in Angular applications.",
            url: ABSOLUTE_URL("/docs/angular/getting-started/quick-start"),
          },
          {
            "@type": "SiteNavigationElement",
            position: 5,
            name: "React",
            description: "Use Kritzel in React applications.",
            url: ABSOLUTE_URL("/docs/react/getting-started/quick-start"),
          },
          {
            "@type": "SiteNavigationElement",
            position: 6,
            name: "Vue",
            description: "Use Kritzel in Vue applications.",
            url: ABSOLUTE_URL("/docs/vue/getting-started/quick-start"),
          },
          {
            "@type": "SiteNavigationElement",
            position: 7,
            name: "Get License",
            description: "Contact us to remove the Kritzel editor watermark with a commercial license.",
            url: ABSOLUTE_URL("/get-license"),
          },
        ],
      }),
    },
  ],
};

export default config;
