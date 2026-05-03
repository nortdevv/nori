import { useState, useCallback } from "react";
import { documentApi } from "../services/api";
import type { JsonValue } from "../types/project";
import { getErrorMessage } from "../lib/utils";

export type EditStatus = "idle" | "editing" | "saving" | "saved";

interface UseSectionEditResult {
  status: EditStatus;
  draft: JsonValue | null;
  errorMessage: string | null;
  setDraft: (draft: JsonValue | null) => void;
  startEdit: () => void;
  cancelEdit: () => void;
  save: () => Promise<void>;
}

export function useSectionEdit(
  projectId: string,
  sectionId: number,
  content: JsonValue | string | undefined,
  onSaved: (updatedContent: JsonValue) => void,
): UseSectionEditResult {
  const [status, setStatus] = useState<EditStatus>("idle");
  const [draft, setDraft] = useState<JsonValue | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  //
  const startEdit = useCallback(() => {
    let parsed: JsonValue | null =
      content === undefined ? null : (content as JsonValue);
    if (typeof content === "string") {
      const trimmed = content.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          parsed = JSON.parse(trimmed) as JsonValue;
        } catch {
          parsed = content;
        }
      }
    }
    setDraft(parsed);
    setErrorMessage(null);
    setStatus("editing");
  }, [content]);

  const cancelEdit = useCallback(() => {
    setDraft(null);
    setErrorMessage(null);
    setStatus("idle");
  }, []);

  const save = useCallback(async () => {
    setStatus("saving");
    setErrorMessage(null);
    try {
      const result = await documentApi.patchSection(
        projectId,
        sectionId,
        draft,
      );
      onSaved((result?.content ?? draft) as JsonValue);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err, "Error al guardar. Inténtalo de nuevo."));
      setStatus("editing");
    }
  }, [projectId, sectionId, draft, onSaved]);

  return { status, draft, errorMessage, setDraft, startEdit, cancelEdit, save };
}
