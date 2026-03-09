import { ChevronDown, ChevronRight, Check } from "lucide-react";
import "../../pages/Chat.css";

export interface DocSubSection {
  id: string;
  title: string;
  badge?: string;
  badgeColor?: "red" | "cyan" | "navy";
  hasRiskTable?: boolean;
}

export interface DocSection {
  id: number;
  title: string;
  badge?: string;
  badgeColor?: "red" | "cyan" | "navy";
  completed: boolean;
  expanded: boolean;
  subsections?: DocSubSection[];
}

const RISK_ROWS = ["Crédito", "Liquidez", "Mercado", "Operativo", "Reputacional"];

function RiskTable() {
  return (
    <table className="risk-table">
      <thead>
        <tr>
          <th className="risk-table__col--riesgo">Riesgo</th>
          <th>Probable Pérdida</th>
          <th>Justificación</th>
        </tr>
      </thead>
      <tbody>
        {RISK_ROWS.map((row) => (
          <tr key={row}>
            <td>{row}</td>
            <td>N/A</td>
            <td>N/A</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SectionBadge({ text, color }: { text: string; color?: "red" | "cyan" | "navy" }) {
  return (
    <span className={`doc-section__badge doc-section__badge--${color ?? "cyan"}`}>
      ({text})
    </span>
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
          {section.subsections ? (
            <div className="doc-section__subsections">
              {section.subsections.map((sub) => (
                <div key={sub.id} className="doc-section__subsection">
                  <div className="doc-section__subsection-title">
                    <span>{sub.title}</span>
                    {sub.badge && <SectionBadge text={sub.badge} color={sub.badgeColor} />}
                  </div>
                  {sub.hasRiskTable && <RiskTable />}
                </div>
              ))}
            </div>
          ) : (
            <>
              {section.badge && (
                <div className="doc-section__content-badge">
                  <SectionBadge text={section.badge} color={section.badgeColor} />
                </div>
              )}
              <span className={section.completed ? "doc-section__content--completed" : "doc-section__content--pending"}>
                {section.completed ? "Sección completada." : "Aún no completado"}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default DocSectionItem;
