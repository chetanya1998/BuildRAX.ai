import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InspectorTextField } from "./inspector-text-field";

afterEach(cleanup);

function setup(options: { multiline?: boolean; readOnly?: boolean } = {}) {
  const onCommit = vi.fn();
  render(<label>Name<InspectorTextField value="Original" maxLength={120} onCommit={onCommit} {...options} /></label>);
  return { field: screen.getByRole("textbox"), onCommit };
}

describe("inspector edit transactions", () => {
  it("buffers keystrokes and commits once on blur", () => {
    const { field, onCommit } = setup();
    for (const value of ["N", "Ne", "New name"]) fireEvent.change(field, { target: { value } });
    expect(onCommit).not.toHaveBeenCalled();
    fireEvent.blur(field);
    expect(onCommit).toHaveBeenCalledExactlyOnceWith("New name");
  });
  it("does not duplicate Enter followed by blur", () => {
    const { field, onCommit } = setup();
    fireEvent.change(field, { target: { value: " New " } });
    fireEvent.keyDown(field, { key: "Enter" });
    fireEvent.blur(field);
    expect(onCommit).toHaveBeenCalledExactlyOnceWith("New");
  });
  it("cancels on Escape without recording a no-op", () => {
    const { field, onCommit } = setup();
    fireEvent.change(field, { target: { value: "Discard" } });
    fireEvent.keyDown(field, { key: "Escape" });
    expect(field).toHaveValue("Original");
    fireEvent.blur(field);
    expect(onCommit).not.toHaveBeenCalled();
  });
  it("rejects invalid text and accepts a corrected draft", () => {
    const { field, onCommit } = setup();
    fireEvent.change(field, { target: { value: "<markup>" } });
    fireEvent.blur(field);
    expect(onCommit).not.toHaveBeenCalled();
    expect((field as HTMLInputElement).validity.valid).toBe(false);
    fireEvent.change(field, { target: { value: "Valid" } });
    fireEvent.blur(field);
    expect(onCommit).toHaveBeenCalledExactlyOnceWith("Valid");
  });
  it("preserves Enter in textareas and commits with Ctrl+Enter", () => {
    const { field, onCommit } = setup({ multiline: true });
    fireEvent.change(field, { target: { value: "Line 1\nLine 2" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(onCommit).not.toHaveBeenCalled();
    fireEvent.keyDown(field, { key: "Enter", ctrlKey: true });
    expect(onCommit).toHaveBeenCalledExactlyOnceWith("Line 1\nLine 2");
  });
  it("does not submit while an IME composition is active", () => {
    const { field, onCommit } = setup();
    fireEvent.compositionStart(field);
    fireEvent.change(field, { target: { value: "名前" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(onCommit).not.toHaveBeenCalled();
    fireEvent.compositionEnd(field);
    fireEvent.blur(field);
    expect(onCommit).toHaveBeenCalledExactlyOnceWith("名前");
  });
  it("never commits a read-only field", () => {
    const { field, onCommit } = setup({ readOnly: true });
    fireEvent.change(field, { target: { value: "Ignored" } });
    fireEvent.blur(field);
    expect(onCommit).not.toHaveBeenCalled();
  });
  it("resets an uncommitted draft when the parent changes the object/value key", () => {
    const onCommit = vi.fn();
    const { rerender } = render(<InspectorTextField key="node:1:Original" value="Original" maxLength={120} onCommit={onCommit} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Draft" } });
    rerender(<InspectorTextField key="node:2:Other" value="Other" maxLength={120} onCommit={onCommit} />);
    expect(screen.getByRole("textbox")).toHaveValue("Other");
    fireEvent.blur(screen.getByRole("textbox"));
    expect(onCommit).not.toHaveBeenCalled();
  });
  it("rejects over-limit text without committing it", () => {
    const { field, onCommit } = setup();
    fireEvent.change(field, { target: { value: "a".repeat(121) } });
    fireEvent.blur(field);
    expect(onCommit).not.toHaveBeenCalled();
    expect(field).toBeInvalid();
  });
});
