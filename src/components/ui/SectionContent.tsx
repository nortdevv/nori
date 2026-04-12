import React from "react";
import "../../pages/Chat.css";

const LABEL_MAP: Record<string, string> = {
  cr: "CR",
  dga: "DGA",
  email: "Información de contacto",
  solicitante: "Solicitante",
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
  beneficios: "Beneficios",
  otros_beneficios: "Otros beneficios",
  usuarios_objetivo: "Usuarios objetivo",
  areas_impactadas: "Áreas impactadas",
  area_negocio: "Área de Negocio",
  procesos_impactados: "Procesos impactados y descripción del impacto",
  requerimientos_funcionales: "Requerimientos funcionales",
  requerimientos_no_funcionales: "Requerimientos no funcionales",
  criterios_aceptacion: "Criterios de aceptación",
  dependencias: "Dependencias",
  riesgo: "Riesgo",
  probable_perdida: "Probable Pérdida",
  justificacion_riesgo: "Justificación",
};

// Function to format keys into human-readable labels, if not in map remove _ and capitalize first letter
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
// Render a table from an array of objects
function TableFromArray({ rows }: { rows: Record<string, any>[] }) {
  const columns = Object.keys(rows[0]);
  return (
    <table className="sc-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col}>{formatLabel(col)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map((col) => (
              <td key={col}>{String(row[col] ?? "—")}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

//2 column table
function KeyValueTable({ data }: { data: Record<string, any> }) {
  return (
    <table className="sc-kv-table">
      <tbody>
        {Object.entries(data).map(([key, value]) => (
          <tr key={key}>
            <td>{formatLabel(key)}</td>
            <td>{String(value ?? "—")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

//different render if value is array, object or text
function FieldBlock({ fieldKey, value }: { fieldKey: string; value: any }) {
  if (isTableArray(value)) {
    return (
      <div className="sc-field">
        <div className="sc-label">{formatLabel(fieldKey)}</div>
        <TableFromArray rows={value} />
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div className="sc-field">
        <div className="sc-label">{formatLabel(fieldKey)}</div>
        <ul className="sc-list">
          {value.map((item, i) => (
            <li key={i}>
              {typeof item === "object" ? JSON.stringify(item) : String(item)}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (typeof value === "object" && value !== null) {
    return (
      <div className="sc-field">
        <div className="sc-label">{formatLabel(fieldKey)}</div>
        <KeyValueTable data={value} />
      </div>
    );
  }

  return (
    <div className="sc-field">
      <div className="sc-label">{formatLabel(fieldKey)}</div>
      <p className="sc-value">{String(value)}</p>
    </div>
  );
}

interface SectionContentProps {
  sectionId: number;
  content: any;
}

// Main component to render section content based on its type
export default function SectionContent({
  sectionId,
  content,
}: SectionContentProps) {
  if (!content) return null;

  let parsed: any = content;
  if (typeof content === "string") {
    const trimmed = content.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        parsed = null;
      }
    }
  }

  if (!parsed) {
    return <p className="sc-plain">{content}</p>;
  }
  //section 0, 2 column table
  if (sectionId === 0 && typeof parsed === "object" && !Array.isArray(parsed)) {
    return <KeyValueTable data={parsed} />;
  }

  if (Array.isArray(parsed)) {
    return isTableArray(parsed) ? (
      <TableFromArray rows={parsed} />
    ) : (
      <ul className="sc-list">
        {parsed.map((item, i) => (
          <li key={i}>{String(item)}</li>
        ))}
      </ul>
    );
  }

  const entries = Object.entries(parsed);
  return (
    <div>
      {entries.map(([key, value], idx) => (
        <React.Fragment key={key}>
          <FieldBlock fieldKey={key} value={value} />
          {idx < entries.length - 1 && <hr className="sc-divider" />}
        </React.Fragment>
      ))}
    </div>
  );
}
