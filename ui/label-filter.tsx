import { useId } from "react";
import { ADVANCED_LABEL_FILTER, selectedLabel, setLabelFilter, sortLabels } from "../beads/labels";
import { describeQueryExecution } from "../beads-query-language/execution";

export function LabelFilter({ labels, query, onQueryChange, loading = false, error }: {
  labels: readonly string[];
  query: string;
  onQueryChange: (query: string) => void;
  loading?: boolean;
  error?: string | null;
}) {
  const hintId = useId();
  const current = selectedLabel(query);
  const options = sortLabels([...labels, ...(current && current !== ADVANCED_LABEL_FILTER ? [current] : [])]);
  const mode = describeQueryExecution(query).mode;
  const hint = error ? "Labels unavailable; refresh to retry."
    : mode === "text" ? "Choosing a label replaces the text search."
    : mode === "invalid" ? "Finish the query to choose a label."
    : current === ADVANCED_LABEL_FILTER ? "Advanced label conditions stay in the query." : "";
  return (
    <div className="flex min-w-0 flex-[0_1_18rem] flex-col gap-1">
      <label className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
        <span className="shrink-0">Labels</span>
        <select aria-label="Filter by label" aria-describedby={hint ? hintId : undefined} value={current} disabled={loading || mode === "invalid"}
          className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60 max-md:pointer-coarse:h-11"
          onChange={(event) => onQueryChange(setLabelFilter(query, event.target.value))}>
          <option value="">{loading ? "Loading labels…" : "All labels"}</option>
          {current === ADVANCED_LABEL_FILTER ? <option value={ADVANCED_LABEL_FILTER} disabled>Advanced label query</option> : null}
          {options.map((label) => <option key={label} value={label}>{label}</option>)}
        </select>
      </label>
      {hint ? <span id={hintId} role={error ? "status" : undefined} className={`text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}>{hint}</span> : null}
    </div>
  );
}
