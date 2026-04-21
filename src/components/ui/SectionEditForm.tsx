import React from "react";

const LABEL_MAP: Record<string, string> = {
  cr: "CR",
  dga: "DGA",
  email: "Información de contacto",
  iniciativa: "Iniciativa",
  solicitante: "Solicitante",
  sponsor: "Patrocinador",
  prioridad: "Prioridad",
  telefono: "Teléfono",
  cargo: "Cargo",
  area: "DGA",
  socio_negocio_interno: "Socio de Negocio Interno",
  fecha_inicio_estimada: "Fecha de inicio estimada",
  business_case: "Caso de negocio (Business case)",
  patrocinador: "Patrocinador",
  socio_negocio: "Nombre del Socio de Negocio",
  tipo_iniciativa: "Tipo de la iniciativa",
  nombre_iniciativa: "Nombre de la iniciativa",
  descripcion: "Descripción",
  justificacion: "Justificación",
  contexto_estrategico: "Contexto estratégico",
  objetivo_principal: "Objetivo principal",
  objetivos_especificos: "Objetivos específicos",
  objetivo: "Objetivo",
  alcance: "Alcance",
  exclusiones: "Exclusiones",
  restricciones: "Restricciones",
  supuestos: "Supuestos",
  riesgos: "Riesgos",
  areas: "Áreas",
  beneficios: "Beneficios",
  otros_beneficios: "Otros beneficios",
  usuarios_objetivo: "Usuarios objetivo",
  areas_impactadas: "Áreas impactadas",
  area_negocio: "Área de Negocio",
  procesos_impactados: "Procesos impactados",
  tipo_impacto: "Tipo de impacto",
  requiere_coordinacion: "Requiere coordinación",
  requerimientos_funcionales: "Requerimientos funcionales",
  requerimientos_no_funcionales: "Requerimientos no funcionales",
  criterios_aceptacion: "Criterios de aceptación",
  dependencias: "Dependencias",
  riesgo: "Riesgo",
  probable_perdida: "Probable Pérdida",
  justificacion_riesgo: "Justificación",
};

function formatLabel(key: string): string {
  const fallback = key.replace(/_/g, " ");
  return LABEL_MAP[key] ?? fallback.charAt(0).toUpperCase() + fallback.slice(1);
}

function isTableArray(value: any): value is Record<string, any>[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === "object" &&
    value[0] !== null
  );
}

// Render a table from an array of objects, each cell is editable
function EditableTable({
  rows,
  onChange,
  disabled,
}: {
  rows: Record<string, any>[];
  onChange: (rows: Record<string, any>[]) => void;
  disabled: boolean;
}) {
  const columns = Object.keys(rows[0]);

  const handleCellChange = (rowIdx: number, col: string, value: string) => {
    const updated = rows.map((row, i) =>
      i === rowIdx ? { ...row, [col]: value } : row,
    );
    onChange(updated);
  };

  return (
    <table className="doc-section__edit-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col} className="doc-section__edit-table-th">
              {formatLabel(col)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIdx) => (
          <tr key={rowIdx}>
            {columns.map((col) => (
              <td key={col} className="doc-section__edit-table-td">
                <textarea
                  className="doc-section__edit-cell"
                  value={String(row[col] ?? "")}
                  onChange={(e) =>
                    handleCellChange(rowIdx, col, e.target.value)
                  }
                  ref={(el) => {
                    if (el) {
                      el.style.height = "auto";
                      el.style.height = el.scrollHeight + "px";
                    }
                  }}
                  onInput={(e) => {
                    const t = e.currentTarget;
                    t.style.height = "auto";
                    t.style.height = t.scrollHeight + "px";
                  }}
                  disabled={disabled}
                  rows={1}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EditableField({
  fieldKey,
  value,
  onChange,
  disabled,
}: {
  fieldKey: string;
  value: any;
  onChange: (newVal: any) => void;
  disabled: boolean;
}) {
  if (isTableArray(value)) {
    return (
      <div className="doc-section__edit-field">
        <div className="doc-section__edit-label">{formatLabel(fieldKey)}</div>
        <EditableTable rows={value} onChange={onChange} disabled={disabled} />
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div className="doc-section__edit-field">
        <div className="doc-section__edit-label">{formatLabel(fieldKey)}</div>
        <textarea
          className="doc-section__textarea"
          value={value.join("\n")}
          onChange={(e) =>
            onChange(e.target.value === "" ? [] : e.target.value.split("\n"))
          }
          disabled={disabled}
          rows={Math.max(3, value.length + 1)}
        />
      </div>
    );
  }

  if (typeof value === "string" || typeof value === "number") {
    const str = String(value);
    return (
      <div className="doc-section__edit-field">
        <div className="doc-section__edit-label">{formatLabel(fieldKey)}</div>
        {str.length > 80 ? (
          <textarea
            className="doc-section__textarea"
            value={str}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rows={Math.max(3, Math.ceil(str.length / 80))}
          />
        ) : (
          <input
            className="doc-section__edit-input"
            value={str}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        )}
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <div className="doc-section__edit-field doc-section__edit-field--inline">
        <div className="doc-section__edit-label">{formatLabel(fieldKey)}</div>
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
      </div>
    );
  }

  if (typeof value === "object" && value !== null) {
    return (
      <div className="doc-section__edit-field">
        <div className="doc-section__edit-label">{formatLabel(fieldKey)}</div>
        <div className="doc-section__edit-nested">
          {Object.entries(value).map(([k, v]) => (
            <EditableField
              key={k}
              fieldKey={k}
              value={v}
              onChange={(newV) => onChange({ ...value, [k]: newV })}
              disabled={disabled}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
}

interface SectionEditFormProps {
  draft: any;
  onChange: (newDraft: any) => void;
  disabled: boolean;
}

export default function SectionEditForm({
  draft,
  onChange,
  disabled,
}: SectionEditFormProps) {
  if (draft === null || draft === undefined) return null;

  if (typeof draft === "string") {
    return (
      <textarea
        className="doc-section__textarea"
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={4}
      />
    );
  }

  if (isTableArray(draft)) {
    return (
      <EditableTable rows={draft} onChange={onChange} disabled={disabled} />
    );
  }

  if (typeof draft === "object" && !Array.isArray(draft)) {
    const entries = Object.entries(draft);
    return (
      <div>
        {entries.map(([key, value], idx) => (
          <React.Fragment key={key}>
            <EditableField
              fieldKey={key}
              value={value}
              onChange={(newVal) => onChange({ ...draft, [key]: newVal })}
              disabled={disabled}
            />
            {idx < entries.length - 1 && (
              <hr className="doc-section__edit-divider" />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  return null;
}
