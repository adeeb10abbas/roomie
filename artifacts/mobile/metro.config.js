const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root so Metro can resolve shared packages
config.watchFolders = [workspaceRoot];

// Resolve modules from the workspace root first, then the project root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Exclude native build temp dirs that can appear and disappear during installs,
// and Replit's .local state dirs (workflow logs, skills) whose files are rotated
// and deleted at runtime — watching them crashes Metro's file crawler with ENOENT.
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : []),
  /sharp_tmp/,
  /node_modules\/.pnpm\/.*_tmp_/,
  /[/\\]\.local[/\\]/,
];

module.exports = config;
