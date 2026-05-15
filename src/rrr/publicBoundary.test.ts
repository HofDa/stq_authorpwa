import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC_ROOT = path.resolve(process.cwd(), 'src');
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);
const INTERNAL_RRR_IMPORT_PATTERN =
  /^@\/rrr-(?:core|runtime|preview|sensors)(?:\/|$)/;
const INTERNAL_RRR_ROOTS = [
  'src/rrr',
  'src/rrr-core',
  'src/rrr-runtime',
  'src/rrr-preview',
  'src/rrr-sensors',
];
const IMPORT_SOURCE_PATTERN =
  /\bimport(?:\s+type)?(?:[\s\S]*?\sfrom\s*)?['"]([^'"]+)['"]|export\s+[\s\S]*?\sfrom\s*['"]([^'"]+)['"]/g;

describe('rrr public API boundary', () => {
  it('keeps app and UI imports behind src/rrr facades', async () => {
    const violations: string[] = [];
    const files = await listSourceFiles(SRC_ROOT);

    for (const file of files) {
      const relativeFile = normalizePath(path.relative(process.cwd(), file));
      if (isInternalRrrFile(relativeFile)) {
        continue;
      }

      const source = await readFile(file, 'utf8');
      for (const importSource of readImportSources(source)) {
        if (INTERNAL_RRR_IMPORT_PATTERN.test(importSource)) {
          violations.push(`${relativeFile}: forbidden import "${importSource}"`);
        }
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
      if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
        return [entryPath];
      }
      return [];
    }),
  );

  return nested.flat();
}

function isInternalRrrFile(relativeFile: string): boolean {
  return INTERNAL_RRR_ROOTS.some(
    (root) => relativeFile === root || relativeFile.startsWith(`${root}/`),
  );
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

function normalizePath(value: string): string {
  return value.split(path.sep).join('/');
}
