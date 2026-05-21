import { useCallback, useId, useRef, useState, useEffect } from "react";
import {
  X,
  Download,
  RefreshCw,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Trash2,
  Save,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import mermaid from "mermaid";
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import {
  parseGanttCode,
  serializeGanttCode,
  generateTaskId,
  type GanttData,
  type GanttTask,
} from "../../utils/ganttParser";
import "./GanttModal.css";

// Custom Mermaid Gantt theme — contrasting colors so the four task statuses
// (Normal / Activo / Hecho / Crítico) are visually distinct at a glance.
mermaid.initialize({
  startOnLoad: false,
  theme: "base",
  securityLevel: "loose",
  themeVariables: {
    // Normal task (no status)
    taskBkgColor: "#94a3b8",
    taskBorderColor: "#64748b",
    taskTextColor: "#0f172a",
    taskTextLightColor: "#0f172a",
    taskTextOutsideColor: "#0f172a",
    // Active task
    activeTaskBkgColor: "#2563eb",
    activeTaskBorderColor: "#1d4ed8",
    // Done task
    doneTaskBkgColor: "#16a34a",
    doneTaskBorderColor: "#15803d",
    // Critical task
    critBkgColor: "#dc2626",
    critBorderColor: "#991b1b",
    // Grid & axis
    gridColor: "#e5e7eb",
    sectionBkgColor: "#f8fafc",
    altSectionBkgColor: "#ffffff",
    titleColor: "#0f172a",
  },
  gantt: { useMaxWidth: true, fontSize: 12 },
});

// ─── Start-field helper ───────────────────────────────────────────────────
//
// Mermaid's task `start` accepts two forms:
//   1. a date "YYYY-MM-DD"
//   2. a dependency "after <taskId>"
//
// Free-text editing of these tokens is unfriendly — users have to memorize the
// internal task IDs (e.g. "after dev2"). Instead we render two coupled fields:
//   • a "mode" select: Dependencia | Fecha específica | Sin definir
//   • the corresponding picker (task dropdown or <input type="date">)
//
// `task.start` keeps the Mermaid-compatible string so the parser/serializer
// don't need any changes.

function parseStart(start: string): { mode: "after" | "date" | "none"; value: string } {
  if (!start) return { mode: "none", value: "" };
  const trimmed = start.trim();
  const afterMatch = trimmed.match(/^after\s+(.+)$/i);
  if (afterMatch) return { mode: "after", value: afterMatch[1].trim() };
  return { mode: "date", value: trimmed };
}

function renderStartField(
  data: GanttData,
  sectionIdx: number,
  taskIdx: number,
  task: GanttTask,
  updateTask: (s: number, t: number, f: keyof GanttTask, v: string) => void
) {
  const { mode, value } = parseStart(task.start);

  // Build the list of selectable predecessor tasks (excluding the current one
  // and tasks without an ID, which can't be referenced).
  const otherTasks = data.sections
    .flatMap((s, sI) =>
      s.tasks.map((t, tI) => ({
        ...t,
        _sectionIdx: sI,
        _taskIdx: tI,
        _sectionName: s.name,
      }))
    )
    .filter(
      (t) => t.id && !(t._sectionIdx === sectionIdx && t._taskIdx === taskIdx)
    );

  return (
    <div className="gantt-modal__start-group" title="Cuándo empieza esta tarea">
      <select
        className="gantt-modal__start-mode"
        value={mode}
        onChange={(e) => {
          const next = e.target.value as "after" | "date" | "none";
          if (next === "none") {
            updateTask(sectionIdx, taskIdx, "start", "");
          } else if (next === "after") {
            // Pre-select the first available predecessor so the field has a valid value.
            const firstId = otherTasks[0]?.id ?? "";
            updateTask(sectionIdx, taskIdx, "start", firstId ? `after ${firstId}` : "");
          } else {
            const today = new Date().toISOString().split("T")[0];
            updateTask(sectionIdx, taskIdx, "start", today);
          }
        }}
      >
        <option value="none">Sin definir</option>
        <option value="after">Después de…</option>
        <option value="date">Fecha específica</option>
      </select>

      {mode === "after" && (
        <select
          className="gantt-modal__start-task"
          value={value}
          onChange={(e) =>
            updateTask(sectionIdx, taskIdx, "start", `after ${e.target.value}`)
          }
        >
          {otherTasks.length === 0 && (
            <option value="">(sin otras tareas)</option>
          )}
          {otherTasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label} · {t._sectionName}
            </option>
          ))}
        </select>
      )}

      {mode === "date" && (
        <input
          type="date"
          className="gantt-modal__start-date"
          value={value}
          onChange={(e) =>
            updateTask(sectionIdx, taskIdx, "start", e.target.value)
          }
        />
      )}
    </div>
  );
}

interface GanttModalProps {
  source: string | null;
  isGenerating: boolean;
  error: string | null;
  onClose: () => void;
  onRegenerate: () => void;
  onSave: (newSource: string) => void;
}

export default function GanttModal({
  source,
  isGenerating,
  error,
  onClose,
  onRegenerate,
  onSave,
}: GanttModalProps) {
  const uniqueId = useId();
  const renderIdRef = useRef(0);

  // Gantt data model
  const [data, setData] = useState<GanttData>({
    title: "Plan de Implementacion",
    dateFormat: "YYYY-MM-DD",
    excludes: "weekends",
    sections: [],
  });

  // SVG rendering
  const [svgHtml, setSvgHtml] = useState("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Panel + UI state
  const [showPanel, setShowPanel] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(
    new Set()
  );
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [editingSectionIdx, setEditingSectionIdx] = useState<number | null>(
    null
  );

  const svgContainerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ReactZoomPanPinchRef>(null);

  // ─── Render Mermaid ──────────────────────────────────────────────

  const renderGantt = useCallback(
    async (code: string) => {
      if (!code.trim()) {
        setSvgHtml("");
        return;
      }
      try {
        renderIdRef.current += 1;
        const id = `gantt-${uniqueId.replace(/:/g, "")}-${renderIdRef.current}`;
        const { svg } = await mermaid.render(id, code);
        setSvgHtml(svg);
        setRenderError(null);
      } catch (err: any) {
        console.error("Mermaid render error:", err);
        setRenderError(err.message || "Error al renderizar el Gantt");
      }
    },
    [uniqueId]
  );

  // ─── Parse source on load ────────────────────────────────────────

  useEffect(() => {
    if (source) {
      const parsed = parseGanttCode(source);
      setData(parsed);
      renderGantt(source);
      setHasChanges(false);
    }
  }, [source, renderGantt]);

  // ─── Re-render on data changes ──────────────────────────────────

  const rerender = useCallback(
    (newData: GanttData) => {
      const code = serializeGanttCode(newData);
      renderGantt(code);
      setHasChanges(true);
    },
    [renderGantt]
  );

  // ─── Fix SVG sizing ─────────────────────────────────────────────
  // Ensure the SVG has a viewBox so CSS can scale it to fit the container
  // while preserving aspect ratio. We don't set inline width/height — that's
  // handled by `.gantt-modal__svg-container svg` rules in the stylesheet.

  useEffect(() => {
    if (!svgHtml || !svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector("svg");
    if (!svgEl) return;

    const viewBox = svgEl.getAttribute("viewBox");
    if (!viewBox) {
      const w = svgEl.getAttribute("width");
      const h = svgEl.getAttribute("height");
      if (w && h) {
        svgEl.setAttribute(
          "viewBox",
          `0 0 ${parseFloat(w)} ${parseFloat(h)}`
        );
      }
    }

    svgEl.removeAttribute("width");
    svgEl.removeAttribute("height");
    svgEl.style.maxHeight = "";
    svgEl.style.minHeight = "";
    svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
  }, [svgHtml]);

  // ─── Task CRUD ──────────────────────────────────────────────────

  const handleUpdateTask = (
    sectionIdx: number,
    taskIdx: number,
    field: keyof GanttTask,
    value: string
  ) => {
    const newData = { ...data, sections: data.sections.map((s) => ({ ...s, tasks: [...s.tasks] })) };
    newData.sections[sectionIdx].tasks[taskIdx] = {
      ...newData.sections[sectionIdx].tasks[taskIdx],
      [field]: value,
    };
    setData(newData);
    rerender(newData);
  };

  const handleDeleteTask = (sectionIdx: number, taskIdx: number) => {
    const newData = { ...data, sections: data.sections.map((s) => ({ ...s, tasks: [...s.tasks] })) };
    newData.sections[sectionIdx].tasks.splice(taskIdx, 1);
    setData(newData);
    rerender(newData);
  };

  const handleAddTask = (sectionIdx: number) => {
    const newData = { ...data, sections: data.sections.map((s) => ({ ...s, tasks: [...s.tasks] })) };
    const taskId = generateTaskId(newData);
    const today = new Date().toISOString().split("T")[0];
    newData.sections[sectionIdx].tasks.push({
      id: taskId,
      label: "Nueva tarea",
      status: "",
      start: today,
      duration: "5d",
    });
    setData(newData);
    rerender(newData);
  };

  // ─── Section CRUD ───────────────────────────────────────────────

  const handleAddSection = () => {
    if (!newSectionName.trim()) return;
    const newData = {
      ...data,
      sections: [
        ...data.sections,
        { name: newSectionName.trim(), tasks: [] },
      ],
    };
    setData(newData);
    rerender(newData);
    setNewSectionName("");
    setShowAddSection(false);
  };

  const handleDeleteSection = (sectionIdx: number) => {
    const newData = {
      ...data,
      sections: data.sections.filter((_, i) => i !== sectionIdx),
    };
    setData(newData);
    rerender(newData);
  };

  const handleRenameSectionConfirm = (sectionIdx: number, name: string) => {
    const newData = { ...data, sections: data.sections.map((s) => ({ ...s, tasks: [...s.tasks] })) };
    newData.sections[sectionIdx] = {
      ...newData.sections[sectionIdx],
      name: name.trim() || newData.sections[sectionIdx].name,
    };
    setData(newData);
    rerender(newData);
    setEditingSectionIdx(null);
  };

  // ─── Save ───────────────────────────────────────────────────────

  const handleSave = () => {
    const code = serializeGanttCode(data);
    onSave(code);
    setHasChanges(false);
  };

  // ─── Export helpers ─────────────────────────────────────────────

  const handleExportPng = () => {
    if (!svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector("svg");
    if (!svgEl) return;
    const clone = svgEl.cloneNode(true) as SVGElement;
    clone.setAttribute("width", String(svgEl.getBoundingClientRect().width));
    clone.setAttribute("height", String(svgEl.getBoundingClientRect().height));
    const svgData = new XMLSerializer().serializeToString(clone);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.scale(2, 2);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "gantt.png";
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;
  };

  const handleExportSvg = () => {
    if (!svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gantt.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Toggle section collapse ────────────────────────────────────

  const toggleCollapse = (idx: number) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="gantt-modal__overlay" onClick={onClose}>
      <div className="gantt-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="gantt-modal__header">
          <div className="gantt-modal__title-group">
            <CalendarDays size={20} className="gantt-modal__title-icon" />
            <span>Diagrama de Gantt</span>
          </div>
          <div className="gantt-modal__header-actions">
            {hasChanges && (
              <button className="gantt-modal__save-btn" onClick={handleSave}>
                <Save size={13} />
                Guardar
              </button>
            )}
            <button className="gantt-modal__close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="gantt-modal__body">
          {/* Loading */}
          {isGenerating && (
            <div className="gantt-modal__loading">
              <div className="gantt-modal__spinner" />
              <span className="gantt-modal__loading-text">
                Generando diagrama de Gantt...
              </span>
              <span className="gantt-modal__loading-subtext">
                Gemini está planificando tu proyecto
              </span>
            </div>
          )}

          {/* Error */}
          {error && !isGenerating && (
            <div className="gantt-modal__error">
              <div className="gantt-modal__error-icon">
                <AlertTriangle size={24} />
              </div>
              <p className="gantt-modal__error-text">{error}</p>
            </div>
          )}

          {/* Two-panel layout */}
          {!isGenerating && !error && svgHtml && (
            <>
              {/* LEFT: SVG Preview */}
              <div className="gantt-modal__preview-panel">
                <div className="gantt-modal__zoom-controls">
                  <button
                    className="gantt-modal__zoom-btn"
                    onClick={() => zoomRef.current?.zoomIn()}
                    title="Acercar"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    className="gantt-modal__zoom-btn"
                    onClick={() => zoomRef.current?.zoomOut()}
                    title="Alejar"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <button
                    className="gantt-modal__zoom-btn"
                    onClick={() => zoomRef.current?.resetTransform()}
                    title="Restablecer"
                  >
                    <Maximize2 size={16} />
                  </button>
                  <div className="gantt-modal__zoom-divider" />
                  <button
                    className={`gantt-modal__zoom-btn ${showPanel ? "gantt-modal__zoom-btn--active" : ""}`}
                    onClick={() => setShowPanel(!showPanel)}
                    title={showPanel ? "Ocultar panel" : "Mostrar panel"}
                  >
                    {showPanel ? (
                      <PanelRightClose size={16} />
                    ) : (
                      <PanelRightOpen size={16} />
                    )}
                  </button>
                </div>

                {renderError && (
                  <div className="gantt-modal__render-error">
                    <AlertTriangle size={14} />
                    <span>{renderError}</span>
                  </div>
                )}

                <TransformWrapper
                  ref={zoomRef}
                  initialScale={0.85}
                  minScale={0.2}
                  maxScale={4}
                  centerOnInit
                  wheel={{ step: 0.08 }}
                  doubleClick={{ disabled: true }}
                >
                  <TransformComponent
                    wrapperClass="gantt-modal__transform-wrapper"
                    contentClass="gantt-modal__transform-content"
                  >
                    <div
                      ref={svgContainerRef}
                      className="gantt-modal__svg-container"
                      dangerouslySetInnerHTML={{ __html: svgHtml }}
                    />
                  </TransformComponent>
                </TransformWrapper>
              </div>

              {/* RIGHT: Editor Panel */}
              {showPanel && (
                <div className="gantt-modal__editor-panel">
                  <div className="gantt-modal__section">
                    <div className="gantt-modal__section-header">
                      <span className="gantt-modal__section-title">
                        Fases ({data.sections.length})
                      </span>
                      <button
                        className="gantt-modal__add-btn"
                        onClick={() => setShowAddSection(!showAddSection)}
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {/* Add Section Form */}
                    {showAddSection && (
                      <div className="gantt-modal__add-form">
                        <div className="gantt-modal__form-row">
                          <input
                            type="text"
                            className="gantt-modal__form-input"
                            placeholder="Nombre de la fase..."
                            value={newSectionName}
                            onChange={(e) => setNewSectionName(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleAddSection()
                            }
                            autoFocus
                          />
                          <button
                            className="gantt-modal__form-submit"
                            onClick={handleAddSection}
                            disabled={!newSectionName.trim()}
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Section/Phase List */}
                    {data.sections.map((section, sIdx) => (
                      <div key={sIdx} className="gantt-modal__phase">
                        <div
                          className="gantt-modal__phase-header"
                          onClick={() => toggleCollapse(sIdx)}
                        >
                          {collapsedSections.has(sIdx) ? (
                            <ChevronRight size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                          {editingSectionIdx === sIdx ? (
                            <input
                              type="text"
                              className="gantt-modal__phase-name-input"
                              defaultValue={section.name}
                              onClick={(e) => e.stopPropagation()}
                              onBlur={(e) =>
                                handleRenameSectionConfirm(
                                  sIdx,
                                  e.target.value
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleRenameSectionConfirm(
                                    sIdx,
                                    (e.target as HTMLInputElement).value
                                  );
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <span
                              className="gantt-modal__phase-name"
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setEditingSectionIdx(sIdx);
                              }}
                            >
                              {section.name}
                            </span>
                          )}
                          <div className="gantt-modal__phase-actions">
                            <span className="gantt-modal__phase-badge">
                              {section.tasks.length}
                            </span>
                            <button
                              className="gantt-modal__delete-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSection(sIdx);
                              }}
                              title="Eliminar fase"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {!collapsedSections.has(sIdx) && (
                          <div className="gantt-modal__phase-body">
                            {section.tasks.map((task, tIdx) => (
                              <div
                                key={task.id}
                                className="gantt-modal__task-card"
                              >
                                <div className="gantt-modal__task-row">
                                  <input
                                    type="text"
                                    className="gantt-modal__task-label-input"
                                    value={task.label}
                                    onChange={(e) =>
                                      handleUpdateTask(
                                        sIdx,
                                        tIdx,
                                        "label",
                                        e.target.value
                                      )
                                    }
                                  />
                                  <button
                                    className="gantt-modal__delete-btn"
                                    onClick={() =>
                                      handleDeleteTask(sIdx, tIdx)
                                    }
                                    title="Eliminar tarea"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <div className="gantt-modal__task-meta">
                                  <select
                                    className="gantt-modal__task-select"
                                    data-status={task.status}
                                    value={task.status}
                                    onChange={(e) =>
                                      handleUpdateTask(
                                        sIdx,
                                        tIdx,
                                        "status",
                                        e.target.value
                                      )
                                    }
                                  >
                                    <option value="">Normal</option>
                                    <option value="active">Activo</option>
                                    <option value="done">Hecho</option>
                                    <option value="crit">Crítico</option>
                                  </select>
                                  <input
                                    type="text"
                                    className="gantt-modal__task-duration"
                                    value={task.duration}
                                    onChange={(e) =>
                                      handleUpdateTask(
                                        sIdx,
                                        tIdx,
                                        "duration",
                                        e.target.value
                                      )
                                    }
                                    placeholder="10d"
                                    title="Duración"
                                  />
                                  {renderStartField(
                                    data,
                                    sIdx,
                                    tIdx,
                                    task,
                                    handleUpdateTask
                                  )}
                                </div>
                              </div>
                            ))}

                            {/* Add task button */}
                            <button
                              className="gantt-modal__add-task-btn"
                              onClick={() => handleAddTask(sIdx)}
                            >
                              <Plus size={12} />
                              Agregar tarea
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {data.sections.length === 0 && (
                      <p className="gantt-modal__empty-text">
                        Sin fases definidas
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="gantt-modal__footer">
          <button
            className="gantt-modal__btn gantt-modal__btn--cancel"
            onClick={onClose}
          >
            Cerrar
          </button>
          {!isGenerating && (
            <button
              className="gantt-modal__btn gantt-modal__btn--regen"
              onClick={onRegenerate}
            >
              <RefreshCw size={14} />
              Regenerar
            </button>
          )}
          {svgHtml && (
            <>
              <button
                className="gantt-modal__btn gantt-modal__btn--danger"
                onClick={handleExportPng}
              >
                <Download size={14} />
                PNG
              </button>
              <button
                className="gantt-modal__btn gantt-modal__btn--export"
                onClick={handleExportSvg}
              >
                <Download size={14} />
                SVG
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
