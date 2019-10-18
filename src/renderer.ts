import chalk from "chalk";
import { TreeNode } from "./tree";
import { TreeOptions } from "./index";
import { formatFileSize, formatDate } from "./stats";

// Tree connector characters (Unicode box-drawing)
const CONNECTOR = {
  PIPE: "\u2502   ",    // |
  TEE: "\u251C\u2500\u2500 ",     // |-
  ELBOW: "\u2514\u2500\u2500 ",   // L-
  SPACE: "    ",         // (blank indent)
};

/**
 * Render a tree node and its children as a colored ASCII tree string.
 * Uses Unicode box-drawing characters for connectors.
 */
export function renderAsciiTree(
  node: TreeNode,
  options: TreeOptions,
  prefix: string = "",
  isLast: boolean = true,
  isRoot: boolean = true
): string {
  const lines: string[] = [];

  // Root node
  if (isRoot) {
    const rootLabel = colorize(node.name, node, true);
    const meta = buildMetaString(node, options);
    lines.push(rootLabel + meta);
  } else {
    const connector = isLast ? CONNECTOR.ELBOW : CONNECTOR.TEE;
    const label = colorize(node.name, node, false);
    const meta = buildMetaString(node, options);
    lines.push(prefix + connector + label + meta);
  }

  // Recurse into children
  const children = node.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const childIsLast = i === children.length - 1;
    const childPrefix = isRoot
      ? ""
      : prefix + (isLast ? CONNECTOR.SPACE : CONNECTOR.PIPE);

    const childOutput = renderAsciiTree(
      child,
      options,
      childPrefix,
      childIsLast,
      false
    );
    lines.push(childOutput);
  }

  return lines.join("\n");
}

/**
 * Apply color to a node name based on its type.
 */
function colorize(name: string, node: TreeNode, isRoot: boolean): string {
  if (isRoot) {
    return chalk.bold.cyan(name);
  }

  if (node.isDirectory) {
    return chalk.bold.blue(name + "/");
  }

  // Color by extension
  const ext = getExtension(name);
  switch (ext) {
    case ".ts":
    case ".tsx":
      return chalk.blue(name);
    case ".js":
    case ".jsx":
      return chalk.yellow(name);
    case ".json":
      return chalk.green(name);
    case ".md":
    case ".txt":
      return chalk.white(name);
    case ".css":
    case ".scss":
    case ".less":
      return chalk.magenta(name);
    case ".html":
    case ".htm":
      return chalk.red(name);
    case ".png":
    case ".jpg":
    case ".gif":
    case ".svg":
    case ".ico":
      return chalk.cyan(name);
    case ".sh":
    case ".bash":
    case ".zsh":
      return chalk.green(name);
    case ".yml":
    case ".yaml":
    case ".toml":
      return chalk.gray(name);
    case ".lock":
      return chalk.gray(name);
    default:
      return chalk.white(name);
  }
}

/**
 * Build the metadata string (size, date) appended after the node name.
 */
function buildMetaString(node: TreeNode, options: TreeOptions): string {
  const parts: string[] = [];

  if (options.showSize && !node.isDirectory) {
    parts.push(chalk.gray(` (${formatFileSize(node.stats.size)})`));
  }

  if (options.showDate) {
    parts.push(chalk.gray(` [${formatDate(node.stats.modifiedAt)}]`));
  }

  return parts.join("");
}

/**
 * Extract file extension from a filename.
 */
function getExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  if (idx <= 0) return "";
  return filename.slice(idx).toLowerCase();
}
