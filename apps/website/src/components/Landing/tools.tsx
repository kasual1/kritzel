import type { ReactNode } from "react";

/** Icons of the mock editor toolbar, as children of a 24x24 Lucide-style SVG. */
export const TOOLS: ReadonlyArray<{ label: string; icon: ReactNode }> = [
  { label: "Select", icon: <path d="M4.04 4.65a.5.5 0 0 1 .61-.61l15.5 5.94a.5.5 0 0 1-.05.95l-6.1 1.88a1 1 0 0 0-.66.66l-1.88 6.1a.5.5 0 0 1-.95.05z" /> },
  { label: "Pen", icon: <path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" /> },
  {
    label: "Eraser",
    icon: (
      <>
        <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
        <path d="M22 21H7" />
        <path d="m5 11 9 9" />
      </>
    ),
  },
  {
    label: "Arrow",
    icon: (
      <>
        <path d="M5 19 19 5" />
        <path d="M15 5h4v4" />
      </>
    ),
  },
  { label: "Rectangle", icon: <rect x="3" y="3" width="18" height="18" rx="2" /> },
  {
    label: "Text",
    icon: (
      <>
        <path d="M12 4v16" />
        <path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" />
        <path d="M9 20h6" />
      </>
    ),
  },
  {
    label: "Image",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" />
      </>
    ),
  },
];
