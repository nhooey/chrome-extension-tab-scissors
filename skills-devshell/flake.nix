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

    # skillspkgs' per-family skill combinations. It follows `nixpkgs` but not
    # `agent-skill-flake`, so its sources keep their own compatible builder.
    skillspkgs-combinations = {
      url = "github:nhooey/skillspkgs?dir=sources/combinations";
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
        # The browser-extensions-and-game-mods family's combination, the
        # dev shell's one skill source. The family is all JavaScript, so this
        # repository has no additions of its own.
        { source = inputs.skillspkgs-combinations.combinations.browser-extensions-and-game-mods; }
      ];
    };
}
