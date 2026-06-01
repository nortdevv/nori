import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  X,
  Download,
  RefreshCw,
  Network,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Trash2,
  Save,
  ArrowRight,
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
  parseDependencyCode,
  serializeDependencyCode,
  allActivities,
  generateActivityId,
  generatePhaseId,
  type DependencyData,
} from "../../utils/dependencyParser";
import { getErrorMessage } from "../../lib/utils";
import "./DependencyModal.css";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  flowchart: { htmlLabels: true, curve: "basis" },
});

interface DependencyModalProps {
  source: string | null;
  isGenerating: boolean;
  error: string | null;
  onClose: () => void;
  onRegenerate: () => void;
  onSave: (newSource: string) => void;
}

const EMPTY_DATA: DependencyData = { direction: "LR", phases: [], dependencies: [] };

function cloneData(d: DependencyData): DependencyData {
  return {
    direction: d.direction,
    phases: d.phases.map((p) => ({ ...p, activities: p.activities.map((a) => ({ ...a })) })),
    dependencies: d.dependencies.map((dep) => ({ ...dep })),
  };
}

export default function DependencyModal({
  source,
  isGenerating,
  error,
  onClose,
  onRegenerate,
  onSave,
}: DependencyModalProps) {
  const uniqueId = useId();
  const renderIdRef = useRef(0);

  const [data, setData] = useState<DependencyData>(EMPTY_DATA);

  // SVG rendering
  const [svgHtml, setSvgHtml] = useState("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Panel + UI state
  const [showPanel, setShowPanel] = useState(true);
  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(new Set());
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);

  // Dependency add form
  const [showAddDep, setShowAddDep] = useState(false);
  const [newDepFrom, setNewDepFrom] = useState("");
  const [newDepTo, setNewDepTo] = useState("");

  const svgContainerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ReactZoomPanPinchRef>(null);

  // ─── Render Mermaid ──────────────────────────────────────────────

  const renderDiagram = useCallback(
    async (code: string) => {
      if (!code.trim()) {
        setSvgHtml("");
        return;
      }
      try {
        setRenderError(null);
        renderIdRef.current += 1;
        const renderId = `dep-${uniqueId.replace(/:/g, "")}-${renderIdRef.current}`;
        const oldEl = document.getElementById(renderId);
        if (oldEl) oldEl.remove();
        const { svg } = await mermaid.render(renderId, code);
        setSvgHtml(svg);
      } catch (err: unknown) {
        console.error("Mermaid render error:", err);
        setRenderError(getErrorMessage(err, "Error de sintaxis en el diagrama"));
      }
    },
    [uniqueId]
  );

  // ─── Parse source on load ────────────────────────────────────────

  useEffect(() => {
    if (source) {
      const parsed = parseDependencyCode(source);
      setData(parsed);
      renderDiagram(serializeDependencyCode(parsed));
      setHasChanges(false);
    }
  }, [source, renderDiagram]);

  // ─── Re-render on data changes ──────────────────────────────────

  const rerender = useCallback(
    (newData: DependencyData) => {
      renderDiagram(serializeDependencyCode(newData));
      setHasChanges(true);
    },
    [renderDiagram]
  );

  // ─── Fix SVG sizing ─────────────────────────────────────────────

  useEffect(() => {
    if (!svgHtml || !svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector("svg");
    if (!svgEl) return;
    const viewBox = svgEl.getAttribute("viewBox");
    if (!viewBox) {
      const w = svgEl.getAttribute("width");
      const h = svgEl.getAttribute("height");
      if (w && h) {
        svgEl.setAttribute("viewBox", `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
      }
    }
    svgEl.removeAttribute("width");
    svgEl.removeAttribute("height");
    svgEl.style.width = "100%";
    svgEl.style.height = "auto";
    svgEl.style.maxHeight = "none";
    svgEl.style.minHeight = "350px";
  }, [svgHtml]);

  // ─── Phase CRUD ─────────────────────────────────────────────────

  const handleAddPhase = () => {
    if (!newPhaseName.trim()) return;
    const next = cloneData(data);
    next.phases.push({ id: generatePhaseId(next), name: newPhaseName.trim(), activities: [] });
    setData(next);
    rerender(next);
    setNewPhaseName("");
    setShowAddPhase(false);
  };

  const handleDeletePhase = (phaseId: string) => {
    const next = cloneData(data);
    const removed = next.phases.find((p) => p.id === phaseId);
    const removedIds = new Set(removed?.activities.map((a) => a.id) ?? []);
    next.phases = next.phases.filter((p) => p.id !== phaseId);
    next.dependencies = next.dependencies.filter(
      (d) => !removedIds.has(d.from) && !removedIds.has(d.to)
    );
    setData(next);
    rerender(next);
  };

  const handleRenamePhase = (phaseId: string, name: string) => {
    const next = cloneData(data);
    const phase = next.phases.find((p) => p.id === phaseId);
    if (phase) phase.name = name.trim() || phase.name;
    setData(next);
    rerender(next);
    setEditingPhaseId(null);
  };

  // ─── Activity CRUD ──────────────────────────────────────────────

  const handleAddActivity = (phaseId: string) => {
    const next = cloneData(data);
    const phase = next.phases.find((p) => p.id === phaseId);
    if (!phase) return;
    phase.activities.push({ id: generateActivityId(next), label: "Nueva actividad" });
    setData(next);
    rerender(next);
  };

  const handleActivityLabelChange = (phaseId: string, activityId: string, label: string) => {
    // Update state on each keystroke; defer the (expensive) re-render to blur.
    setData((prev) => {
      const next = cloneData(prev);
      const phase = next.phases.find((p) => p.id === phaseId);
      const activity = phase?.activities.find((a) => a.id === activityId);
      if (activity) activity.label = label;
      return next;
    });
  };

  const handleDeleteActivity = (phaseId: string, activityId: string) => {
    const next = cloneData(data);
    const phase = next.phases.find((p) => p.id === phaseId);
    if (phase) phase.activities = phase.activities.filter((a) => a.id !== activityId);
    next.dependencies = next.dependencies.filter(
      (d) => d.from !== activityId && d.to !== activityId
    );
    setData(next);
    rerender(next);
  };

  // ─── Dependency CRUD ────────────────────────────────────────────

  const handleAddDependency = () => {
    if (!newDepFrom || !newDepTo || newDepFrom === newDepTo) return;
    const exists = data.dependencies.some((d) => d.from === newDepFrom && d.to === newDepTo);
    if (exists) {
      setNewDepFrom("");
      setNewDepTo("");
      setShowAddDep(false);
      return;
    }
    const next = cloneData(data);
    next.dependencies.push({ from: newDepFrom, to: newDepTo });
    setData(next);
    rerender(next);
    setNewDepFrom("");
    setNewDepTo("");
    setShowAddDep(false);
  };

  const handleDeleteDependency = (index: number) => {
    const next = cloneData(data);
    next.dependencies.splice(index, 1);
    setData(next);
    rerender(next);
  };

  // ─── Save ───────────────────────────────────────────────────────

  const handleSave = () => {
    onSave(serializeDependencyCode(data));
    setHasChanges(false);
  };

  // ─── Toggle phase collapse ──────────────────────────────────────

  const toggleCollapse = (phaseId: string) => {
    setCollapsedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  };

  // ─── Downloads ──────────────────────────────────────────────────

  const handleDownloadPng = () => {
    if (!svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector("svg");
    if (!svgEl) return;
    const clone = svgEl.cloneNode(true) as SVGElement;
    const viewBox = svgEl.getAttribute("viewBox");
    if (viewBox) {
      const parts = viewBox.split(" ").map(Number);
      clone.setAttribute("width", String(parts[2]));
      clone.setAttribute("height", String(parts[3]));
    }
    const svgData = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth * 2;
      canvas.height = img.naturalHeight * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = "diagrama-dependencias.png";
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleDownloadSvg = () => {
    if (!svgHtml) return;
    const blob = new Blob([svgHtml], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagrama-dependencias.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Render ─────────────────────────────────────────────────────

  const activities = allActivities(data);
  const activityLabel = (id: string) => activities.find((a) => a.id === id)?.label || id;

  return (
    <div className="dependency-modal-overlay" onClick={onClose}>
      <div className="dependency-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="dependency-modal__header">
          <span className="dependency-modal__title">
            <Network size={18} color="#ec0029" />
            Diagrama de Dependencias
          </span>
          <div className="dependency-modal__header-actions">
            {hasChanges && (
              <button className="dependency-modal__save-btn" onClick={handleSave}>
                <Save size={14} />
                Guardar
              </button>
            )}
            <button className="dependency-modal__close" onClick={onClose} aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="dependency-modal__body">
          {/* Loading */}
          {isGenerating && (
            <div className="dependency-modal__loading">
              <div className="dependency-modal__spinner" />
              <span className="dependency-modal__loading-text">
                Generando diagrama de dependencias...
              </span>
              <span className="dependency-modal__loading-subtext">
                Gemini está ordenando las actividades del proyecto
              </span>
            </div>
          )}

          {/* Error */}
          {error && !isGenerating && (
            <div className="dependency-modal__error">
              <div className="dependency-modal__error-icon">
                <AlertTriangle size={24} />
              </div>
              <p className="dependency-modal__error-text">{error}</p>
            </div>
          )}

          {/* Two-panel layout */}
          {!isGenerating && !error && svgHtml && (
            <>
              {/* LEFT: SVG Preview */}
              <div className="dependency-modal__preview-panel">
                <div className="dependency-modal__zoom-controls">
                  <button
                    className="dependency-modal__zoom-btn"
                    onClick={() => zoomRef.current?.zoomIn()}
                    title="Acercar"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    className="dependency-modal__zoom-btn"
                    onClick={() => zoomRef.current?.zoomOut()}
                    title="Alejar"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <button
                    className="dependency-modal__zoom-btn"
                    onClick={() => zoomRef.current?.resetTransform()}
                    title="Restablecer"
                  >
                    <Maximize2 size={16} />
                  </button>
                  <div className="dependency-modal__zoom-divider" />
                  <button
                    className={`dependency-modal__zoom-btn ${showPanel ? "dependency-modal__zoom-btn--active" : ""}`}
                    onClick={() => setShowPanel(!showPanel)}
                    title={showPanel ? "Ocultar panel" : "Mostrar panel"}
                  >
                    {showPanel ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                  </button>
                </div>

                {renderError && (
                  <div className="dependency-modal__render-error">
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
                    wrapperClass="dependency-modal__transform-wrapper"
                    contentClass="dependency-modal__transform-content"
                  >
                    <div
                      ref={svgContainerRef}
                      className="dependency-modal__svg-container"
                      dangerouslySetInnerHTML={{ __html: svgHtml }}
                    />
                  </TransformComponent>
                </TransformWrapper>
              </div>

              {/* RIGHT: Editor Panel */}
              {showPanel && (
                <div className="dependency-modal__editor-panel">
                  {/* Phases + Activities */}
                  <div className="dependency-modal__section">
                    <div className="dependency-modal__section-header">
                      <span className="dependency-modal__section-title">
                        Fases ({data.phases.length})
                      </span>
                      <button
                        className="dependency-modal__add-btn"
                        onClick={() => setShowAddPhase(!showAddPhase)}
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {showAddPhase && (
                      <div className="dependency-modal__add-form">
                        <div className="dependency-modal__form-row">
                          <input
                            type="text"
                            className="dependency-modal__input"
                            placeholder="Nombre de la fase..."
                            value={newPhaseName}
                            onChange={(e) => setNewPhaseName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddPhase()}
                            autoFocus
                          />
                          <button
                            className="dependency-modal__form-submit"
                            onClick={handleAddPhase}
                            disabled={!newPhaseName.trim()}
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    )}

                    {data.phases.map((phase) => (
                      <div key={phase.id} className="dependency-modal__phase">
                        <div
                          className="dependency-modal__phase-header"
                          onClick={() => toggleCollapse(phase.id)}
                        >
                          {collapsedPhases.has(phase.id) ? (
                            <ChevronRight size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                          {editingPhaseId === phase.id ? (
                            <input
                              type="text"
                              className="dependency-modal__phase-name-input"
                              defaultValue={phase.name}
                              onClick={(e) => e.stopPropagation()}
                              onBlur={(e) => handleRenamePhase(phase.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleRenamePhase(phase.id, (e.target as HTMLInputElement).value);
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <span
                              className="dependency-modal__phase-name"
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setEditingPhaseId(phase.id);
                              }}
                            >
                              {phase.name}
                            </span>
                          )}
                          <div className="dependency-modal__phase-actions">
                            <span className="dependency-modal__phase-badge">
                              {phase.activities.length}
                            </span>
                            <button
                              className="dependency-modal__delete-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePhase(phase.id);
                              }}
                              title="Eliminar fase"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {!collapsedPhases.has(phase.id) && (
                          <div className="dependency-modal__phase-body">
                            {phase.activities.map((activity) => (
                              <div key={activity.id} className="dependency-modal__activity-card">
                                <input
                                  type="text"
                                  className="dependency-modal__activity-input"
                                  value={activity.label}
                                  onChange={(e) =>
                                    handleActivityLabelChange(phase.id, activity.id, e.target.value)
                                  }
                                  onBlur={() => rerender(data)}
                                />
                                <button
                                  className="dependency-modal__delete-btn"
                                  onClick={() => handleDeleteActivity(phase.id, activity.id)}
                                  title="Eliminar actividad"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                            <button
                              className="dependency-modal__add-activity-btn"
                              onClick={() => handleAddActivity(phase.id)}
                            >
                              <Plus size={12} />
                              Agregar actividad
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {data.phases.length === 0 && (
                      <p className="dependency-modal__empty-text">Sin fases definidas</p>
                    )}
                  </div>

                  {/* Dependencies */}
                  <div className="dependency-modal__section">
                    <div className="dependency-modal__section-header">
                      <span className="dependency-modal__section-title">
                        Dependencias ({data.dependencies.length})
                      </span>
                      <button
                        className="dependency-modal__add-btn"
                        onClick={() => setShowAddDep(!showAddDep)}
                        disabled={activities.length < 2}
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {showAddDep && (
                      <div className="dependency-modal__add-form">
                        <div className="dependency-modal__form-row">
                          <select
                            className="dependency-modal__select"
                            value={newDepFrom}
                            onChange={(e) => setNewDepFrom(e.target.value)}
                          >
                            <option value="">Antes...</option>
                            {activities.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.label}
                              </option>
                            ))}
                          </select>
                          <ArrowRight size={16} className="dependency-modal__arrow-icon" />
                          <select
                            className="dependency-modal__select"
                            value={newDepTo}
                            onChange={(e) => setNewDepTo(e.target.value)}
                          >
                            <option value="">Después...</option>
                            {activities.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          className="dependency-modal__form-submit"
                          onClick={handleAddDependency}
                          disabled={!newDepFrom || !newDepTo || newDepFrom === newDepTo}
                        >
                          Agregar dependencia
                        </button>
                      </div>
                    )}

                    <div className="dependency-modal__dep-list">
                      {data.dependencies.map((dep, i) => (
                        <div key={`${dep.from}-${dep.to}-${i}`} className="dependency-modal__dep-row">
                          <span className="dependency-modal__dep-text">
                            <strong>{activityLabel(dep.from)}</strong>
                            {" → "}
                            <strong>{activityLabel(dep.to)}</strong>
                          </span>
                          <button
                            className="dependency-modal__delete-btn"
                            onClick={() => handleDeleteDependency(i)}
                            title="Eliminar dependencia"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      {data.dependencies.length === 0 && (
                        <p className="dependency-modal__empty-text">Sin dependencias</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="dependency-modal__footer">
          <button className="dependency-modal__btn dependency-modal__btn--cancel" onClick={onClose}>
            Cerrar
          </button>
          <button
            className="dependency-modal__btn dependency-modal__btn--regenerate"
            onClick={onRegenerate}
            disabled={isGenerating}
          >
            <RefreshCw size={16} />
            Regenerar
          </button>
          <button
            className="dependency-modal__btn dependency-modal__btn--download"
            onClick={handleDownloadPng}
            disabled={!svgHtml || isGenerating}
          >
            <Download size={16} />
            PNG
          </button>
          <button
            className="dependency-modal__btn dependency-modal__btn--download-alt"
            onClick={handleDownloadSvg}
            disabled={!svgHtml || isGenerating}
          >
            <Download size={16} />
            SVG
          </button>
        </div>
      </div>
    </div>
  );
}
