import { themes as prismThemes } from "prism-react-renderer";
import fs from "node:fs";
import nodePath from "node:path";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import type { PluginOptions as LlmsPluginOptions } from "docusaurus-plugin-llms";

const SITE_URL = "https://kritzel.io";
const SITE_BASE_URL = process.env.Docusaurus_BASE_URL || "/";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const USE_RSPACK = IS_PRODUCTION || process.platform !== "win32";
const DEFAULT_DEMO_BASE_URLS = IS_PRODUCTION
  ? {
    angular: "https://kritzeljs.github.io/kritzel/angular",
    react: "https://kritzeljs.github.io/kritzel/react",
    vue: "https://kritzeljs.github.io/kritzel/vue",
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
  "api-reference-editor": "api-reference/editor",
  "api-reference-engine": "api-reference/engine",
  objects: "api-reference/objects",
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
    faster: {
      // Rspack 1.7.12 panics in cssExtractHmr.js during Windows development.
      rspackBundler: USE_RSPACK,
      rspackPersistentCache: USE_RSPACK,
    },
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
    [
      "docusaurus-plugin-llms",
      {
        title: "Kritzel",
        description: "The infinite canvas development kit for Angular, React, and Vue.",
        docsDir: FRAMEWORKS.map((framework) => ({
          path: `docs/${framework}`,
          routeBasePath: `docs/${framework}`,
          label: { angular: "Angular", react: "React", vue: "Vue" }[framework],
        })),
        generateLLMsTxt: true,
        generateLLMsFullTxt: false,
        generateMarkdownFiles: true,
        preserveDirectoryStructure: true,
        addMdExtension: true,
        useRelativeUrls: false,
        includeBlog: false,
        excludeImports: true,
        preserveComponents: ["LiveDemo"],
        removeDuplicateHeadings: false,
        rewriteImageUrls: true,
        keepFrontMatter: [],
        includeOrder: [
          "**/getting-started/quick-start.md",
          "**/getting-started/basic-usage.md",
          "**/fundamentals/**",
          "**/api-reference/**",
          "**/customization/**",
          "**/advanced/**",
          "**/examples/**",
        ],
        includeUnmatchedLast: true,
        logLevel: "normal",
        rootContent: [
          "Choose the application's framework first and read only the matching setup and API references. Do not mix Angular, React, and Vue wrappers.",
          "- Use @kritzel/angular-editor, @kritzel/react-editor, or @kritzel/vue-editor for the complete editor UI. Use the matching engine wrapper for a bare canvas and custom UI; the engine registers no tools by default.",
          "- Give the canvas host an explicit width and height. Wait for the editor's isReady or the engine's isEngineReady event before calling methods, and await asynchronous methods.",
          "- Check the installed package version and prefer its TypeScript types when they differ from these current documentation pages.",
          "- Persistence is opt-in through syncConfig. Use a distinct editorId for each instance when multiple canvases can exist.",
          "- Use addObject/addObjects to insert objects and updateObject to change them. Object positions use world coordinates; use screenToWorld to convert pointer coordinates.",
          "- For a reusable coding-agent integration workflow, install the Kritzel skill with `npx skills add kritzeljs/kritzel`.",
          "LiveDemo tags are source metadata, not instructions to execute JSX: repoUrl identifies the public framework demo directory, repoFiles lists source files relative to it, and demoPath identifies the runnable example route. For a source file, replace /tree/ with /blob/ in repoUrl and append its repoFiles path. Runnable demos are hosted at https://kritzeljs.github.io/kritzel/{framework}{demoPath}.",
          "Start with the matching framework's Quick Start and Basic Usage, then follow the focused API or concept pages below. The linked Markdown pages are generated from the same sources as the human documentation.",
        ].join("\n\n"),
      } satisfies LlmsPluginOptions,
    ],
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
    function productionSourceMaps() {
      return {
        name: "production-source-maps",
        configureWebpack(_config, isServer) {
          // Emit source maps for the client bundles so production JS can be debugged
          if (isServer || process.env.NODE_ENV !== "production") {
            return {};
          }
          return {
            devtool: "source-map",
          };
        },
      };
    },
    function preloadCriticalFonts() {
      // Fonts are only discovered after styles.css is parsed, so preload the
      // above-the-fold ones to fetch them in parallel with the stylesheet.
      // Their hashed file names are only known after bundling.
      const fontPrefixes = ["inter-latin-wght-normal-", "jetbrains-mono-latin-wght-normal-"];
      return {
        name: "preload-critical-fonts",
        async postBuild({ outDir, baseUrl }) {
          const fontsDir = nodePath.join(outDir, "assets", "fonts");
          const fontFiles = fs.readdirSync(fontsDir);
          const preloadTags = fontPrefixes
            .map((prefix) => {
              const file = fontFiles.find((name) => name.startsWith(prefix) && name.endsWith(".woff2"));
              if (!file) throw new Error(`Missing font to preload: ${prefix}*.woff2`);
              return `<link rel="preload" href="${baseUrl}assets/fonts/${file}" as="font" type="font/woff2" crossorigin>`;
            })
            .join("");

          const htmlFiles = fs
            .readdirSync(outDir, { recursive: true, encoding: "utf8" })
            .filter((file) => file.endsWith(".html"));
          for (const file of htmlFiles) {
            const filePath = nodePath.join(outDir, file);
            const html = fs.readFileSync(filePath, "utf8");
            const stylesheet = html.search(/<link rel="?stylesheet"?/);
            if (stylesheet === -1) continue;
            fs.writeFileSync(filePath, html.slice(0, stylesheet) + preloadTags + html.slice(stylesheet));
          }
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
        width: 24,
        height: 24,
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
          label: 'GitHub',
          href: 'https://github.com/kritzeljs/kritzel',
          position: 'right',
          className: 'navbar-main-github-link',
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
      style: 'light',
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
              html: '<a href="https://github.com/kritzeljs/kritzel" target="_blank" rel="noopener noreferrer" class="footer__link-item">GitHub</a>',
            },
            {
              html: '<a href="https://www.npmjs.com/package/@kritzel/engine" target="_blank" rel="noopener noreferrer" class="footer__link-item">NPM</a>',
            },
          ],
        },
      ],
      copyright: `<span class="footer__meta"><span class="footer__meta-item">Copyright © ${new Date().getFullYear()} Kritzel</span></span>`,
    },
  } satisfies Preset.ThemeConfig,
  headTags: [
    {
      tagName: "link",
      attributes: {
        rel: "describedby",
        href: ABSOLUTE_URL("/llms.txt"),
      },
    },
    {
      tagName: "link",
      attributes: {
        rel: "apple-touch-icon",
        sizes: "512x512",
        href: "/img/logo_avatar.png",
      },
    },
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
        sameAs: ["https://github.com/kritzeljs/kritzel"],
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
        ],
      }),
    },
  ],
};

export default config;
