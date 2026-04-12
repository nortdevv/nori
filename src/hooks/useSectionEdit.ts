import { useState, useCallback } from "react";
import { documentApi } from "../services/api";

export type EditStatus = "idle" | "editing" | "saving" | "saved";

interface UseSectionEditResult {
  status: EditStatus;
  draft: any;
  errorMessage: string | null;
  setDraft: (draft: any) => void;
  startEdit: () => void;
  cancelEdit: () => void;
  save: () => Promise<void>;
}

export function useSectionEdit(
  projectId: string,
  sectionId: number,
  content: any,
  onSaved: (updatedContent: any) => void,
): UseSectionEditResult {
  const [status, setStatus] = useState<EditStatus>("idle");
  const [draft, setDraft] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  //
  const startEdit = useCallback(() => {
    let parsed = content;
    if (typeof content === "string") {
      const trimmed = content.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          parsed = JSON.parse(trimmed);
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
      onSaved(result?.content ?? draft);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err: any) {
      setErrorMessage(err.message ?? "Error al guardar. Inténtalo de nuevo.");
      setStatus("editing");
    }
  }, [projectId, sectionId, draft, onSaved]);

  return { status, draft, errorMessage, setDraft, startEdit, cancelEdit, save };
}
