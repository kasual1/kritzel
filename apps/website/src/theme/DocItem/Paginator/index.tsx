import React from "react";
import Paginator from "@theme-original/DocItem/Paginator";
import type PaginatorType from "@theme/DocItem/Paginator";
import type { WrapperProps } from "@docusaurus/types";
import DocsFootnote from "@site/src/components/DocsFootnote";

type Props = WrapperProps<typeof PaginatorType>;

// Docs pages show a simplified footnote inside the content column instead of the site footer.
export default function PaginatorWrapper(props: Props) {
  return (
    <>
      <Paginator {...props} />
      <DocsFootnote />
    </>
  );
}
