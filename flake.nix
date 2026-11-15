{
  description = "Tab Scissors: a Chrome extension that splits a window into two at the selected tab";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-parts = {
      url = "github:hercules-ci/flake-parts";
      inputs.nixpkgs-lib.follows = "nixpkgs";
    };
    systems.url = "github:nix-systems/default";
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
      imports = [ inputs.agent-skill-flake.flakeModules.devshellSkills ];

      agent-skill-flake.devshellSkills = {
        name = "chrome-extension-tab-scissors";
        # No formatter is configured, so leave out the check / fmt /
        # update-flake trio's `fmt`; keep only the skills commands.
        includeStandardCommands = false;
      };
    };
}
