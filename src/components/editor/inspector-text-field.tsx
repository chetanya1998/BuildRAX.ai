"use client";

import { useRef, useState } from "react";

type Props = {
  value: string;
  onCommit: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  multiline?: boolean;
  readOnly?: boolean;
};

/** Mount with an object/field/value key so an external change resets the draft. */
export function InspectorTextField({ value, onCommit, maxLength, placeholder, multiline = false, readOnly = false }: Props) {
  const [draft, setDraft] = useState(value);
  const submitted = useRef(value);
  const composing = useRef(false);

  function finish(element: HTMLInputElement | HTMLTextAreaElement) {
    if (readOnly || composing.current) return;
    if (/[<>]/.test(draft) || draft.trim().length > maxLength) {
      element.setCustomValidity("Use plain text within the field length limit; angle brackets are not allowed.");
      element.reportValidity();
      return;
    }
    element.setCustomValidity("");
    const next = draft.trim();
    if (next !== submitted.current) {
      submitted.current = next;
      onCommit(next);
    }
    setDraft(next);
  }

  const props = {
    value: draft, maxLength, placeholder, readOnly,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      event.currentTarget.setCustomValidity("");
      setDraft(event.currentTarget.value);
    },
    onCompositionStart: () => { composing.current = true; },
    onCompositionEnd: () => { composing.current = false; },
    onBlur: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => finish(event.currentTarget),
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (composing.current || event.nativeEvent.isComposing) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setCustomValidity("");
        setDraft(submitted.current);
      } else if (event.key === "Enter" && (!multiline || event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        finish(event.currentTarget);
      }
    },
  };
  return multiline ? <textarea {...props} /> : <input {...props} />;
}
