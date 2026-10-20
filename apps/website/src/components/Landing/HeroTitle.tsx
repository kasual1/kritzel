import { useEffect, useState } from "react";
import styles from "./styles.module.css";

const TITLE_ACCENT = "\u00a0Canvas";
const SECOND_LINE = "Development Kit";

export default function HeroTitle({
  prefix = "The Infinite",
  className = styles.heroTitle,
  accentClassName = styles.heroTitleAccent,
}: {
  prefix?: string;
  className?: string;
  accentClassName?: string;
}) {
  const firstLine = prefix + TITLE_ACCENT;
  const characterCount = firstLine.length + SECOND_LINE.length;
  // Start hidden so the server-rendered title does not flash before the typing animation begins.
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionPreference.matches) {
      setVisibleCount(characterCount);
      return;
    }

    let count = 0;
    const timer = window.setInterval(() => {
      count += 1;
      setVisibleCount(count);
      if (count === characterCount) window.clearInterval(timer);
    }, 40);
    const finish = () => {
      if (!motionPreference.matches) return;
      window.clearInterval(timer);
      setVisibleCount(characterCount);
    };
    motionPreference.addEventListener("change", finish);
    return () => {
      window.clearInterval(timer);
      motionPreference.removeEventListener("change", finish);
    };
  }, [characterCount]);

  const character = (letter: string, index: number) => (
    <span
      key={index}
      className={styles.heroTitleCharacter}
      data-hidden={index >= visibleCount || undefined}
    >
      {letter}
      {(index === visibleCount - 1 || (index === 0 && visibleCount === 0)) && (
        <span
          className={styles.heroTitleCursor}
          data-start={visibleCount === 0 || undefined}
        />
      )}
    </span>
  );

  const accentLetters = Array.from(TITLE_ACCENT);
  const revealedAccentCount = Math.min(Math.max(visibleCount - prefix.length, 0), accentLetters.length);
  const cursorIndex = visibleCount === 0 ? 0 : visibleCount - 1;
  const accentCursor = cursorIndex >= prefix.length && cursorIndex < firstLine.length && (
    <span className={styles.heroTitleCharacter}>
      <span className={styles.heroTitleCursor} data-start={visibleCount === 0 || undefined} />
    </span>
  );

  return (
    <>
      {/* Without JavaScript the typing animation never runs, so show the full title instead.
          Kept outside the h1 so its CSS text is never read as part of the heading. */}
      <noscript>
        <style>{`.${styles.heroTitleCharacter}[data-hidden], .${styles.heroTitleAccentPending} { visibility: visible; } .${styles.heroTitleCursor} { display: none; } .${styles.heroTitleAccentPending} { background: linear-gradient(100deg, #0a0a0a 10%, #5b5b66 90%); -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; }`}</style>
      </noscript>
      <h1 className={className} aria-label={`${prefix} Canvas ${SECOND_LINE}`}>
        <span aria-hidden="true">
          <span className={styles.heroTitleLine}>
            {Array.from(prefix).map((letter, index) => character(letter, index))}
            {/* WebKit does not clip the gradient to positioned descendants of a background-clip: text element
                (they turn invisible) and paints hidden descendants anyway, so the gradient span holds only the
                revealed accent as plain text, and the cursor and pending text sit outside it. */}
            {visibleCount === 0 && accentCursor}
            <span className={accentClassName}>{accentLetters.slice(0, revealedAccentCount).join("")}</span>
            {visibleCount > 0 && accentCursor}
            <span className={styles.heroTitleAccentPending}>{accentLetters.slice(revealedAccentCount).join("")}</span>
          </span>
          <span className={styles.heroTitleLine}>
            {Array.from(SECOND_LINE).map((letter, index) => character(letter, index + firstLine.length))}
          </span>
        </span>
      </h1>
    </>
  );
}
