import React from "react";
import { ChevronDown, ChevronRight, Check } from "lucide-react";
import "../../pages/Chat.css";

export interface DocSection {
  id: number;
  title: string;
  completed: boolean;
  expanded: boolean;
  content?: any; // Document section content from backend
}

function renderSectionContent(content: any): React.ReactNode {
  if (!content) return null;

  // Display the full JSON content in a readable format (similar to demo)
  return (
    <pre style={{
      backgroundColor: '#f5f5f5',
      borderRadius: '4px',
      padding: '10px',
      fontFamily: '"Courier New", monospace',
      fontSize: '11px',
      maxHeight: '200px',
      overflowY: 'auto',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      color: '#333',
      margin: 0,
    }}>
      {JSON.stringify(content, null, 2)}
    </pre>
  );
}

function DocSectionItem({
  section,
  onToggle,
}: {
  section: DocSection;
  onToggle: (id: number) => void;
}) {
  return (
    <div className={`doc-section ${!section.expanded ? "doc-section--collapsed" : ""}`}>
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
          {section.content ? (
            <div className="doc-section__content-text">
              {renderSectionContent(section.content)}
            </div>
          ) : (
            <span className={section.completed ? "doc-section__content--completed" : "doc-section__content--pending"}>
              {section.completed ? "Sección completada." : "Aún no completado"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default DocSectionItem;
