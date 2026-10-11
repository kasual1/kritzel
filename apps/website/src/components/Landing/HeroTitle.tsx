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

  return (
    <>
      {/* Without JavaScript the typing animation never runs, so show the full title instead.
          Kept outside the h1 so its CSS text is never read as part of the heading. */}
      <noscript>
        <style>{`.${styles.heroTitleCharacter}[data-hidden] { visibility: visible; } .${styles.heroTitleCursor} { display: none; }`}</style>
      </noscript>
      <h1 className={className} aria-label={`${prefix} Canvas ${SECOND_LINE}`}>
        <span aria-hidden="true">
          <span className={styles.heroTitleLine}>
            {Array.from(prefix).map((letter, index) => character(letter, index))}
            <span className={accentClassName}>
              {Array.from(TITLE_ACCENT).map((letter, index) => character(letter, index + prefix.length))}
            </span>
          </span>
          <span className={styles.heroTitleLine}>
            {Array.from(SECOND_LINE).map((letter, index) => character(letter, index + firstLine.length))}
          </span>
        </span>
      </h1>
    </>
  );
}
