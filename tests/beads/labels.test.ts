import { describe, expect, it } from "vitest";
import { analyze } from "../../beads-query-language";
import { ADVANCED_LABEL_FILTER, collectIssueLabels, selectedLabel, setLabelFilter } from "../../beads/labels";

describe("label query controls", () => {
  it("keeps a distinct project-first catalog", () => {
    expect(collectIssueLabels([{ labels: ["bug", "project:z", "project:a"] }, { labels: ["bug", " "] }]))
      .toEqual(["project:a", "project:z", "bug"]);
  });
  it("adds, switches and clears the label without losing status filters", () => {
    const first = setLabelFilter("status=open", "project:a");
    expect(first).toBe('status=open AND label="project:a"');
    expect(setLabelFilter(first, "project:b")).toBe('status=open AND label="project:b"');
    expect(setLabelFilter(first, "")).toBe("status=open");
    expect(selectedLabel(first)).toBe("project:a");
  });
  it("preserves OR/NOT conditions and precedence", () => {
    const base = "status=open OR NOT label=archived";
    const filtered = setLabelFilter(base, "project:a");
    expect(filtered).toBe('(status=open OR NOT label=archived) AND label="project:a"');
    expect(selectedLabel(base)).toBe(ADVANCED_LABEL_FILTER);
    expect(setLabelFilter(filtered, "")).toBe(`(${base})`);
    expect(analyze(filtered).diagnostics).toEqual([]);
  });
  it("recognizes manually typed label aliases and grouped AND filters", () => {
    expect(selectedLabel('((status=open AND labels="project:a"))')).toBe("project:a");
    expect(setLabelFilter('((status=open AND labels="project:a"))', "project:b"))
      .toBe('status=open AND label="project:b"');
  });
  it("quotes special characters so a label cannot introduce query syntax", () => {
    const label = 'project:a" OR status=open \\ path';
    const query = setLabelFilter("", label);
    expect(analyze(query).diagnostics).toEqual([]);
    expect(selectedLabel(query)).toBe(label);
    expect(analyze(query).ast?.type).toBe("comparison");
  });
  it("refuses an incomplete query and visibly replaces plain text in the UI", () => {
    expect(() => setLabelFilter("status=", "bug")).toThrow("Finish the query");
    expect(setLabelFilter("login redirect", "project:a")).toBe('label="project:a"');
    expect(setLabelFilter('label="project:a"', "")).toBe("");
  });
});
