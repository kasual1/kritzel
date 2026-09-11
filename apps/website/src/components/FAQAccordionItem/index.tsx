import clsx from "clsx";
import styles from "./styles.module.css";

export interface FAQAccordionItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  buttonId: string;
  panelId: string;
}

export default function FAQAccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
  buttonId,
  panelId,
}: FAQAccordionItemProps) {
  return (
    <article className={styles.item}>
      <button
        id={buttonId}
        type="button"
        className={styles.trigger}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className={styles.question}>{question}</span>
        <span className={clsx(styles.icon, isOpen && styles.iconOpen)} aria-hidden="true">
          +
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={clsx(styles.panel, isOpen ? styles.panelOpen : styles.panelClosed)}
      >
        <div className={styles.panelInner}>
          <p className={styles.answer}>{answer}</p>
        </div>
      </div>
    </article>
  );
}
