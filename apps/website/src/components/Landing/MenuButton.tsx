import type { ReactNode } from "react";
import { useNavbarMobileSidebar } from "@docusaurus/theme-common/internal";
import { translate } from "@docusaurus/Translate";
import IconMenu from "@theme/Icon/Menu";
import styles from "./styles.module.css";

/**
 * Hamburger button for the hero's top nav: opens the same mobile sidebar as the navbar's toggle, which
 * is hidden while the hero is in view.
 */
export default function MenuButton(): ReactNode {
  const { toggle, shown } = useNavbarMobileSidebar();
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
