import { useEffect, useState } from "react";
import Link from "@docusaurus/Link";
import Icon, { ArrowIcon } from "../Landing/Icon";
import styles from "./styles.module.css";

const INSTALL_COMMAND = "npm i @kritzel/cli";

export function CallToActionBar({ docsPath }: { docsPath: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timeout = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const copy = () => {
    navigator.clipboard?.writeText(INSTALL_COMMAND).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  };

  return (
    <div className={styles.ctaAnchor}>
      <div className={styles.ctaBar}>
        <Link href="https://app.kritzel.io" className={styles.ctaPrimary}>
          Demo <ArrowIcon />
        </Link>
        <Link to={docsPath} className={styles.ctaSecondary}>
          Get started <ArrowIcon />
        </Link>
        <div className={styles.ctaInstall}>
          <span className={styles.ctaPrompt}>$</span>
          <code className={styles.ctaCode}>{INSTALL_COMMAND}</code>
          <button
            type="button"
            className={styles.ctaCopy}
            onClick={copy}
            aria-label={copied ? "Copied install command" : "Copy install command"}
          >
            {copied ? (
              <Icon size={16}>
                <path d="M20 6 9 17l-5-5" />
              </Icon>
            ) : (
              <Icon size={16}>
                <rect x="9" y="9" width="12" height="12" rx="2" />
                <path d="M5 15V5a2 2 0 0 1 2-2h10" />
              </Icon>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
