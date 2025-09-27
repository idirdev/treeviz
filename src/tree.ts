import * as fs from "fs";
import * as path from "path";
import { TreeOptions } from "./index";
import { shouldIgnore } from "./filters";
import { getFileStats, FileStats } from "./stats";

export interface TreeNode {
  name: string;
  absolutePath: string;
  relativePath: string;
  isDirectory: boolean;
  stats: FileStats;
  children: TreeNode[];
  depth: number;
}

/**
 * Recursively walk a directory and build a tree structure.
 * Respects depth limits, ignore patterns, and filtering options.
 */
export function walkDirectory(
  dirPath: string,
  options: TreeOptions,
  ignorePatterns: string[],
  currentDepth: number,
  rootPath?: string
): TreeNode | null {
  const root = rootPath || dirPath;
  const stats = getFileStats(dirPath);

  if (!stats.exists) {
    return null;
  }

  const name = path.basename(dirPath);
  const relativePath = path.relative(root, dirPath) || ".";

  const node: TreeNode = {
    name,
    absolutePath: dirPath,
    relativePath,
    isDirectory: stats.isDirectory,
    stats,
    children: [],
    depth: currentDepth,
  };

  if (!stats.isDirectory) {
    return node;
  }

  // Stop recursion at max depth
  if (currentDepth >= options.depth) {
    return node;
  }

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err: any) {
    // Permission denied or other read error - return node with no children
    return node;
  }

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    // Hidden files
    if (!options.showHidden && entry.name.startsWith(".")) {
      return false;
    }

    // Ignore patterns
    if (shouldIgnore(entry.name, ignorePatterns)) {
      return false;
    }

    // Dirs only mode
    if (options.dirsOnly && !entry.isDirectory()) {
      return false;
    }

    // Pattern matching (only for files)
    if (options.pattern && !entry.isDirectory()) {
      if (!matchGlob(entry.name, options.pattern)) {
        return false;
      }
    }

    return true;
  });

  // Sort entries
  const sorted = sortEntries(filteredEntries, dirPath, options.sortBy);

  // Recurse into children
  for (const entry of sorted) {
    const childPath = path.join(dirPath, entry.name);
    const childNode = walkDirectory(
      childPath,
      options,
      ignorePatterns,
      currentDepth + 1,
      root
    );

    if (childNode) {
      // In dirs-only mode with pattern filter, keep directories that have matching descendants
      node.children.push(childNode);
    }
  }

  return node;
}

/**
 * Sort directory entries according to the specified sort order.
 * Directories always come first regardless of sort mode.
 */
function sortEntries(
  entries: fs.Dirent[],
  parentPath: string,
  sortBy: string
): fs.Dirent[] {
  return [...entries].sort((a, b) => {
    // Directories first
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;

    switch (sortBy) {
      case "size": {
        const statsA = getFileStats(path.join(parentPath, a.name));
        const statsB = getFileStats(path.join(parentPath, b.name));
        return statsB.size - statsA.size; // Largest first
      }
      case "date": {
        const statsA = getFileStats(path.join(parentPath, a.name));
        const statsB = getFileStats(path.join(parentPath, b.name));
        return statsB.modifiedAt.getTime() - statsA.modifiedAt.getTime(); // Newest first
      }
      case "name":
      default:
        return a.name.localeCompare(b.name, undefined, {
          numeric: true,
          sensitivity: "base",
        });
    }
  });
}

/**
 * Simple glob matching for file patterns.
 * Supports * (any characters) and ? (single character).
 */
function matchGlob(filename: string, pattern: string): boolean {
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");

  const regex = new RegExp(`^${regexStr}$`, "i");
  return regex.test(filename);
}
