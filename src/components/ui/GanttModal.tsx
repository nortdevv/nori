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

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  gantt: { useMaxWidth: true, fontSize: 12 },
});

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

  useEffect(() => {
    if (!svgHtml || !svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector("svg");
    if (!svgEl) return;
    const viewBox = svgEl.getAttribute("viewBox");
    if (viewBox) {
      svgEl.removeAttribute("width");
      svgEl.style.width = "100%";
      svgEl.style.height = "auto";
      svgEl.style.maxHeight = "none";
      svgEl.style.minHeight = "350px";
    } else {
      const w = svgEl.getAttribute("width");
      const h = svgEl.getAttribute("height");
      if (w && h) {
        svgEl.setAttribute(
          "viewBox",
          `0 0 ${parseFloat(w)} ${parseFloat(h)}`
        );
        svgEl.removeAttribute("width");
        svgEl.removeAttribute("height");
        svgEl.style.width = "100%";
        svgEl.style.height = "auto";
        svgEl.style.minHeight = "350px";
      }
    }
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
                                    <option value="done">Hecho</option>
                                    <option value="active">Activo</option>
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
                                  <input
                                    type="text"
                                    className="gantt-modal__task-start"
                                    value={task.start}
                                    onChange={(e) =>
                                      handleUpdateTask(
                                        sIdx,
                                        tIdx,
                                        "start",
                                        e.target.value
                                      )
                                    }
                                    placeholder="2025-01-01 o after id"
                                    title="Inicio"
                                  />
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
