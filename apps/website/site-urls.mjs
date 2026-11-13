// Public origins of the website and the hosted app. Builds take them from the environment so the same code can
// be deployed under another domain (e.g. the previous one, during a domain move); the deploy workflows set them
// from the repository variables WEBSITE_URL and APP_URL.

/**
 * Reads an origin such as `https://updraw.io` from an environment variable.
 * @param {string} name - Environment variable name
 * @param {string} fallback - Origin used when the variable is unset or empty
 * @returns {string} The origin, without a trailing slash
 */
function readOrigin(name, fallback) {
  const value = process.env[name]?.trim() || fallback;
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute URL such as ${fallback}, got "${value}"`);
  }
  if (url.origin !== value.replace(/\/$/, '')) {
    throw new Error(`${name} must be an origin without a path, such as ${fallback}, got "${value}"`);
  }
  return url.origin;
}

/** Origin the website is served from; used for canonical URLs, the sitemap, robots.txt and llms.txt. */
export const SITE_URL = readOrigin('UPDRAW_WEBSITE_URL', 'https://updraw.io');

/** Origin of the hosted app that the website links to. */
export const APP_URL = readOrigin('UPDRAW_APP_URL', 'https://app.updraw.io');
