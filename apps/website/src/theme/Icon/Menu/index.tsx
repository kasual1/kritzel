import type { ReactNode } from "react";
import type { Props } from "@theme/Icon/Menu";
import { Menu } from "lucide-react";

export default function IconMenu({
  width = 30,
  height = 30,
  ...props
}: Props): ReactNode {
  return <Menu width={width} height={height} aria-hidden="true" {...props} />;
}