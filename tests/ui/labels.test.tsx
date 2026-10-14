// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { IssueLabels } from "../../ui/issue-labels";
import { LabelFilter } from "../../ui/label-filter";

afterEach(cleanup);

function Harness({ initial = "", labels = ["project:a", "project:b", "bug"] }: { initial?: string; labels?: string[] }) {
  const [query, setQuery] = useState(initial);
  // Catalog is independent from the current label-filtered result set.
  return <><LabelFilter labels={labels} query={query} onQueryChange={setQuery} /><output>{query}</output></>;
}

describe("issue label presentation", () => {
  it("shows project labels first and keeps hidden labels readable in compact rows", () => {
    render(<IssueLabels labels={["bug", "project:a", "feature"]} limit={2} />);
    const group = screen.getByRole("group", { name: "Issue labels" });
    expect(group.textContent).toBe("project:abug+1");
    expect(within(group).getByText("+1").getAttribute("title")).toBe("feature");
  });
  it("shows all detail labels and no empty placeholder", () => {
    const { rerender } = render(<IssueLabels labels={["project:a", "bug"]} />);
    expect(screen.getByText("project:a")).toBeTruthy();
    expect(screen.getByText("bug")).toBeTruthy();
    rerender(<IssueLabels labels={[]} />);
    expect(screen.queryByRole("group")).toBeNull();
  });
});

describe("label picker", () => {
  it("switches and clears labels while retaining the other query filters", () => {
    render(<Harness initial="status=open" />);
    const picker = screen.getByRole("combobox", { name: "Filter by label" });
    fireEvent.change(picker, { target: { value: "project:a" } });
    expect(screen.getByRole("status").textContent).toBe('status=open AND label="project:a"');
    expect(within(picker).getByRole("option", { name: "project:b" })).toBeTruthy();
    fireEvent.change(picker, { target: { value: "project:b" } });
    expect(screen.getByRole("status").textContent).toBe('status=open AND label="project:b"');
    fireEvent.change(picker, { target: { value: "" } });
    expect(screen.getByRole("status").textContent).toBe("status=open");
  });
  it("keeps a manually selected label available even if absent from the catalog", () => {
    render(<Harness initial='label="project:missing"' labels={["project:a"]} />);
    const picker = screen.getByRole("combobox", { name: "Filter by label" });
    expect((picker as HTMLSelectElement).value).toBe("project:missing");
    expect(within(picker).getByRole("option", { name: "project:missing" })).toBeTruthy();
  });
  it("explains plain text replacement and protects incomplete queries", () => {
    const { rerender } = render(<Harness initial="login" />);
    expect(screen.getByText("Choosing a label replaces the text search.")).toBeTruthy();
    rerender(<LabelFilter labels={["project:a"]} query="status=" onQueryChange={() => {}} />);
    expect((screen.getByRole("combobox") as HTMLSelectElement).disabled).toBe(true);
    expect(screen.getByText("Finish the query to choose a label.")).toBeTruthy();
  });
});
