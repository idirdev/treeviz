import * as fs from "fs";

export interface FileStats {
  exists: boolean;
  isDirectory: boolean;
  isFile: boolean;
  isSymlink: boolean;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  accessedAt: Date;
  permissions: string;
  mode: number;
}

/**
 * Get detailed stats for a file or directory.
 * Returns a normalized FileStats object. If the path does not exist
 * or cannot be accessed, returns a default object with exists=false.
 */
export function getFileStats(filePath: string): FileStats {
  try {
    const lstat = fs.lstatSync(filePath);
    const isSymlink = lstat.isSymbolicLink();

    // If it's a symlink, also stat the target
    let stat: fs.Stats;
    try {
      stat = fs.statSync(filePath);
    } catch {
      stat = lstat; // Broken symlink - use lstat
    }

    return {
      exists: true,
      isDirectory: stat.isDirectory(),
      isFile: stat.isFile(),
      isSymlink,
      size: stat.size,
      createdAt: stat.birthtime,
      modifiedAt: stat.mtime,
      accessedAt: stat.atime,
      permissions: formatPermissions(stat.mode),
      mode: stat.mode,
    };
  } catch {
    return {
      exists: false,
      isDirectory: false,
      isFile: false,
      isSymlink: false,
      size: 0,
      createdAt: new Date(0),
      modifiedAt: new Date(0),
      accessedAt: new Date(0),
      permissions: "---------",
      mode: 0,
    };
  }
}

/**
 * Format a Unix file mode into a rwx permission string.
 */
export function formatPermissions(mode: number): string {
  const perms = [
    mode & 0o400 ? "r" : "-",
    mode & 0o200 ? "w" : "-",
    mode & 0o100 ? "x" : "-",
    mode & 0o040 ? "r" : "-",
    mode & 0o020 ? "w" : "-",
    mode & 0o010 ? "x" : "-",
    mode & 0o004 ? "r" : "-",
    mode & 0o002 ? "w" : "-",
    mode & 0o001 ? "x" : "-",
  ];
  return perms.join("");
}

/**
 * Format file size in human-readable form.
 * Uses binary units (KiB, MiB, GiB) for precision.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  if (i === 0) return `${bytes} B`;

  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(1)} ${units[i]}`;
}

/**
 * Format a date for display in the tree.
 * Shows relative time for recent dates, absolute for older ones.
 */
export function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 365) {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
