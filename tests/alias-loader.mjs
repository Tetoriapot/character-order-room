import { existsSync } from 'node:fs';
import { dirname, extname, resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');

export async function resolve(specifier, context, nextResolve) {
  let candidate = null;
  if (specifier.startsWith('@/')) {
    candidate = resolvePath(projectRoot, specifier.slice(2));
  } else if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
    candidate = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier);
  }
  if (candidate && !extname(candidate)) {
    for (const extension of ['.ts', '.tsx', '.mjs', '.js']) {
      if (existsSync(candidate + extension)) {
        return { url: pathToFileURL(candidate + extension).href, shortCircuit: true };
      }
    }
  }
  if (candidate && existsSync(candidate)) {
    return { url: pathToFileURL(candidate).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
