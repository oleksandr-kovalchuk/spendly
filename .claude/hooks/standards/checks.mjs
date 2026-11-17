import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SCRIPTS = ["typecheck", "lint", "test"];
const OUTSIDE_DOCS = ":!docs";
const TURN_START = "start";
const TURN_START_FILE = "claude-turn-start";
// A file per turn, not stop_hook_active: that is also true when another Stop hook, /goal included, made Claude continue
const FAILURES_FILE = "claude-stop-failures";
// More than one, since an unattended cloud session has no one to fix a failure; a limit, so a red or flaky test doesn't loop forever
const FIX_ATTEMPTS = 3;
const PASSED_FILE = "claude-checks-passed";
// The rules are already in Claude's context, so it reviews itself instead of a separate reviewer
const RULES_REVIEW =
  "Checks pass. Review each file changed in this turn, committed or not, as a whole, older code included, against the rules in .claude/rules/ and fix any violation; don't review other files.";
// Above 10,000 characters, Claude Code gives Claude only a file path and the first 2,000
const OUTPUT_CHARS = 9_000;

function git(cwd, args, input) {
  try {
    return execFileSync("git", args, { cwd, input, encoding: "utf8", maxBuffer: Infinity, stdio: "pipe" });
  } catch {
    return undefined;
  }
}

function state(root) {
  const untracked = git(root, ["ls-files", "-z", "-o", "--exclude-standard", "--", OUTSIDE_DOCS]) ?? "";
  const paths = untracked.split("\0").filter(Boolean).join("\n");
  const head = git(root, ["rev-parse", "HEAD"]);
  // Before the first commit there is no HEAD, so staged files are compared with the empty tree
  const base = head?.trim() ?? git(root, ["hash-object", "-t", "tree", "--stdin"], "")?.trim() ?? "";
  return createHash("sha1")
    .update(head ?? "")
    .update(git(root, ["diff", base, "--", OUTSIDE_DOCS]) ?? "")
    .update(paths ? (git(root, ["hash-object", "--stdin-paths"], paths) ?? "") : "")
    .digest("hex");
}

// Not "decision": "block", which shows the developer a hook error for a hook working as designed, nor exit code 2,
// which Claude Code ignores when the output says "No such file or directory"
function feedback(text) {
  const output = { hookSpecificOutput: { hookEventName: "Stop", additionalContext: text } };
  process.stdout.write(`${JSON.stringify(output)}\n`);
}

// Not stderr with a non-zero exit code, of which the developer sees only the first line
function notice(text) {
  process.stdout.write(`${JSON.stringify({ systemMessage: text })}\n`);
}

function runChecks(root, current, failuresFile, passedFile) {
  for (const script of SCRIPTS) {
    const result = spawnSync(`pnpm ${script}`, { cwd: root, shell: true, encoding: "utf8", maxBuffer: Infinity });
    if (result.status === 0) continue;
    const failures = Number(read(failuresFile) ?? 0) + 1;
    writeFileSync(failuresFile, String(failures));
    const output = `${result.stdout}${result.stderr}`.trimEnd().slice(-OUTPUT_CHARS);
    if (failures > FIX_ATTEMPTS) {
      notice(
        `Checks still fail after ${FIX_ATTEMPTS} attempts to fix them: run pnpm typecheck, pnpm lint and pnpm test\n${output}`,
      );
    } else {
      feedback(output);
    }
    return;
  }
  rmSync(failuresFile, { force: true });
  const hasPassedThisTurn = existsSync(passedFile);
  if (!hasPassedThisTurn) feedback(RULES_REVIEW);
  writeFileSync(passedFile, current);
}

function read(file) {
  return existsSync(file) ? readFileSync(file, "utf8") : undefined;
}

const { cwd } = JSON.parse(readFileSync(0, "utf8"));
const root = git(cwd, ["rev-parse", "--show-toplevel"])?.trim();
const gitDir = root && git(root, ["rev-parse", "--absolute-git-dir"])?.trim();
if (gitDir) {
  const failuresFile = join(gitDir, FAILURES_FILE);
  const turnStartFile = join(gitDir, TURN_START_FILE);
  const passedFile = join(gitDir, PASSED_FILE);
  if (process.argv[2] === TURN_START) {
    rmSync(failuresFile, { force: true });
    rmSync(passedFile, { force: true });
    writeFileSync(turnStartFile, state(root));
  } else {
    const current = state(root);
    const isTurnStartRecorded = existsSync(turnStartFile);
    const isChangedThisTurn = current !== read(turnStartFile);
    const isChangedSinceLastPass = current !== read(passedFile);
    if (isTurnStartRecorded && isChangedThisTurn && isChangedSinceLastPass) {
      runChecks(root, current, failuresFile, passedFile);
    }
  }
}
