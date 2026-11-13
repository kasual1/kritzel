import Link from "@docusaurus/Link";
import { ArrowIcon } from "../Landing/Icon";
import { InstallCommand } from "../Landing/InstallCommand";
import styles from "./styles.module.css";
import { useAppUrl } from "@site/src/utils/siteUrls";

export function CallToActionBar({ docsPath }: { docsPath: string }) {
  const appUrl = useAppUrl();
  return (
    <div className={styles.ctaAnchor}>
      <InstallCommand />
      <div className={styles.ctaBar}>
        <Link href={appUrl} className={styles.ctaPrimary}>
          Demo <ArrowIcon />
        </Link>
        <Link to={docsPath} className={styles.ctaSecondary}>
          Get started <ArrowIcon />
        </Link>
      </div>
    </div>
  );
}
