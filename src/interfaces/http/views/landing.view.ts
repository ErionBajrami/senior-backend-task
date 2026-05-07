import type { Link } from '../../../domain/entities/link.js';
import { escapeHtml as e } from './escape-html.js';

interface CategoryGroup {
  name: string | null;
  links: readonly Link[];
}

function groupByCategory(links: readonly Link[]): readonly CategoryGroup[] {
  const map = new Map<string | null, Link[]>();
  for (const link of links) {
    const key = link.category === null ? null : link.category.value;
    const arr = map.get(key) ?? [];
    arr.push(link);
    map.set(key, arr);
  }
  return [...map.entries()]
    .map(([name, list]): CategoryGroup => ({ name, links: list }))
    .sort((a, b) => {
      if (a.name === null) {
        return 1;
      }
      if (b.name === null) {
        return -1;
      }
      return a.name.localeCompare(b.name);
    });
}

function renderIcon(link: Link): string {
  if (link.iconUrl !== null) {
    return `<img src="${e(link.iconUrl.value)}" alt="" loading="lazy">`;
  }
  const initial = (link.title.value.charAt(0) || '?').toUpperCase();
  return `<span aria-hidden="true">${e(initial)}</span>`;
}

function renderCard(link: Link): string {
  const description =
    link.description !== null ? `<p class="description">${e(link.description.value)}</p>` : '';
  return `<a class="card" href="/go/${e(link.id.value)}" rel="noopener">
        <div class="icon">${renderIcon(link)}</div>
        <div class="card-body">
          <h3 class="title">${e(link.title.value)}</h3>
          ${description}
        </div>
      </a>`;
}

function renderCategory(group: CategoryGroup): string {
  const heading = group.name ?? 'Uncategorized';
  return `<section class="category">
      <h2>${e(heading)}</h2>
      <div class="grid">
        ${group.links.map(renderCard).join('\n        ')}
      </div>
    </section>`;
}

function renderEmpty(): string {
  return `<div class="empty">
      <p>No links configured yet.</p>
      <p>Sign in as the admin (POST <code>/v1/auth/login</code>) and create one to populate this page.</p>
    </div>`;
}

export function renderLandingPage(links: readonly Link[]): string {
  const groups = groupByCategory(links);
  const body = groups.length === 0 ? renderEmpty() : groups.map(renderCategory).join('\n    ');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Quanos — Developer Tools</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body>
  <header>
    <h1>Developer Tools</h1>
    <p class="subtitle">Internal links for the platform team.</p>
  </header>
  <main>
    ${body}
  </main>
  <footer>
    <p>Last refreshed at ${e(new Date().toISOString())} · <a href="/admin">Admin</a></p>
  </footer>
</body>
</html>`;
}
