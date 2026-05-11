import { existsSync } from "node:fs";
import { resolve as resolvePath } from "node:path";
import { pathToFileURL } from "node:url";

const extensionCandidates = ["", ".ts", ".tsx", ".js", ".mjs", ".cjs"];

export async function resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith("@/")) {
    return nextResolve(specifier, context);
  }

  const absolutePath = resolvePath(process.cwd(), specifier.slice(2));
  const matchedPath = extensionCandidates
    .map((extension) => `${absolutePath}${extension}`)
    .find((candidate) => existsSync(candidate));

  if (!matchedPath) {
    return nextResolve(specifier, context);
  }

  return {
    shortCircuit: true,
    url: pathToFileURL(matchedPath).href,
  };
}
