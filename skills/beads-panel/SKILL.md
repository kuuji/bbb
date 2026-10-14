---
name: beads-panel
description: Configure or troubleshoot the BB Beads panel, including a native bd connect workspace for a shared HTTP ledger. This is panel configuration, not an instruction to replace repository engineering backlogs.
---

# BB Beads panel

Inspect `bb plugin config beads` and `bb machine list --json` before changing the panel.

The plugin invokes ordinary `bd` commands on the selected filesystem host. Settings:

- `projectId`: project override when no dedicated workspace is configured.
- `workspacePath`: absolute path to a `.beads` workspace, including a native HTTP connection workspace; overrides project selection.
- `workspaceHostId`: enrolled machine owning that path; empty preserves primary-host execution.
- `bdExecutable`: `bd` on PATH or an absolute path to `bd`/`bd.exe` on that machine; empty preserves the existing CLI.

For centralized Beads, use a compatible upstream HTTP CLI and a SEPARATE directory:

```sh
mkdir -p "$HOME/.local/share/bb-beads/namu-central"
cd "$HOME/.local/share/bb-beads/namu-central"
"$HOME/.local/share/beads-http/bin/bd" connect https://beads.lab.byeon.ca \
  --expect-project-id 1b075bca-a168-49d0-8f6f-a41a9e4d27a7
```

Set the plugin's workspace path, owning host ID, and compatible executable, then reload/refresh and verify a known shared issue via the panel RPC. Do not overwrite an existing project `.beads`, redirect, hooks or local ledger to configure the panel. No Dolt database or sync is needed for this dedicated HTTP workspace. Clear the three settings to return to the previous project-backed behavior.

The override is a whole-ledger panel and locks project selection. Label badges show project labels first on cards/list rows and all labels in details. Use the Labels dropdown beside search to choose/switch a project label without remembering query syntax. It updates the visible query; All labels removes its top-level label clause, preserving other structured filters. Labels are loaded independently of current results and refreshed with the panel. It does not establish automatic per-project namespaces. Directory-label defaults can restrict ordinary lists; explicit queries/IDs bypass them and the panel does not add project labels on creation. Use explicit labels via the CLI for project-scoped task creation. Labels are not authorization.

Namu's API is `/v0/beads` on that private HTTPS hostname. The older web UI at `/` uses a separate ledger. Namu itself keeps its existing internal service endpoint. Setup, pinned client and validation: https://github.com/kuuji/namu/blob/main/docs/centralized-beads.md

Never retry a failed or timed-out panel mutation blindly; inspect the issue first. Use labelled disposable tasks for live mutation smoke tests, retain them closed, and keep live smoke separate from offline tests. No migration of an engineering backlog is implied by panel configuration.
