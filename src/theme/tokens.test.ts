import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const TOKEN_CSS_PATH = path.join(ROOT, 'src/styles/tokens.css');
const SOURCE_PATHS = [
  path.join(ROOT, 'src'),
  path.join(ROOT, 'tailwind.config.js'),
  path.join(ROOT, 'vite.config.ts'),
];

const LOCAL_CUSTOM_PROPERTY_PREFIXES = [
  '--stq-author-',
  '--stq-desktop-panel-',
  '--stq-rrr-',
];

describe('design tokens', () => {
  it('keeps shared stq custom properties defined in tokens.css', () => {
    const definedTokens = readDefinedTokens();
    const unknownReferences = readSourceFiles()
      .flatMap((filePath) =>
        readTokenReferences(filePath).filter(
          (tokenName) =>
            !definedTokens.has(tokenName) && !isLocalCustomProperty(tokenName),
        ).map((tokenName) => formatRelativeToken(filePath, tokenName)),
      )
      .sort();

    expect(unknownReferences).toEqual([]);
  });

  it('does not hide shared token drift behind hardcoded hex fallbacks', () => {
    const hardcodedFallbacks = readSourceFiles()
      .flatMap((filePath) =>
        readHardcodedTokenFallbacks(filePath).map((fallback) =>
          formatRelativeToken(filePath, fallback),
        ),
      )
      .sort();

    expect(hardcodedFallbacks).toEqual([]);
  });
});

function readDefinedTokens(): Set<string> {
  const tokenCss = fs.readFileSync(TOKEN_CSS_PATH, 'utf8');
  return new Set(
    Array.from(tokenCss.matchAll(/(--stq-[a-zA-Z0-9-]+)\s*:/g), (match) => match[1]),
  );
}

function readSourceFiles(): string[] {
  return SOURCE_PATHS.flatMap((sourcePath) => {
    const stat = fs.statSync(sourcePath);
    if (stat.isFile()) {
      return shouldScanFile(sourcePath) ? [sourcePath] : [];
    }
    return walkSourceFiles(sourcePath);
  });
}

function walkSourceFiles(directoryPath: string): string[] {
  return fs.readdirSync(directoryPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      return walkSourceFiles(entryPath);
    }
    return shouldScanFile(entryPath) ? [entryPath] : [];
  });
}

function shouldScanFile(filePath: string): boolean {
  return (
    /\.(css|ts|tsx|js)$/.test(filePath) &&
    filePath !== TOKEN_CSS_PATH &&
    !filePath.endsWith('.test.ts') &&
    !filePath.endsWith('.test.tsx')
  );
}

function readTokenReferences(filePath: string): string[] {
  const source = fs.readFileSync(filePath, 'utf8');
  return Array.from(
    source.matchAll(/var\(\s*(--stq-[a-zA-Z0-9-]+)/g),
    (match) => match[1],
  );
}

function readHardcodedTokenFallbacks(filePath: string): string[] {
  const source = fs.readFileSync(filePath, 'utf8');
  return Array.from(
    source.matchAll(/var\(\s*--stq-[^,)]+,\s*#[^)]+\)/g),
    (match) => match[0],
  );
}

function isLocalCustomProperty(tokenName: string): boolean {
  return LOCAL_CUSTOM_PROPERTY_PREFIXES.some((prefix) =>
    tokenName.startsWith(prefix),
  );
}

function formatRelativeToken(filePath: string, tokenName: string): string {
  return `${path.relative(ROOT, filePath)}: ${tokenName}`;
}
