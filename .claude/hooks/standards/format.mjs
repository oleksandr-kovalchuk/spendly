import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, join, relative, sep } from "node:path";

// The stack's formatter: Oxfmt, or Prettier in React Native (bare)
const FORMATTERS = [
  { bin: "node_modules/oxfmt/bin/oxfmt", args: ["--no-error-on-unmatched-pattern"] },
  { bin: "node_modules/prettier/bin/prettier.cjs", args: ["--write", "--ignore-unknown", "--log-level=warn"] },
];
const EXIT_FAILURE = 1;

function gitRoot(cwd) {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8", stdio: "pipe" }).trim();
  } catch {
    return cwd;
  }
}

function isInside(root, file) {
  try {
    const path = relative(realpathSync(root), realpathSync(file));
    return path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path);
  } catch {
    return false;
  }
}

const { cwd, tool_input: input } = JSON.parse(readFileSync(0, "utf8"));
const file = input?.file_path;
const root = file && gitRoot(cwd);
// None is installed in a fresh worktree until the Stop hook's pnpm scripts install the dependencies
const formatter = root && isInside(root, file) && FORMATTERS.find(({ bin }) => existsSync(join(root, bin)));
if (formatter) {
  // No shell: it would run a $(...) in the agent's path
  const result = spawnSync(process.execPath, [join(root, formatter.bin), ...formatter.args, file], {
    cwd: root,
    stdio: "inherit",
  });
  process.exitCode = result.status ?? EXIT_FAILURE;
}
