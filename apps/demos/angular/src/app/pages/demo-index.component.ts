import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LucideChevronDown } from '@lucide/angular';
import { Route, Router, RouterLink } from '@angular/router';

interface DemoLink {
  path: string;
  title: string;
  context?: string;
}

interface DemoCategory {
  id: string;
  title: string;
  links: DemoLink[];
}

const INDEX_PATH = 'demos';

@Component({
  selector: 'app-demo-index',
  imports: [LucideChevronDown, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <h1>Demo directory</h1>
      <p class="summary">{{ visibleDemoCount() }} of {{ demoCount }} routes</p>
      <label for="demo-search">Search demos</label>
      <input
        #searchInput
        id="demo-search"
        type="search"
        placeholder="Search by name, category, or path"
        autocomplete="off"
        (input)="updateQuery(searchInput.value)"
      />
    </header>

    <main>
      @for (category of filteredCategories(); track category.id) {
        <section>
          <h2>
            <button
              type="button"
              [attr.aria-expanded]="!isCollapsed(category.id)"
              [attr.aria-controls]="category.id + '-demos'"
              (click)="toggleCategory(category.id)"
            >
              <svg
                lucideChevronDown
                aria-hidden="true"
                [class.collapsed]="isCollapsed(category.id)"
              ></svg>
              <span>{{ category.title }}</span>
              <span class="category-count">{{ category.links.length }}</span>
            </button>
          </h2>
          <nav
            [id]="category.id + '-demos'"
            [attr.aria-label]="category.title + ' demos'"
            [hidden]="isCollapsed(category.id)"
          >
            @for (link of category.links; track link.path) {
              <a [routerLink]="'/' + link.path">
                <span class="link-copy">
                  <strong>{{ link.title }}</strong>
                  @if (link.context) {
                    <small>{{ link.context }}</small>
                  }
                </span>
              </a>
            }
          </nav>
        </section>
      } @empty {
        <p class="empty-state">No demos match “{{ query() }}”.</p>
      }
    </main>
  `,
  styles: [`
    :host {
      display: block;
      height: 100dvh;
      box-sizing: border-box;
      overflow-y: auto;
      color: #202124;
      background: #ffffff;
      font-family: Roboto, sans-serif;
    }

    header {
      max-width: 800px;
      margin: 0 auto;
      padding: 32px 24px 24px;
      box-sizing: border-box;
      border-bottom: 1px solid #e5e5e5;
    }

    h1 {
      margin: 0;
      font-size: 28px;
      line-height: 1.2;
      letter-spacing: 0;
    }

    .summary {
      margin: 6px 0 0;
      color: #666;
      font-size: 14px;
    }

    label {
      display: block;
      margin-top: 24px;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 500;
    }

    input {
      width: min(100%, 560px);
      height: 40px;
      padding: 0 12px;
      box-sizing: border-box;
      color: inherit;
      background: #ffffff;
      border: 1px solid #c7c7c7;
      border-radius: 4px;
      font: inherit;
      font-size: 14px;
    }

    input:focus {
      border-color: #dd0031;
      outline: 2px solid rgb(221 0 49 / 15%);
      outline-offset: 0;
    }

    main {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 12px;
      max-width: 800px;
      margin: 0 auto;
      padding: 32px 24px 64px;
      box-sizing: border-box;
    }

    section {
      min-width: 0;
    }

    h2 {
      margin: 0;
      letter-spacing: 0;
      border-bottom: 1px solid #cfcfcf;
    }

    h2 button {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 4px;
      color: inherit;
      background: transparent;
      border: 0;
      cursor: pointer;
      font: inherit;
      font-size: 16px;
      font-weight: 600;
      text-align: left;
    }

    h2 button:hover,
    h2 button:focus-visible {
      color: #c3002f;
      background: #fafafa;
      outline: none;
    }

    h2 button:focus-visible {
      box-shadow: inset 3px 0 #dd0031;
    }

    h2 svg {
      width: 16px;
      height: 16px;
      transition: transform 120ms ease;
    }

    h2 svg.collapsed {
      transform: rotate(-90deg);
    }

    .category-count {
      margin-left: auto;
      color: #777;
      font-size: 13px;
      font-weight: 400;
      font-variant-numeric: tabular-nums;
    }

    nav {
      display: grid;
    }

    nav[hidden] {
      display: none;
    }

    a {
      display: flex;
      align-items: center;
      min-height: 48px;
      padding: 8px 4px;
      box-sizing: border-box;
      color: inherit;
      text-decoration: none;
      border-bottom: 1px solid #eeeeee;
    }

    a:hover,
    a:focus-visible {
      color: #c3002f;
      background: #fafafa;
      outline: none;
    }

    a:focus-visible {
      box-shadow: inset 3px 0 #dd0031;
    }

    .link-copy {
      display: grid;
      gap: 4px;
      min-width: 0;
    }

    strong {
      overflow-wrap: anywhere;
      font-size: 14px;
      font-weight: 500;
    }

    small {
      color: #777;
      font-size: 12px;
    }

    .empty-state {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    @media (max-width: 600px) {
      header {
        padding-top: 24px;
      }

      main {
        padding-top: 24px;
      }
    }
  `],
})
export class DemoIndexComponent {
  private readonly router = inject(Router);

  readonly categories = this.createCategories(this.router.config);
  readonly demoCount = this.categories.reduce((count, category) => count + category.links.length, 0);
  readonly query = signal('');
  readonly collapsedCategories = signal<ReadonlySet<string>>(new Set(this.categories.map(category => category.id)));
  readonly filteredCategories = computed(() => {
    const terms = this.query().trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) {
      return this.categories;
    }

    return this.categories
      .map(category => ({
        ...category,
        links: category.links.filter(link => {
          const searchableText = `${category.title} ${link.title} ${link.context ?? ''} ${link.path}`.toLocaleLowerCase();
          return terms.every(term => searchableText.includes(term));
        }),
      }))
      .filter(category => category.links.length > 0);
  });
  readonly visibleDemoCount = computed(() => this.filteredCategories()
    .reduce((count, category) => count + category.links.length, 0));

  isCollapsed(category: string): boolean {
    return this.collapsedCategories().has(category);
  }

  toggleCategory(category: string): void {
    this.collapsedCategories.update(categories => {
      const updatedCategories = new Set(categories);
      if (updatedCategories.has(category)) {
        updatedCategories.delete(category);
      } else {
        updatedCategories.add(category);
      }
      return updatedCategories;
    });
  }

  updateQuery(query: string): void {
    this.query.set(query);
    if (!query.trim()) {
      this.collapsedCategories.set(new Set(this.categories.map(category => category.id)));
      return;
    }

    const matchingCategories = new Set(this.filteredCategories().map(category => category.id));
    this.collapsedCategories.update(categories => {
      const updatedCategories = new Set(categories);
      matchingCategories.forEach(category => updatedCategories.delete(category));
      return updatedCategories;
    });
  }

  private createCategories(routes: Route[]): DemoCategory[] {
    const links = this.collectLinks(routes);
    const groupedLinks = new Map<string, DemoLink[]>();

    for (const link of links) {
      const [category] = link.path.split('/');
      const categoryLinks = groupedLinks.get(category) ?? [];
      categoryLinks.push(link);
      groupedLinks.set(category, categoryLinks);
    }

    return [...groupedLinks.entries()].map(([category, categoryLinks]) => ({
      id: category,
      title: this.humanize(category),
      links: categoryLinks,
    }));
  }

  private collectLinks(routes: Route[], parentPath = ''): DemoLink[] {
    return routes.flatMap(route => {
      if (!route.path || route.path === '**' || route.redirectTo) {
        return [];
      }

      const path = [parentPath, route.path].filter(Boolean).join('/');
      if (route.children) {
        return this.collectLinks(route.children, path);
      }

      if (path === INDEX_PATH || (!route.component && !route.loadComponent)) {
        return [];
      }

      const segments = path.split('/');
      return [{
        path,
        title: this.humanize(segments.at(-1) ?? path),
        context: segments.length > 2 ? segments.slice(1, -1).map(segment => this.humanize(segment)).join(' / ') : undefined,
      }];
    });
  }

  private humanize(value: string): string {
    return value
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}