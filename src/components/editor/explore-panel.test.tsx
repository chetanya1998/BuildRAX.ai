import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildArchitectureIR } from "@/lib/architecture-ir/compiler";
import { ExplorePanel } from "./explore-panel";

afterEach(cleanup);
const ir = buildArchitectureIR({ prompt: "Build a multi-tenant SaaS with background jobs." });
describe("Explore panel", () => {
  it("searches and focuses an existing component without a mutation callback", () => {
    const onFocus = vi.fn();
    render(<ExplorePanel ir={ir} selectedId={null} onFocus={onFocus} />);
    fireEvent.change(screen.getByLabelText("Search architecture"), { target: { value: ir.components[0].id } });
    fireEvent.click(screen.getByRole("button", { name: `component ${ir.components[0].name}` }));
    expect(onFocus).toHaveBeenCalledWith(expect.objectContaining({ componentIds: [ir.components[0].id] }), ir.components[0].id);
  });
  it("disables incomplete route queries and exposes supported route facts", () => {
    render(<ExplorePanel ir={ir} selectedId={null} onFocus={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Find routes" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Route source"), { target: { value: ir.flows[0].source } });
    fireEvent.change(screen.getByLabelText("Route target"), { target: { value: ir.flows[0].target } });
    fireEvent.click(screen.getByRole("button", { name: "Find routes" }));
    expect(screen.getByText(/Shortest route:/)).toBeInTheDocument();
    expect(screen.getByText(/No capacity/)).toBeInTheDocument();
  });
  it("resets search, route state and focus using Escape", () => {
    const onFocus = vi.fn();
    render(<ExplorePanel ir={ir} selectedId={null} onFocus={onFocus} />);
    const input = screen.getByLabelText("Search architecture");
    fireEvent.change(input, { target: { value: "unmatched" } });
    expect(screen.getByRole("status")).toHaveTextContent("0 results");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveValue("");
    expect(onFocus).toHaveBeenLastCalledWith({ componentIds: [], flowIds: [] });
  });
});
