{
  description = "Tab Scissors: a Chrome extension that splits a window into two at the selected tab";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-parts = {
      url = "github:hercules-ci/flake-parts";
      inputs.nixpkgs-lib.follows = "nixpkgs";
    };
    systems.url = "github:nix-systems/default";
    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    # The builder library, not a skill: it exports the
    # `flakeModules.devshellSkills` module for the dev shell. The dev shell's
    # skills live in the `skills-devshell/` sub-flake, invoked at runtime, so
    # this flake carries no skill inputs.
    agent-skill-flake = {
      url = "github:nhooey/agent-skill-flake";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    { flake-parts, ... }@inputs:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = import inputs.systems;
      imports = [
        inputs.agent-skill-flake.flakeModules.devshellSkills
        inputs.treefmt-nix.flakeModule
      ];

      agent-skill-flake.devshellSkills = {
        name = "chrome-extension-tab-scissors";
        # `tab-scissors` carries check, fmt and update itself, so the module's
        # stock trio would only list them twice.
        includeStandardCommands = false;
      };

      perSystem =
        { pkgs, ... }:
        {
          # The repository's commands, as one tool: bin/tab-scissors.js, run
          # from the checkout so an edit takes effect without re-entering.
          devshells.default = {
            packages = [ pkgs.nodejs ];
            commands = [
              {
                category = "dev";
                name = "tab-scissors";
                help = "The repository's commands: test, check, fmt, update (tab-scissors --help)";
                command = ''exec ${pkgs.nodejs}/bin/node "$PRJ_ROOT/bin/tab-scissors.js" "$@"'';
              }
            ];
          };

          # `nix flake check` runs the Node tests in test/, through the tool.
          checks.tests =
            pkgs.runCommand "tab-scissors-tests"
              {
                nativeBuildInputs = [ pkgs.nodejs ];
              }
              ''
                cp -r ${./.} src
                cd src
                node bin/tab-scissors.js test
                touch $out
              '';

          # `nix fmt` formats the tree, and `nix flake check` fails on an
          # unformatted file through treefmt-nix's `checks.treefmt`.
          treefmt = {
            projectRootFile = "flake.nix";
            programs.nixfmt.enable = true;
            programs.prettier.enable = true;
            settings.global.excludes = [
              ".agents/**" # installed third-party skills, not ours to reformat
              ".claude/**"
              "*.png"
            ];
          };
        };
    };
}
