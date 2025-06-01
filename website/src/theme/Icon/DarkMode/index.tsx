import React, { type ReactNode } from "react";
import type DarkModeType from "@theme/Icon/DarkMode";
import type { WrapperProps } from "@docusaurus/types";
import Moon from "@site/static/img/moon.svg";

type Props = WrapperProps<typeof DarkModeType>;

export default function DarkModeWrapper(props: Props): ReactNode {
  return <Moon {...props} style={{ height: "32px", width: "32px" }} />;
}
