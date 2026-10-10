import { useEffect, type ReactNode } from "react";
import { useNavbarMobileSidebar } from "@docusaurus/theme-common/internal";
import { translate } from "@docusaurus/Translate";
import IconMenu from "@theme/Icon/Menu";
import styles from "./styles.module.css";

// Matches the sidebar's slide-out transition (see css/navbar.css).
const SIDEBAR_CLOSE_MS = 250;

/**
 * Hamburger button for the hero's top nav: opens the same mobile sidebar as the navbar's toggle, which
 * is hidden while the hero is in view.
 */
export default function MenuButton(): ReactNode {
  const { toggle, shown } = useNavbarMobileSidebar();

  // The sidebar is rendered inside the (hidden) navbar. While it's open from here, `data-hero-menu`
  // shows the sidebar without revealing the navbar bar (see css/navbar.css).
  useEffect(() => {
    const root = document.documentElement;
    if (shown) {
      if (!root.classList.contains("landing-nav-visible")) {
        root.setAttribute("data-hero-menu", "");
      }
      return;
    }
    if (!root.hasAttribute("data-hero-menu")) {
      return;
    }
    // Let the sidebar slide out, then hide the navbar again without its show/hide animation.
    let frame = 0;
    const timeout = window.setTimeout(() => {
      const animated = root.hasAttribute("data-landing-nav-animated");
      root.removeAttribute("data-landing-nav-animated");
      root.removeAttribute("data-hero-menu");
      if (animated) {
        frame = window.requestAnimationFrame(() => {
          frame = window.requestAnimationFrame(() => root.setAttribute("data-landing-nav-animated", ""));
        });
      }
    }, SIDEBAR_CLOSE_MS);
    return () => {
      window.clearTimeout(timeout);
      window.cancelAnimationFrame(frame);
    };
  }, [shown]);

  useEffect(() => () => document.documentElement.removeAttribute("data-hero-menu"), []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={translate({
        id: "theme.docs.sidebar.toggleSidebarButtonAriaLabel",
        message: "Toggle navigation bar",
        description: "The ARIA label for hamburger menu button of mobile navigation",
      })}
      aria-expanded={shown}
      className={`clean-btn ${styles.topNavIcon} ${styles.topNavMenu}`}
    >
      <IconMenu width={24} height={24} />
    </button>
  );
}
