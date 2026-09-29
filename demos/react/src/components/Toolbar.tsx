import type { ReactNode } from "react";
import "./Toolbar.css";

export function Toolbar({ children }: { children?: ReactNode }) {
  return <div className="demo-toolbar">{children}</div>;
}
