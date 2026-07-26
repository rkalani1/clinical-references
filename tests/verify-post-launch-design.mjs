import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const directoryHtml = readFileSync(join(repositoryRoot, 'index.html'), 'utf8');
const directorySource = [
  directoryHtml,
  readFileSync(join(repositoryRoot, 'assets/directory.css'), 'utf8'),
  readFileSync(join(repositoryRoot, 'assets/directory.js'), 'utf8'),
].join('\n');

assert.ok(
  directoryHtml.indexOf('class="scope-alert"') < directoryHtml.indexOf('class="card"'),
  'The synthetic-demo scope note must appear before the first guide card.'
);
assert.match(directoryHtml, /id="reference-search"[^>]*type="search"/);
assert.match(directoryHtml, /id="reference-count"[^>]*aria-live="polite"/);
assert.match(directoryHtml, /id="directory-empty"[^>]*hidden/);
assert.match(directorySource, /className = 'card-details-toggle'/);
assert.doesNotMatch(directoryHtml, />\s*Open Guide\s*</);

const cardDestinationPattern = /<a\s+href="\.\/([^"]+\/index\.html)"\s+class="card-action"/g;
const destinations = [...directoryHtml.matchAll(cardDestinationPattern)].map(match => match[1]);

assert.equal(destinations.length, 22, 'The directory must expose all 22 guide destinations.');
assert.equal(new Set(destinations).size, 22, 'Guide destinations must be unique.');

for (const destination of destinations) {
  const destinationPath = join(repositoryRoot, destination);
  assert.ok(existsSync(destinationPath), `Missing guide destination: ${destination}`);
  assert.match(
    readFileSync(destinationPath, 'utf8'),
    /href="\.\.\/index\.html"/,
    `Guide must include a directory return route: ${destination}`
  );
}

const dualViewDestinations = destinations.filter(destination =>
  readFileSync(join(repositoryRoot, destination), 'utf8').includes('assets/dual_view')
);
assert.equal(dualViewDestinations.length, 20, 'Expected 20 guides in the shared dual-view family.');
assert.ok(destinations.includes('pupillometry/index.html'));
assert.ok(destinations.includes('evd-icp/index.html'));

console.log('Clinical post-launch design checks passed: 22 guides, 22 return routes, 3 template families.');
