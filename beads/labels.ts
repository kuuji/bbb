import { analyze, fieldDefinition, type QueryNode } from "../beads-query-language";
import { describeQueryExecution } from "../beads-query-language/execution";

export function sortLabels(labels: readonly string[]): string[] {
  return [...new Set(labels.filter((label) => typeof label === "string" && label.trim()))]
    .sort((a, b) => Number(b.startsWith("project:")) - Number(a.startsWith("project:")) || a.localeCompare(b));
}

export function collectIssueLabels(issues: readonly { labels: readonly string[] }[]): string[] {
  return sortLabels(issues.flatMap((issue) => issue.labels));
}

function terms(node: QueryNode): QueryNode[] {
  if (node.type === "group") return terms(node.expression);
  return node.type === "and" ? [...terms(node.left), ...terms(node.right)] : [node];
}

function isLabel(node: QueryNode): boolean {
  return node.type === "comparison" && node.operator === "=" && fieldDefinition(node.field)?.name === "label";
}

function containsLabel(node: QueryNode): boolean {
  if (isLabel(node)) return true;
  if (node.type === "group") return containsLabel(node.expression);
  if (node.type === "not") return containsLabel(node.operand);
  return (node.type === "and" || node.type === "or") && (containsLabel(node.left) || containsLabel(node.right));
}

export const ADVANCED_LABEL_FILTER = "__bb_advanced_label_filter__";

export function selectedLabel(source: string): string {
  const state = describeQueryExecution(source);
  if (state.mode !== "query") return "";
  const ast = analyze(source).ast;
  if (!ast) return "";
  const direct = terms(ast).filter(isLabel);
  if (direct.length === 1 && direct[0]?.type === "comparison") return direct[0].value;
  return containsLabel(ast) ? ADVANCED_LABEL_FILTER : "";
}

/** Change positive top-level label filters without widening OR/NOT expressions. */
export function setLabelFilter(source: string, label: string): string {
  const state = describeQueryExecution(source);
  if (state.mode === "invalid") throw new Error("Finish the query before choosing a label.");
  const clause = label ? `label=${JSON.stringify(label)}` : "";
  if (state.mode === "empty" || state.mode === "text") return clause;
  const ast = analyze(source).ast;
  if (!ast) return clause;
  const remaining = terms(ast).filter((node) => !isLabel(node));
  const base = remaining.map((node) => {
    const raw = source.slice(node.from, node.to);
    return node.type === "or" ? `(${raw})` : raw;
  }).join(" AND ");
  return [base, clause].filter(Boolean).join(" AND ");
}
