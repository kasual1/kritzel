import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { demoRoutes, type DemoRoute } from "../demo-routes";

interface DemoCategory {
  title: string;
  links: readonly DemoRoute[];
}

const categories = createCategories(demoRoutes.filter((route) => route.isIndexed !== false));
const demoCount = categories.reduce((count, category) => count + category.links.length, 0);

export function DemoIndexPage() {
  const [query, setQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<ReadonlySet<string>>(
    () => new Set(categories.map((category) => category.title)),
  );
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const filteredCategories = terms.length === 0
    ? categories
    : categories
      .map((category) => ({
        ...category,
        links: category.links.filter((link) => {
          const searchableText = `${category.title} ${link.title} ${link.context ?? ""} ${link.path}`.toLocaleLowerCase();
          return terms.every((term) => searchableText.includes(term));
        }),
      }))
      .filter((category) => category.links.length > 0);
  const visibleDemoCount = filteredCategories.reduce((count, category) => count + category.links.length, 0);

  function updateQuery(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setCollapsedCategories(new Set(categories.map((category) => category.title)));
      return;
    }

    setCollapsedCategories(new Set());
  }

  function toggleCategory(category: string) {
    setCollapsedCategories((current) => {
      const updated = new Set(current);
      if (updated.has(category)) {
        updated.delete(category);
      } else {
        updated.add(category);
      }
      return updated;
    });
  }

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <h1 style={headingStyle}>Demo directory</h1>
        <p style={summaryStyle}>{visibleDemoCount} of {demoCount} routes</p>
        <label htmlFor="demo-search" style={labelStyle}>Search demos</label>
        <input
          id="demo-search"
          type="search"
          placeholder="Search by name, category, or path"
          autoComplete="off"
          value={query}
          onChange={(event) => updateQuery(event.currentTarget.value)}
          style={inputStyle}
        />
      </header>

      <main style={mainStyle}>
        {filteredCategories.map((category) => {
          const isCollapsed = collapsedCategories.has(category.title);
          const categoryId = `${category.title.toLocaleLowerCase().replace(/\s+/g, "-")}-demos`;

          return (
            <section key={category.title}>
              <h2 style={categoryHeadingStyle}>
                <button
                  type="button"
                  aria-expanded={!isCollapsed}
                  aria-controls={categoryId}
                  onClick={() => toggleCategory(category.title)}
                  style={categoryButtonStyle}
                >
                  <span aria-hidden="true" style={{ ...chevronStyle, transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)" }}>&gt;</span>
                  <span>{category.title}</span>
                  <span style={categoryCountStyle}>{category.links.length}</span>
                </button>
              </h2>
              {!isCollapsed && (
                <nav id={categoryId} aria-label={`${category.title} demos`} style={navStyle}>
                  {category.links.map((link) => (
                    <Link key={link.path} to={link.path} style={linkStyle}>
                      <span style={linkCopyStyle}>
                        <strong style={linkTitleStyle}>{link.title}</strong>
                        {link.context && <small style={contextStyle}>{link.context}</small>}
                      </span>
                    </Link>
                  ))}
                </nav>
              )}
            </section>
          );
        })}
        {filteredCategories.length === 0 && <p style={summaryStyle}>No demos match &quot;{query}&quot;.</p>}
      </main>
    </div>
  );
}

function createCategories(routes: readonly DemoRoute[]): DemoCategory[] {
  const groupedRoutes = new Map<string, DemoRoute[]>();
  for (const route of routes) {
    const categoryRoutes = groupedRoutes.get(route.category) ?? [];
    categoryRoutes.push(route);
    groupedRoutes.set(route.category, categoryRoutes);
  }

  return [...groupedRoutes].map(([title, links]) => ({ title, links }));
}

const pageStyle: CSSProperties = { height: "100dvh", overflowY: "auto", color: "#202124", background: "#ffffff", fontFamily: "Roboto, sans-serif" };
const headerStyle: CSSProperties = { maxWidth: "800px", margin: "0 auto", padding: "32px 24px 24px", boxSizing: "border-box", borderBottom: "1px solid #e5e5e5" };
const headingStyle: CSSProperties = { margin: 0, fontSize: "28px", lineHeight: 1.2, letterSpacing: 0 };
const summaryStyle: CSSProperties = { margin: "6px 0 0", color: "#666666", fontSize: "14px" };
const labelStyle: CSSProperties = { display: "block", marginTop: "24px", marginBottom: "6px", fontSize: "13px", fontWeight: 500 };
const inputStyle: CSSProperties = { width: "min(100%, 560px)", height: "40px", padding: "0 12px", boxSizing: "border-box", color: "inherit", background: "#ffffff", border: "1px solid #c7c7c7", borderRadius: "4px", font: "inherit", fontSize: "14px" };
const mainStyle: CSSProperties = { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "12px", maxWidth: "800px", margin: "0 auto", padding: "32px 24px 64px", boxSizing: "border-box" };
const categoryHeadingStyle: CSSProperties = { margin: 0, letterSpacing: 0, borderBottom: "1px solid #cfcfcf" };
const categoryButtonStyle: CSSProperties = { display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 4px", color: "inherit", background: "transparent", border: 0, cursor: "pointer", font: "inherit", fontSize: "16px", fontWeight: 600, textAlign: "left" };
const chevronStyle: CSSProperties = { width: "16px", textAlign: "center", transition: "transform 120ms ease" };
const categoryCountStyle: CSSProperties = { marginLeft: "auto", color: "#777777", fontSize: "13px", fontWeight: 400, fontVariantNumeric: "tabular-nums" };
const navStyle: CSSProperties = { display: "grid" };
const linkStyle: CSSProperties = { display: "flex", alignItems: "center", minHeight: "48px", padding: "8px 4px", boxSizing: "border-box", color: "inherit", textDecoration: "none", borderBottom: "1px solid #eeeeee" };
const linkCopyStyle: CSSProperties = { display: "grid", gap: "4px", minWidth: 0 };
const linkTitleStyle: CSSProperties = { overflowWrap: "anywhere", fontSize: "14px", fontWeight: 500 };
const contextStyle: CSSProperties = { color: "#777777", fontSize: "12px" };