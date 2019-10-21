import { TreeNode } from "../tree";
import { TreeOptions } from "../index";
import { renderAsciiTree } from "../renderer";

/**
 * Format a tree as a colored ASCII tree using Unicode box-drawing characters.
 *
 * Example output:
 *   my-project
 *   ├── src/
 *   │   ├── index.ts
 *   │   ├── utils/
 *   │   │   ├── format.ts
 *   │   │   └── net.ts
 *   │   └── commands/
 *   │       ├── check.ts
 *   │       └── scan.ts
 *   ├── package.json
 *   └── tsconfig.json
 */
export function formatAsAscii(tree: TreeNode, options: TreeOptions): string {
  return renderAsciiTree(tree, options);
}

/**
 * Format a flat list of all files in the tree.
 * Useful for piping to other commands.
 */
export function formatAsFlat(tree: TreeNode, options: TreeOptions): string {
  const lines: string[] = [];
  collectPaths(tree, lines, options.dirsOnly);
  return lines.join("\n");
}

/**
 * Recursively collect all paths from the tree.
 */
function collectPaths(
  node: TreeNode,
  lines: string[],
  dirsOnly: boolean
): void {
  if (dirsOnly && !node.isDirectory) {
    return;
  }

  lines.push(node.relativePath);

  for (const child of node.children) {
    collectPaths(child, lines, dirsOnly);
  }
}
