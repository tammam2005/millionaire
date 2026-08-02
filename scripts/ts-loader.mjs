/**
 * Minimal module resolver so Node can run the app's TypeScript directly.
 *
 * Node 24 strips types from .ts files natively, but it does not know about
 * three things this codebase relies on:
 *
 *   1. the `@/*` path alias from tsconfig,
 *   2. extensionless relative imports (`./types`, `../provider`),
 *   3. static image imports, which only exist because a bundler invents them.
 *
 * Images resolve to a stub with the same shape `next/image` produces, so
 * catalogue code that reads `.width` or passes the object around behaves
 * identically without needing a bundler.
 *
 * Test-only. Never imported by the app.
 */
import { statSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".avif", ".webp", ".svg"];

/**
 * Try the candidate file forms a bundler would try.
 *
 * The check is `isFile`, not "exists" — `@/lib/commerce` names a directory as
 * well as a module, and matching the directory hands Node something it cannot
 * read.
 */
function firstExisting(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}/index.ts`,
    `${basePath}/index.tsx`,
  ];
  return candidates.find((candidate) => {
    try {
      return statSync(candidate).isFile();
    } catch {
      return false;
    }
  });
}

/**
 * Node strips types only when it is told the module is TypeScript. Reporting
 * a resolved .ts file as plain "module" skips the stripper entirely and the
 * first `import type` is a syntax error.
 */
function formatFor(filePath) {
  return /\.tsx?$/.test(filePath) ? "module-typescript" : "module";
}

function resolved(filePath) {
  return {
    url: pathToFileURL(filePath).href,
    format: formatFor(filePath),
    shortCircuit: true,
  };
}

export async function resolve(specifier, context, nextResolve) {
  if (IMAGE_EXTENSIONS.some((ext) => specifier.endsWith(ext))) {
    return { url: `stub-image:${specifier}`, format: "module", shortCircuit: true };
  }

  if (specifier.startsWith("@/")) {
    const found = firstExisting(resolvePath(ROOT, "src", specifier.slice(2)));
    if (found) return resolved(found);
  }

  if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    const parentDir = dirname(fileURLToPath(context.parentURL));
    const found = firstExisting(resolvePath(parentDir, specifier));
    if (found) return resolved(found);
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith("stub-image:")) {
    return {
      format: "module",
      shortCircuit: true,
      source: `export default { src: "/stub.jpg", width: 1024, height: 1024, blurDataURL: "data:," };`,
    };
  }
  return nextLoad(url, context);
}
