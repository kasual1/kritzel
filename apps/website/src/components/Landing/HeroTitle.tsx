import { useEffect, useState } from "react";
import styles from "./styles.module.css";

const TITLE_PREFIX = "The Infinite";
const TITLE_ACCENT = "\u00a0Canvas";
const FIRST_LINE = TITLE_PREFIX + TITLE_ACCENT;
const SECOND_LINE = "Development Kit";
const CHARACTER_COUNT = FIRST_LINE.length + SECOND_LINE.length;

export default function HeroTitle() {
  const [visibleCount, setVisibleCount] = useState(CHARACTER_COUNT);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionPreference.matches) return;

    setVisibleCount(0);
    let count = 0;
    const timer = window.setInterval(() => {
      count += 1;
      setVisibleCount(count);
      if (count === CHARACTER_COUNT) window.clearInterval(timer);
    }, 40);
    const finish = () => {
      if (!motionPreference.matches) return;
      window.clearInterval(timer);
      setVisibleCount(CHARACTER_COUNT);
    };
    motionPreference.addEventListener("change", finish);
    return () => {
      window.clearInterval(timer);
      motionPreference.removeEventListener("change", finish);
    };
  }, []);

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
    <h1 className={styles.heroTitle} aria-label="The Infinite Canvas Development Kit">
      <span aria-hidden="true">
        <span className={styles.heroTitleLine}>
          {Array.from(TITLE_PREFIX).map((letter, index) => character(letter, index))}
          <span className={styles.heroTitleAccent}>
            {Array.from(TITLE_ACCENT).map((letter, index) => character(letter, index + TITLE_PREFIX.length))}
          </span>
        </span>
        <span className={styles.heroTitleLine}>
          {Array.from(SECOND_LINE).map((letter, index) => character(letter, index + FIRST_LINE.length))}
        </span>
      </span>
    </h1>
  );
}
