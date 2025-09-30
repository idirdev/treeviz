#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import * as path from "path";
import { walkDirectory, TreeNode } from "./tree";
import { renderAsciiTree } from "./renderer";
import { loadIgnorePatterns, shouldIgnore } from "./filters";
import { formatAsAscii } from "./formatters/ascii";
import { formatAsJson } from "./formatters/json";
import { formatAsMarkdown } from "./formatters/markdown";

export interface TreeOptions {
  depth: number;
  dirsOnly: boolean;
  showSize: boolean;
  showDate: boolean;
  showHidden: boolean;
  ignore: string[];
  useGitignore: boolean;
  format: "ascii" | "json" | "markdown";
  sortBy: "name" | "size" | "date";
  pattern: string | null;
}

const program = new Command();

program
  .name("treeviz")
  .description(
    chalk.bold("A beautiful directory tree visualizer with multiple output formats")
  )
  .version("1.0.0", "-v, --version")
  .argument("[directory]", "Directory to visualize", ".")
  .option("-d, --depth <n>", "Maximum depth to traverse", "Infinity")
  .option("-D, --dirs-only", "Show only directories", false)
  .option("-s, --size", "Show file sizes", false)
  .option("-t, --date", "Show modification dates", false)
  .option("-a, --all", "Show hidden files and directories", false)
  .option(
    "-I, --ignore <patterns...>",
    "Patterns to ignore (glob-style)",
    []
  )
  .option("--no-gitignore", "Do not use .gitignore patterns")
  .option(
    "-f, --format <type>",
    "Output format: ascii, json, markdown",
    "ascii"
  )
  .option(
    "--sort <by>",
    "Sort entries by: name, size, date",
    "name"
  )
  .option(
    "-p, --pattern <glob>",
    "Only show files matching this pattern"
  )
  .action(async (directory: string, opts) => {
    const targetDir = path.resolve(directory);
    const maxDepth =
      opts.depth === "Infinity" ? Infinity : parseInt(opts.depth, 10);

    const options: TreeOptions = {
      depth: maxDepth,
      dirsOnly: opts.dirsOnly,
      showSize: opts.size,
      showDate: opts.date,
      showHidden: opts.all,
      ignore: opts.ignore,
      useGitignore: opts.gitignore !== false,
      format: opts.format as TreeOptions["format"],
      sortBy: opts.sort as TreeOptions["sortBy"],
      pattern: opts.pattern ?? null,
    };

    // Validate format
    if (!["ascii", "json", "markdown"].includes(options.format)) {
      console.error(
        chalk.red(`Error: Unknown format "${options.format}". Use ascii, json, or markdown.`)
      );
      process.exit(1);
    }

    // Load gitignore patterns if applicable
    let ignorePatterns = [...options.ignore];
    if (options.useGitignore) {
      const gitPatterns = loadIgnorePatterns(targetDir);
      ignorePatterns = [...ignorePatterns, ...gitPatterns];
    }

    // Always ignore node_modules and .git by default
    const defaultIgnore = ["node_modules", ".git", ".DS_Store"];
    ignorePatterns = [...new Set([...ignorePatterns, ...defaultIgnore])];

    try {
      const tree = walkDirectory(targetDir, options, ignorePatterns, 0);

      if (!tree) {
        console.error(chalk.red(`Error: "${targetDir}" is not a valid directory.`));
        process.exit(1);
      }

      let output: string;

      switch (options.format) {
        case "json":
          output = formatAsJson(tree, options);
          break;
        case "markdown":
          output = formatAsMarkdown(tree, options);
          break;
        case "ascii":
        default:
          output = formatAsAscii(tree, options);
          break;
      }

      console.log(output);

      // Print summary for ASCII format
      if (options.format === "ascii") {
        const stats = countNodes(tree);
        console.log(
          chalk.gray(
            `\n${stats.dirs} directories, ${stats.files} files`
          )
        );
      }
    } catch (err: any) {
      if (err.code === "ENOENT") {
        console.error(chalk.red(`Error: Directory "${targetDir}" does not exist.`));
      } else if (err.code === "EACCES") {
        console.error(chalk.red(`Error: Permission denied for "${targetDir}".`));
      } else {
        console.error(chalk.red(`Error: ${err.message}`));
      }
      process.exit(1);
    }
  });

function countNodes(node: TreeNode): { dirs: number; files: number } {
  let dirs = 0;
  let files = 0;

  if (node.isDirectory) {
    dirs++;
    for (const child of node.children) {
      const childStats = countNodes(child);
      dirs += childStats.dirs;
      files += childStats.files;
    }
  } else {
    files++;
  }

  return { dirs, files };
}

program.parse(process.argv);
