import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const output = fileURLToPath(new URL('../dist-pages/', import.meta.url));
const html = readFileSync(resolve(output, 'index.html'), 'utf8');
const pagesPath = process.env.PAGES_BASE_PATH?.replace(/^\/+|\/+$/g, '') ?? '';
const base = pagesPath ? `/${pagesPath}/` : '/';

test('static HTML keeps Japanese metadata and search opt-out before JavaScript runs', () => {
  assert.match(html, /<html lang="ja">/);
  assert.match(html, /<title>キャラクター発注室/);
  for (const name of ['robots', 'googlebot']) {
    assert.match(html, new RegExp(`<meta name="${name}" content="noindex, nofollow, noarchive, nosnippet, noimageindex"`));
  }
  assert.match(html, /id="root"/);
  assert.match(html, /<noscript>/);
});

test('scripts, styles and favicon resolve under the Pages base path', () => {
  const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(urls.some((url) => url.endsWith('.js')), 'compiled JavaScript is included');
  assert.ok(urls.some((url) => url.endsWith('.css')), 'compiled styles are included');
  assert.ok(urls.some((url) => url.endsWith('favicon.svg')), 'favicon is included');
  for (const url of urls) {
    assert.ok(url.startsWith(base), `asset must use ${base}: ${url}`);
    assert.ok(existsSync(resolve(output, url.slice(base.length))), `asset exists: ${url}`);
  }
  assert.doesNotMatch(html, /main\.tsx|localhost|chatgpt\.site|%BASE_URL%/);
});

test('only static distribution files are published', () => {
  assert.ok(existsSync(resolve(output, '.nojekyll')));
  assert.equal(readFileSync(resolve(output, 'robots.txt'), 'utf8'), readFileSync(new URL('../app/robots.txt', import.meta.url), 'utf8'));
  // Crawlers must be allowed to read the noindex meta tag.
  assert.match(readFileSync(resolve(output, 'robots.txt'), 'utf8'), /Allow: \//);
  const files = readdirSync(output, { recursive: true });
  assert.ok(files.every((file) => !/(?:^|[/\\])(?:\.git|\.openai|server|node_modules)(?:[/\\]|$)/.test(file)));
  assert.ok(files.every((file) => !/\.(?:tsx?|map)$/.test(file)));
});
