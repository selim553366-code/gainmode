/**
 * After `vite build`, writes one static HTML file per public route with its own title, description,
 * canonical URL, social tags, structured data and a short text version of the page. Search engines and
 * link previews read it straight away; React replaces the text version as soon as the app starts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTES, SITE_URL } from './seo-routes.mjs';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'public');
const template = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function page(route) {
  const url = SITE_URL + (route.path === '/' ? '/' : route.path);
  const image = `${SITE_URL}/${route.image}`;
  const head = [
    `<title>${esc(route.title)}</title>`,
    `<meta name="description" content="${esc(route.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:title" content="${esc(route.title)}" />`,
    `<meta property="og:description" content="${esc(route.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:title" content="${esc(route.title)}" />`,
    `<meta name="twitter:description" content="${esc(route.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': route.schema })}</script>`,
  ].join('\n    ');
  const links = route.links.map(([href, label]) => `<li><a href="${esc(href)}">${esc(label)}</a></li>`).join('');
  const body = `<main><h1>${esc(route.h1)}</h1>${route.body.map((p) => `<p>${esc(p)}</p>`).join('')}<ul>${links}</ul></main>`;
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/\s*<meta name="description"[^>]*>/, '')
    .replace(/\s*<meta property="og:title"[^>]*>/, '')
    .replace(/\s*<meta property="og:description"[^>]*>/, '')
    .replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  return html;
}

for (const route of ROUTES) {
  const file = route.path === '/' ? path.join(dir, 'index.html') : path.join(dir, route.path, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, page(route));
}
// The GainMode page under its short addresses too, so shared links land on the same content.
for (const alias of ['gainmode', 'indir', 'download']) {
  fs.mkdirSync(path.join(dir, alias), { recursive: true });
  fs.writeFileSync(path.join(dir, alias, 'index.html'), page(ROUTES.find((r) => r.path === '/work/gainmode')));
}

const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(dir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ROUTES.map((r) => `  <url><loc>${SITE_URL}${r.path === '/' ? '/' : r.path}</loc><lastmod>${today}</lastmod><priority>${r.priority}</priority></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(dir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`prerendered ${ROUTES.length} routes`);
