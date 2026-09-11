import React from "react";
import Footer from "@theme-original/Footer";
import { useLocation } from "@docusaurus/router";

export default function FooterWrapper(props: React.ComponentProps<typeof Footer>) {
  const location = useLocation();
  const isDocsPage = location.pathname.includes("/docs");

  if (isDocsPage) {
    return null;
  }

  return <Footer {...props} />;
}
