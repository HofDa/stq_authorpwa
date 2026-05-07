import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const CORE_ROOT = path.resolve(process.cwd(), 'src/rrr-core');
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);

const FORBIDDEN_IMPORT_PATTERNS = [
  /^react$/,
  /^react-dom$/,
  /^react-dom\//,
  /^@\/components(?:\/|$)/,
  /^@\/pages(?:\/|$)/,
  /^@\/app(?:\/|$)/,
  /^@\/routes(?:\/|$)/,
  /(?:^|\/)src\/components(?:\/|$)/,
  /(?:^|\/)src\/pages(?:\/|$)/,
  /(?:^|\/)src\/app(?:\/|$)/,
  /(?:^|\/)src\/routes(?:\/|$)/,
];

const BROWSER_GLOBAL_PATTERN = /\b(window|document|navigator)\b/;
const IMPORT_SOURCE_PATTERN =
  /\bimport(?:\s+type)?(?:[\s\S]*?\sfrom\s*)?['"]([^'"]+)['"]|export\s+[\s\S]*?\sfrom\s*['"]([^'"]+)['"]/g;

describe('rrr-core boundary', () => {
  it('does not depend on React, UI, routes, pages, or browser globals', async () => {
    const violations: string[] = [];
    const files = await listSourceFiles(CORE_ROOT);

    for (const file of files) {
      const source = await readFile(file, 'utf8');
      const relativeFile = path.relative(process.cwd(), file);

      for (const importSource of readImportSources(source)) {
        if (FORBIDDEN_IMPORT_PATTERNS.some((pattern) => pattern.test(importSource))) {
          violations.push(`${relativeFile}: forbidden import "${importSource}"`);
        }
      }

      if (BROWSER_GLOBAL_PATTERN.test(source)) {
        violations.push(`${relativeFile}: forbidden browser global usage`);
      }
    }

    expect(violations).toEqual([]);
  });
});

async function listSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return listSourceFiles(entryPath);
      }
      if (SOURCE_EXTENSIONS.has(path.extname(entry.name)) && !entry.name.endsWith('.test.ts')) {
        return [entryPath];
      }
      return [];
    }),
  );

  return nested.flat();
}

function readImportSources(source: string): string[] {
  const imports: string[] = [];
  for (const match of source.matchAll(IMPORT_SOURCE_PATTERN)) {
    const importSource = match[1] ?? match[2];
    if (importSource) {
      imports.push(importSource);
    }
  }
  return imports;
}
