import Link from "@docusaurus/Link";
import { ArrowIcon } from "../Landing/Icon";
import { InstallCommand } from "../Landing/InstallCommand";
import styles from "./styles.module.css";

export function CallToActionBar({ docsPath }: { docsPath: string }) {
  return (
    <div className={styles.ctaAnchor}>
      <InstallCommand />
      <div className={styles.ctaBar}>
        <Link href="https://app.updraw.io" className={styles.ctaPrimary}>
          Demo <ArrowIcon />
        </Link>
        <Link to={docsPath} className={styles.ctaSecondary}>
          Get started <ArrowIcon />
        </Link>
      </div>
    </div>
  );
}
