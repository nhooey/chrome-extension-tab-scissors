{
  description = "chrome-extension-tab-scissors dev-shell skill set: an isolated sub-flake invoked at runtime by the root devShell, never a root input, so the skill sources live only in this flake's lock.";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    systems.url = "github:nix-systems/default";

    # The builder lib; it carries no skill inputs.
    agent-skill-flake = {
      url = "github:nhooey/agent-skill-flake";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    # Skill sources, the same repos `github:nhooey/skillspkgs` aggregates.
    # They follow `nixpkgs` but not `agent-skill-flake`, so each keeps its own
    # compatible builder.
    coding-agent-skills = {
      url = "github:nhooey/coding-agent-skills/overnight-skills";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    git-skills = {
      url = "github:nhooey/git-skills/overnight-skills";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    shell-skills = {
      url = "github:nhooey/shell-skills/overnight-skills";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      nixpkgs,
      agent-skill-flake,
      ...
    }@inputs:
    agent-skill-flake.lib.mkDevshellSkillsFlake {
      inherit nixpkgs;
      systems = import inputs.systems;
      name = "chrome-extension-tab-scissors-devshell";
      sources = [
        # Commits, branches and pull requests.
        { source = inputs.git-skills; }
        # Safe shell commands: named deletes, PIDs, no machine-wide changes.
        { source = inputs.shell-skills; }
        # Headless runs in a checkout, a tidy scratchpad, and plans as a graph.
        {
          source = inputs.coding-agent-skills;
          skills = [
            "coding-agent-headless-in-checkout"
            "coding-agent-plans-as-graph"
            "coding-agent-scratchpad-scripts"
          ];
        }
      ];
    };
}
