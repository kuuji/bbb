import { sortLabels } from "../beads/labels";

export function IssueLabels({ labels, limit }: { labels: readonly string[]; limit?: number }) {
  const all = sortLabels(labels);
  if (!all.length) return null;
  const visible = limit === undefined ? all : all.slice(0, limit);
  const remaining = all.slice(visible.length);
  return (
    <span role="group" aria-label="Issue labels" className="flex min-w-0 flex-wrap items-center gap-1">
      {visible.map((label) => (
        <span key={label} title={label} className={`max-w-48 truncate rounded border border-border px-1.5 py-0.5 text-[11px] ${label.startsWith("project:") ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>
          {label}
        </span>
      ))}
      {remaining.length ? <span aria-label={`Other labels: ${remaining.join(", ")}`} title={remaining.join(", ")} className="text-[11px] text-muted-foreground">+{remaining.length}</span> : null}
    </span>
  );
}
