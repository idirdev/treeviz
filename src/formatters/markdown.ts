import { TreeNode } from "../tree";
import { TreeOptions } from "../index";
import { formatFileSize, formatDate } from "../stats";

/**
 * Format the tree as a Markdown document.
 * Uses nested bullet lists with proper indentation.
 * Directories are bolded, files are plain text.
 *
 * Example output:
 * # Directory: my-project
 *
 * - **src/**
 *   - index.ts (2.1 KiB)
 *   - **utils/**
 *     - format.ts (1.5 KiB)
 *     - net.ts (3.2 KiB)
 * - package.json (512 B)
 * - tsconfig.json (256 B)
 */
export function formatAsMarkdown(
  tree: TreeNode,
  options: TreeOptions
): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Directory: ${tree.name}`);
  lines.push("");

  // Statistics
  const stats = countStats(tree);
  lines.push(
    `> ${stats.dirs} directories, ${stats.files} files` +
      (options.showSize ? `, ${formatFileSize(stats.totalSize)} total` : "")
  );
  lines.push("");

  // Tree content
  for (const child of tree.children) {
    renderMarkdownNode(child, lines, 0, options);
  }

  return lines.join("\n");
}

/**
 * Recursively render a tree node as a Markdown list item.
 */
function renderMarkdownNode(
  node: TreeNode,
  lines: string[],
  indent: number,
  options: TreeOptions
): void {
  const prefix = "  ".repeat(indent) + "- ";

  let label: string;
  if (node.isDirectory) {
    label = `**${node.name}/**`;
  } else {
    label = `\`${node.name}\``;
  }

  // Append metadata
  const meta: string[] = [];
  if (options.showSize && !node.isDirectory) {
    meta.push(formatFileSize(node.stats.size));
  }
  if (options.showDate) {
    meta.push(formatDate(node.stats.modifiedAt));
  }

  if (meta.length > 0) {
    label += ` _(${meta.join(", ")})_`;
  }

  lines.push(prefix + label);

  // Recurse into children
  for (const child of node.children) {
    renderMarkdownNode(child, lines, indent + 1, options);
  }
}

/**
 * Count files, directories, and total size in the tree.
 */
function countStats(node: TreeNode): {
  dirs: number;
  files: number;
  totalSize: number;
} {
  let dirs = 0;
  let files = 0;
  let totalSize = 0;

  if (node.isDirectory) {
    dirs++;
    for (const child of node.children) {
      const childStats = countStats(child);
      dirs += childStats.dirs;
      files += childStats.files;
      totalSize += childStats.totalSize;
    }
  } else {
    files++;
    totalSize += node.stats.size;
  }

  return { dirs, files, totalSize };
}

/**
 * Format the tree as a Markdown code block containing ASCII art.
 * Useful for embedding in documentation where the raw ASCII tree
 * should be preserved exactly.
 */
export function formatAsMarkdownCodeBlock(
  asciiTree: string,
  rootName: string
): string {
  const lines: string[] = [];
  lines.push(`# Directory: ${rootName}`);
  lines.push("");
  lines.push("```");
  lines.push(asciiTree);
  lines.push("```");
  return lines.join("\n");
}
