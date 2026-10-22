// Fails if any file in src/ contains an em dash (U+2014) or en dash (U+2013).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const banned = /[—–]/;
const hits = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else
      readFileSync(path, 'utf8')
        .split('\n')
        .forEach((line, i) => banned.test(line) && hits.push(`${path}:${i + 1}: ${line.trim()}`));
  }
}

walk('src');
if (hits.length) {
  console.error(`Found ${hits.length} dash character(s) that the copy rules ban:\n${hits.join('\n')}`);
  process.exit(1);
}
console.log('No em or en dashes in src/.');
