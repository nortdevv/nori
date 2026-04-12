import { useState } from "react";
import { ChevronDown, ChevronRight, Check, Pencil } from "lucide-react";
import "../../pages/Chat.css";
import SectionContent from "./SectionContent";
import SectionEditForm from "./SectionEditForm";
import { useSectionEdit } from "../../hooks/useSectionEdit";

export interface DocSection {
  id: number;
  title: string;
  completed: boolean;
  expanded: boolean;
  content?: any; // Document section content from backend
}

function DocSectionItem({
  section,
  projectId,
  onToggle,
}: {
  section: DocSection;
  projectId: string;
  onToggle: (id: number) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [localContent, setLocalContent] = useState(section.content);
  // Custom hook to manage edit state and actions
  const { status, draft, errorMessage, setDraft, startEdit, cancelEdit, save } =
    useSectionEdit(projectId, section.id, localContent, setLocalContent);

  const isEditMode = status === "editing" || status === "saving";

  return (
    <div
      className={`doc-section ${!section.expanded ? "doc-section--collapsed" : ""}`}
    >
      <div className="doc-section__header" onClick={() => onToggle(section.id)}>
        <div className="doc-section__label-row">
          {section.expanded ? (
            <ChevronDown size={16} color="#6B6B6B" />
          ) : (
            <ChevronRight size={16} color="#6B6B6B" />
          )}
          <span>{section.title}</span>
        </div>

        {section.completed && (
          <div className="doc-section__check">
            <Check size={12} color="#00A859" />
          </div>
        )}
      </div>

      {section.expanded && (
        <div className="doc-section__content">
          {localContent ? (
            <div
              className="doc-section__content-text"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {isEditMode ? (
                <div>
                  <SectionEditForm
                    draft={draft}
                    onChange={setDraft}
                    disabled={status === "saving"}
                  />
                  {errorMessage && (
                    <p className="doc-section__edit-error">{errorMessage}</p>
                  )}
                  <div className="doc-section__edit-actions">
                    <button
                      className="doc-section__save-btn"
                      onClick={save}
                      disabled={status === "saving"}
                    >
                      {status === "saving" ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      className="doc-section__cancel-btn"
                      onClick={cancelEdit}
                      disabled={status === "saving"}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="doc-section__edit-wrapper">
                  {status === "saved" && (
                    <span className="doc-section__saved-badge">✓ Guardado</span>
                  )}
                  {status === "idle" && isHovered && (
                    <button
                      className="doc-section__edit-btn"
                      title="Editar sección"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit();
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <SectionContent
                    sectionId={section.id}
                    content={localContent}
                  />
                </div>
              )}
            </div>
          ) : (
            <span
              className={
                section.completed
                  ? "doc-section__content--completed"
                  : "doc-section__content--pending"
              }
            >
              {section.completed ? "Sección completada." : "Aún no completado"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default DocSectionItem;
