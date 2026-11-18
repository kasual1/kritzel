import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

/** Origin of the hosted app, from `customFields.appUrl` (set from UPMADE_APP_URL at build time). */
export function useAppUrl(): string {
  const { siteConfig } = useDocusaurusContext();
  const appUrl = siteConfig.customFields?.appUrl;
  return typeof appUrl === "string" ? appUrl : "https://app.upmade.io";
}

/** Host name of the website, e.g. `upmade.io` (from the site's `url`, set from UPMADE_WEBSITE_URL at build time). */
export function useSiteHost(): string {
  const { siteConfig } = useDocusaurusContext();
  return new URL(siteConfig.url).host;
}
