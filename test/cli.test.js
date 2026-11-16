const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  COMMANDS,
  UsageError,
  parse,
  suiteFile,
  testFiles,
  plan,
  helpText,
} = require("../bin/tab-scissors.js");

const noListing = () => {
  throw new Error("listed test/ when it shouldn't have");
};

test("no arguments, -h and --help ask for the top-level help", () => {
  for (const argv of [[], ["-h"], ["--help"]]) {
    assert.deepEqual(parse(argv), {
      command: null,
      help: true,
      operands: [],
      passthrough: [],
    });
  }
});

test("each command parses, and --help after it asks for its help", () => {
  for (const name of Object.keys(COMMANDS)) {
    assert.equal(parse([name]).command, name);
    assert.equal(parse([name]).help, false);
    assert.equal(parse([name, "--help"]).help, true);
    assert.equal(parse([name, "-h"]).help, true);
  }
});

test("an unknown command or option is a usage error", () => {
  assert.throws(() => parse(["bogus"]), UsageError);
  assert.throws(() => parse(["--verbose"]), UsageError);
  assert.throws(() => parse(["test", "--watch"]), UsageError);
});

test("test takes suites but no pass-through arguments", () => {
  assert.deepEqual(parse(["test", "config", "tabLogic"]).operands, [
    "config",
    "tabLogic",
  ]);
  assert.throws(() => parse(["test", "--", "--watch"]), UsageError);
});

test("the nix commands take pass-through arguments only after --", () => {
  assert.deepEqual(parse(["check", "--", "-L", "--help"]).passthrough, [
    "-L",
    "--help",
  ]);
  assert.equal(parse(["check", "--", "--help"]).help, false);
  assert.throws(() => parse(["update", "nixpkgs"]), UsageError);
});

test("suiteFile names a suite's file, and keeps a path as it is", () => {
  assert.equal(suiteFile("config"), "test/config.test.js");
  assert.equal(suiteFile("test/cli.test.js"), "test/cli.test.js");
  assert.equal(suiteFile("other.js"), "other.js");
});

test("testFiles keeps only *.test.js, sorted", () => {
  assert.deepEqual(testFiles(["b.test.js", "helper.js", "a.test.js"]), [
    "test/a.test.js",
    "test/b.test.js",
  ]);
});

test("plan runs node --test over every suite, or the named ones", () => {
  assert.deepEqual(
    plan(parse(["test"]), () => ["x.test.js"]),
    { program: process.execPath, args: ["--test", "test/x.test.js"] },
  );
  assert.deepEqual(plan(parse(["test", "config"]), noListing), {
    program: process.execPath,
    args: ["--test", "test/config.test.js"],
  });
});

test("plan maps check, fmt and update to nix, passing arguments through", () => {
  assert.deepEqual(plan(parse(["check", "--", "-L"]), noListing), {
    program: "nix",
    args: ["flake", "check", "-L"],
  });
  assert.deepEqual(plan(parse(["fmt"]), noListing), {
    program: "nix",
    args: ["fmt"],
  });
  assert.deepEqual(plan(parse(["update", "--", "nixpkgs"]), noListing), {
    program: "nix",
    args: ["flake", "update", "nixpkgs"],
  });
});

test("the top-level help lists every command, and each has its own", () => {
  const top = helpText(null);
  for (const name of Object.keys(COMMANDS)) {
    assert.match(top, new RegExp(`^  ${name} `, "m"));
    assert.match(helpText(name), new RegExp(`^Usage: tab-scissors ${name}`));
  }
});
