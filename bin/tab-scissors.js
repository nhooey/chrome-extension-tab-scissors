#!/usr/bin/env node
// tab-scissors: the repository's commands (test, check, fmt, update) as one
// tool, on the dev shell's PATH. Run `tab-scissors --help` for the list.
//
// Exit statuses: 0 when the command succeeded, the command's own status when
// it failed, 2 for a usage error, and 127 when its program wasn't found.

"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const TEST_DIR = "test";
const TEST_SUFFIX = ".test.js";

const COMMANDS = {
  test: {
    summary: "Run the node:test suites in test/",
    usage: "tab-scissors test [<suite>...]",
    details: [
      "Runs every test/*.test.js, or only the named suites. A suite is",
      "named by its file's base name (`config`, `tabLogic`) or by a path.",
    ],
  },
  check: {
    summary: "Check the flake: tests and formatting (nix flake check)",
    usage: "tab-scissors check [-- <nix flake check args>...]",
    details: ["Arguments after `--` pass through to `nix flake check`."],
  },
  fmt: {
    summary: "Format the tree with treefmt: nixfmt and prettier (nix fmt)",
    usage: "tab-scissors fmt [-- <nix fmt args>...]",
    details: ["Arguments after `--` pass through to `nix fmt`."],
  },
  update: {
    summary: "Update the flake's inputs and rewrite flake.lock",
    usage: "tab-scissors update [-- <nix flake update args>...]",
    details: [
      "Arguments after `--` pass through to `nix flake update`, so",
      "`tab-scissors update -- nixpkgs` updates one input.",
    ],
  },
};

class UsageError extends Error {}

function isHelp(arg) {
  return arg === "-h" || arg === "--help";
}

// Parses the arguments after the program name into
// `{ command, help, operands, passthrough }`. `command` is null at the top
// level. Throws a UsageError on anything it doesn't know.
function parse(argv) {
  const [first, ...rest] = argv;
  if (first === undefined || isHelp(first)) {
    return { command: null, help: true, operands: [], passthrough: [] };
  }
  if (first.startsWith("-")) {
    throw new UsageError(`unknown option: ${first}`);
  }
  if (!Object.hasOwn(COMMANDS, first)) {
    throw new UsageError(`unknown command: ${first}`);
  }

  const parsed = { command: first, help: false, operands: [], passthrough: [] };
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--") {
      parsed.passthrough = rest.slice(i + 1);
      break;
    }
    if (isHelp(arg)) {
      parsed.help = true;
    } else if (arg.startsWith("-")) {
      throw new UsageError(`${first}: unknown option: ${arg}`);
    } else {
      parsed.operands.push(arg);
    }
  }

  if (first === "test" && parsed.passthrough.length > 0) {
    throw new UsageError("test: takes no `--` arguments");
  }
  if (first !== "test" && parsed.operands.length > 0) {
    throw new UsageError(
      `${first}: unexpected argument: ${parsed.operands[0]} (put pass-through arguments after --)`,
    );
  }
  return parsed;
}

// Maps a suite name to its test file, relative to the repository root.
function suiteFile(suite) {
  if (suite.includes("/") || suite.endsWith(".js")) return suite;
  return path.posix.join(TEST_DIR, suite + TEST_SUFFIX);
}

// The test files in `names` (a directory listing of test/), sorted.
function testFiles(names) {
  return names
    .filter((name) => name.endsWith(TEST_SUFFIX))
    .sort()
    .map((name) => path.posix.join(TEST_DIR, name));
}

// The program and arguments a parsed command runs. `listTests` returns the
// names in test/; it is only called for `test` with no suites.
function plan(parsed, listTests) {
  switch (parsed.command) {
    case "test": {
      const files =
        parsed.operands.length > 0
          ? parsed.operands.map(suiteFile)
          : testFiles(listTests());
      return { program: process.execPath, args: ["--test", ...files] };
    }
    case "check":
      return {
        program: "nix",
        args: ["flake", "check", ...parsed.passthrough],
      };
    case "fmt":
      return { program: "nix", args: ["fmt", ...parsed.passthrough] };
    case "update":
      return {
        program: "nix",
        args: ["flake", "update", ...parsed.passthrough],
      };
    default:
      throw new Error(`no plan for command: ${parsed.command}`);
  }
}

function helpText(command) {
  if (command === null) {
    const width = Math.max(...Object.keys(COMMANDS).map((n) => n.length));
    return [
      "Usage: tab-scissors <command> [options]",
      "",
      "The Tab Scissors repository's commands.",
      "",
      "Commands:",
      ...Object.entries(COMMANDS).map(
        ([name, { summary }]) => `  ${name.padEnd(width)}  ${summary}`,
      ),
      "",
      "Options:",
      "  -h, --help  Show this help, or a command's with `<command> --help`",
      "",
      "Exit status: 0 on success, the command's own status when it fails,",
      "2 for a usage error, 127 when its program isn't found.",
      "",
    ].join("\n");
  }
  const { summary, usage, details } = COMMANDS[command];
  return [
    `Usage: ${usage}`,
    "",
    summary + ".",
    "",
    ...details,
    "",
    "Options:",
    "  -h, --help  Show this help",
    "",
  ].join("\n");
}

function main(argv) {
  let parsed;
  try {
    parsed = parse(argv);
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    process.stderr.write(
      `tab-scissors: ${error.message}\nRun \`tab-scissors --help\` for usage.\n`,
    );
    return 2;
  }
  if (parsed.help) {
    process.stdout.write(helpText(parsed.command));
    return 0;
  }

  const { program, args } = plan(parsed, () =>
    fs.readdirSync(path.join(ROOT, TEST_DIR)),
  );
  const result = spawnSync(program, args, { cwd: ROOT, stdio: "inherit" });
  if (result.error) {
    process.stderr.write(
      `tab-scissors: cannot run ${program}: ${result.error.message}\n`,
    );
    return result.error.code === "ENOENT" ? 127 : 1;
  }
  if (result.signal) {
    return 128 + (os.constants.signals[result.signal] ?? 0);
  }
  return result.status;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = {
  COMMANDS,
  UsageError,
  parse,
  suiteFile,
  testFiles,
  plan,
  helpText,
};
