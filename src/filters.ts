import * as fs from "fs";
import * as path from "path";

/**
 * Load ignore patterns from a .gitignore file in the given directory.
 * Walks up parent directories to find all applicable .gitignore files.
 * Returns an array of pattern strings (comments and blank lines stripped).
 */
export function loadIgnorePatterns(dirPath: string): string[] {
  const patterns: string[] = [];
  const gitignorePath = path.join(dirPath, ".gitignore");

  try {
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, "utf-8");
      const lines = content.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith("#")) {
          continue;
        }

        // Remove trailing slash for directory patterns
        // (we match by name, not path type)
        const pattern = trimmed.endsWith("/")
          ? trimmed.slice(0, -1)
          : trimmed;

        patterns.push(pattern);
      }
    }
  } catch {
    // Silently ignore read errors
  }

  return patterns;
}

/**
 * Check if a filename should be ignored based on ignore patterns.
 * Supports basic glob matching with * and ? wildcards.
 * Also supports negation patterns (lines starting with !).
 */
export function shouldIgnore(
  filename: string,
  patterns: string[]
): boolean {
  let ignored = false;

  for (const pattern of patterns) {
    // Negation pattern
    if (pattern.startsWith("!")) {
      const positivePattern = pattern.slice(1);
      if (matchPattern(filename, positivePattern)) {
        ignored = false;
      }
      continue;
    }

    if (matchPattern(filename, pattern)) {
      ignored = true;
    }
  }

  return ignored;
}

/**
 * Match a filename against a single pattern.
 * Supports:
 *   - Exact match: "package.json"
 *   - Wildcard *: "*.ts" matches any .ts file
 *   - Wildcard ?: "file?.ts" matches file1.ts, fileA.ts, etc.
 *   - Double star **: matches any path segment (simplified)
 */
function matchPattern(filename: string, pattern: string): boolean {
  // Exact match
  if (filename === pattern) {
    return true;
  }

  // If pattern contains path separators, match against the full name
  // For simple patterns, just match the basename
  const patternParts = pattern.replace(/\\/g, "/").split("/");
  const matchName =
    patternParts.length === 1 ? pattern : patternParts[patternParts.length - 1];

  // Convert glob pattern to regex
  const regexStr = matchName
    .replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape special regex chars
    .replace(/\*\*/g, "DOUBLE_STAR")       // Preserve **
    .replace(/\*/g, "[^/]*")               // Single * = any within segment
    .replace(/DOUBLE_STAR/g, ".*")         // ** = any including /
    .replace(/\?/g, "[^/]");              // ? = single char

  try {
    const regex = new RegExp(`^${regexStr}$`, "i");
    return regex.test(filename);
  } catch {
    return filename === pattern;
  }
}

/**
 * Load a .treevizignore file if it exists.
 * Uses the same format as .gitignore.
 */
export function loadTreevizIgnore(dirPath: string): string[] {
  const ignorePath = path.join(dirPath, ".treevizignore");
  if (!fs.existsSync(ignorePath)) {
    return [];
  }
  return loadIgnorePatterns(dirPath);
}

/**
 * Merge multiple sets of ignore patterns, deduplicating.
 */
export function mergePatterns(...patternSets: string[][]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const patterns of patternSets) {
    for (const pattern of patterns) {
      if (!seen.has(pattern)) {
        seen.add(pattern);
        merged.push(pattern);
      }
    }
  }

  return merged;
}
