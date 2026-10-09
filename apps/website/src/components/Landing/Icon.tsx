import type { ReactNode } from "react";

type IconProps = {
  size?: number;
  strokeWidth?: number;
  children: ReactNode;
};

/** Stroke icon wrapper matching the lucide-style icons used in the design. */
export default function Icon({ size = 20, strokeWidth = 2, children }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function ArrowIcon() {
  return (
    <Icon size={16}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}

export function GitHubIcon({ size = 22 }: { size?: number }) {
  return <img src="/img/github-framework.svg" width={size} height={size} alt="" aria-hidden="true" />;
}
