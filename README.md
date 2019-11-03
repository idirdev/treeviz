# 🌳 TreeViz

A beautiful directory tree visualizer with multiple output formats, smart filtering, and gitignore support.

## Installation

```bash
npm install -g @idirdev/treeviz
```

## Usage

```bash
# Basic tree of current directory
treeviz

# Specific directory with max depth
treeviz ./src --depth 3

# Show file sizes and dates
treeviz --size --date

# Directories only
treeviz --dirs-only

# Show hidden files
treeviz --all

# Filter by file pattern
treeviz --pattern "*.ts"

# Ignore specific patterns
treeviz --ignore "*.test.ts" "dist"

# JSON output
treeviz --format json

# Markdown output
treeviz --format markdown

# Sort by size (largest first)
treeviz --sort size
```

## Output Formats

### ASCII (default)
```
my-project
├── src/
│   ├── index.ts (2.1 KiB)
│   └── utils/
│       └── format.ts (1.5 KiB)
├── package.json (512 B)
└── tsconfig.json (256 B)
```

### JSON
```json
{
  "name": "my-project",
  "type": "directory",
  "children": [...]
}
```

### Markdown
```markdown
# Directory: my-project
- **src/**
  - `index.ts` _(2.1 KiB)_
  - **utils/**
    - `format.ts` _(1.5 KiB)_
```

## Options

| Flag | Description |
|------|-------------|
| `-d, --depth <n>` | Maximum depth |
| `-D, --dirs-only` | Show only directories |
| `-s, --size` | Show file sizes |
| `-t, --date` | Show modification dates |
| `-a, --all` | Show hidden files |
| `-I, --ignore <patterns...>` | Patterns to ignore |
| `--no-gitignore` | Disable .gitignore |
| `-f, --format <type>` | ascii, json, markdown |
| `--sort <by>` | name, size, date |
| `-p, --pattern <glob>` | Filter files by pattern |

## License

MIT
