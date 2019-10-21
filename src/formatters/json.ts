import { TreeNode } from "../tree";
import { TreeOptions } from "../index";
import { formatFileSize } from "../stats";

interface JsonTreeNode {
  name: string;
  path: string;
  type: "directory" | "file" | "symlink";
  size?: number;
  sizeHuman?: string;
  modified?: string;
  children?: JsonTreeNode[];
}

/**
 * Format the tree as a JSON string.
 * Produces a structured JSON object suitable for programmatic consumption.
 * Supports optional inclusion of size and date metadata.
 *
 * Example output:
 * {
 *   "name": "my-project",
 *   "path": ".",
 *   "type": "directory",
 *   "children": [
 *     { "name": "index.ts", "path": "src/index.ts", "type": "file", "size": 1024 }
 *   ]
 * }
 */
export function formatAsJson(tree: TreeNode, options: TreeOptions): string {
  const jsonTree = toJsonNode(tree, options);
  return JSON.stringify(jsonTree, null, 2);
}

/**
 * Convert a TreeNode to a plain JSON-serializable object.
 * Strips chalk colors and internal metadata, keeping only
 * the fields useful for external consumption.
 */
function toJsonNode(node: TreeNode, options: TreeOptions): JsonTreeNode {
  const type: JsonTreeNode["type"] = node.stats.isSymlink
    ? "symlink"
    : node.isDirectory
    ? "directory"
    : "file";

  const jsonNode: JsonTreeNode = {
    name: node.name,
    path: node.relativePath,
    type,
  };

  // Include size for files when requested or always in JSON mode
  if (!node.isDirectory) {
    jsonNode.size = node.stats.size;
    jsonNode.sizeHuman = formatFileSize(node.stats.size);
  }

  // Include modification date
  if (options.showDate || options.format === "json") {
    jsonNode.modified = node.stats.modifiedAt.toISOString();
  }

  // Include children for directories
  if (node.isDirectory && node.children.length > 0) {
    jsonNode.children = node.children.map((child) =>
      toJsonNode(child, options)
    );
  }

  return jsonNode;
}

/**
 * Format the tree as a flat JSON array of file paths.
 */
export function formatAsFlatJson(
  tree: TreeNode,
  options: TreeOptions
): string {
  const paths: string[] = [];
  collectPaths(tree, paths, options.dirsOnly);
  return JSON.stringify(paths, null, 2);
}

/**
 * Recursively collect all file/directory paths from the tree.
 */
function collectPaths(
  node: TreeNode,
  paths: string[],
  dirsOnly: boolean
): void {
  if (dirsOnly && !node.isDirectory) {
    return;
  }
  paths.push(node.relativePath);
  for (const child of node.children) {
    collectPaths(child, paths, dirsOnly);
  }
}
