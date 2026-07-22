import type { ReactNode } from "react";
import type { Props } from "@theme/Icon/Close";
import { X } from "lucide-react";

export default function IconClose({
  width = 24,
  height = 24,
  color: _color,
  ...props
}: Props): ReactNode {
  return <X width={width} height={height} aria-hidden="true" {...props} color="currentColor" />;
}