import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  X,
  Download,
  RefreshCw,
  GitBranch,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Trash2,
  Save,
  ArrowRight,
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
  parseMermaidCode,
  serializeMermaidCode,
  generateNodeId,
  SHAPE_LABELS,
  type DiagramNode,
  type DiagramEdge,
  type NodeShape,
} from "../../utils/diagramParser";
import { getErrorMessage } from "../../lib/utils";
import "./DiagramModal.css";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  flowchart: { htmlLabels: true, curve: "basis" },
});

const NODE_COLORS = [
  { name: "Default", value: "" },
  { name: "Rojo", value: "#ec0029" },
  { name: "Azul", value: "#3b82f6" },
  { name: "Verde", value: "#22c55e" },
  { name: "Morado", value: "#8b5cf6" },
  { name: "Naranja", value: "#f97316" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Cian", value: "#06b6d4" },
  { name: "Gris", value: "#6b7280" },
];

const SHAPES: NodeShape[] = [
  "rect",
  "rounded",
  "stadium",
  "cylinder",
  "hexagon",
  "circle",
];

interface DiagramModalProps {
  source: string | null;
  isGenerating: boolean;
  error: string | null;
  onClose: () => void;
  onRegenerate: () => void;
  onSave: (newSource: string) => void;
}

function DiagramModal({
  source,
  isGenerating,
  error,
  onClose,
  onRegenerate,
  onSave,
}: DiagramModalProps) {
  const uniqueId = useId();
  const renderIdRef = useRef(0);

  // Diagram data model
  const [nodes, setNodes] = useState<DiagramNode[]>([]);
  const [edges, setEdges] = useState<DiagramEdge[]>([]);

  // SVG rendering
  const [svgHtml, setSvgHtml] = useState("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Add forms
  const [showAddNode, setShowAddNode] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodeShape, setNewNodeShape] = useState<NodeShape>("rect");
  const [newNodeColor, setNewNodeColor] = useState("");

  const [showAddEdge, setShowAddEdge] = useState(false);
  const [newEdgeFrom, setNewEdgeFrom] = useState("");
  const [newEdgeTo, setNewEdgeTo] = useState("");
  const [newEdgeLabel, setNewEdgeLabel] = useState("");

  // Editing node
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [colorPickerNodeId, setColorPickerNodeId] = useState<string | null>(null);

  // Panel toggle
  const [showPanel, setShowPanel] = useState(true);

  // SVG node click color picker
  const [svgColorPicker, setSvgColorPicker] = useState<{
    nodeId: string;
    x: number;
    y: number;
  } | null>(null);

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
        const renderId = `mermaid-${uniqueId.replace(/:/g, "")}-${renderIdRef.current}`;
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
      const data = parseMermaidCode(source);
      setNodes(data.nodes);
      setEdges(data.edges);
      // Serializar de inmediato para que el render inicial coincida con la estructura de edición.
      // Esto evita que el layout se rompa o se resetee de golpe en la primera edición de color.
      const initialCode = serializeMermaidCode(data);
      renderDiagram(initialCode);
      setHasChanges(false);
    }
  }, [source, renderDiagram]);

  // ─── Re-render on data changes ──────────────────────────────────

  const rerender = useCallback(
    (newNodes: DiagramNode[], newEdges: DiagramEdge[]) => {
      const code = serializeMermaidCode({ nodes: newNodes, edges: newEdges });
      renderDiagram(code);
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
        svgEl.setAttribute("viewBox", `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
        svgEl.removeAttribute("width");
        svgEl.removeAttribute("height");
        svgEl.style.width = "100%";
        svgEl.style.height = "auto";
        svgEl.style.minHeight = "350px";
      }
    }
  }, [svgHtml]);

  // ─── SVG node click handler (event delegation) ──────────────────

  const handleSvgClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as Element;
      const nodeEl = target.closest(".node");
      if (!nodeEl) {
        setSvgColorPicker(null);
        return;
      }
      // Extract node ID — Mermaid generates ids like "flowchart-NODEID-123"
      const elId = nodeEl.getAttribute("id") || "";
      const match = elId.match(/flowchart-(\w+)-\d+/);
      const nodeId = match ? match[1] : elId;
      if (nodeId && nodes.some((n) => n.id === nodeId)) {
        const rect = nodeEl.getBoundingClientRect();
        const modalEl = svgContainerRef.current?.closest(".diagram-modal");
        if (!modalEl) return;
        const modalRect = modalEl.getBoundingClientRect();
        setSvgColorPicker({
          nodeId,
          x: rect.left + rect.width / 2 - modalRect.left,
          y: rect.bottom - modalRect.top + 8,
        });
      }
    },
    [nodes]
  );

  // ─── Node CRUD ──────────────────────────────────────────────────

  const handleAddNode = () => {
    if (!newNodeLabel.trim()) return;
    const id = generateNodeId(nodes);
    const newNode: DiagramNode = {
      id,
      label: newNodeLabel.trim(),
      shape: newNodeShape,
      color: newNodeColor || null,
    };
    const updated = [...nodes, newNode];
    setNodes(updated);
    rerender(updated, edges);
    setNewNodeLabel("");
    setNewNodeShape("rect");
    setNewNodeColor("");
    setShowAddNode(false);
  };

  const handleDeleteNode = (nodeId: string) => {
    const updatedNodes = nodes.filter((n) => n.id !== nodeId);
    const updatedEdges = edges.filter(
      (e) => e.from !== nodeId && e.to !== nodeId
    );
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    rerender(updatedNodes, updatedEdges);
  };

  const handleUpdateNode = (
    nodeId: string,
    field: keyof DiagramNode,
    value: string
  ) => {
    const updated = nodes.map((n) =>
      n.id === nodeId
        ? { ...n, [field]: field === "color" ? value || null : value }
        : n
    );
    setNodes(updated);
    // Debounce rendering for label changes
    if (field !== "label") {
      rerender(updated, edges);
    }
  };

  const handleNodeLabelBlur = () => {
    setEditingNodeId(null);
    rerender(nodes, edges);
  };

  const handleNodeLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setEditingNodeId(null);
      rerender(nodes, edges);
    }
  };

  // ─── Edge CRUD ──────────────────────────────────────────────────

  const handleAddEdge = () => {
    if (!newEdgeFrom || !newEdgeTo || newEdgeFrom === newEdgeTo) return;
    const newEdge: DiagramEdge = {
      from: newEdgeFrom,
      to: newEdgeTo,
      label: newEdgeLabel.trim(),
    };
    const updated = [...edges, newEdge];
    setEdges(updated);
    rerender(nodes, updated);
    setNewEdgeFrom("");
    setNewEdgeTo("");
    setNewEdgeLabel("");
    setShowAddEdge(false);
  };

  const handleDeleteEdge = (index: number) => {
    const updated = edges.filter((_, i) => i !== index);
    setEdges(updated);
    rerender(nodes, updated);
  };

  // ─── Save ───────────────────────────────────────────────────────

  const handleSave = () => {
    const code = serializeMermaidCode({ nodes, edges });
    onSave(code);
    setHasChanges(false);
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
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
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
      a.download = "diagrama-arquitectura.png";
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
    a.download = "diagrama-arquitectura.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Render ─────────────────────────────────────────────────────

  const getNodeLabel = (nodeId: string) =>
    nodes.find((n) => n.id === nodeId)?.label || nodeId;

  return (
    <div className="diagram-modal-overlay" onClick={onClose}>
      <div
        className="diagram-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="diagram-modal__header">
          <span className="diagram-modal__title">
            <GitBranch size={18} color="#ec0029" />
            Diagrama de Arquitectura
          </span>
          <div className="diagram-modal__header-actions">
            {hasChanges && (
              <button className="diagram-modal__save-btn" onClick={handleSave}>
                <Save size={14} />
                Guardar
              </button>
            )}
            <button
              className="diagram-modal__close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="diagram-modal__body">
          {/* Loading */}
          {isGenerating && (
            <div className="diagram-modal__loading">
              <div className="diagram-modal__spinner" />
              <span className="diagram-modal__loading-text">
                Generando diagrama de arquitectura...
              </span>
              <span className="diagram-modal__loading-subtext">
                Gemini está analizando tus requerimientos
              </span>
            </div>
          )}

          {/* Error */}
          {error && !isGenerating && (
            <div className="diagram-modal__error">
              <div className="diagram-modal__error-icon">
                <AlertTriangle size={24} />
              </div>
              <p className="diagram-modal__error-text">{error}</p>
            </div>
          )}

          {/* Two-panel layout */}
          {!isGenerating && !error && svgHtml && (
            <>
              {/* LEFT: SVG Preview */}
              <div className="diagram-modal__preview-panel">
                <div className="diagram-modal__zoom-controls">
                  <button
                    className="diagram-modal__zoom-btn"
                    onClick={() => zoomRef.current?.zoomIn()}
                    title="Acercar"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    className="diagram-modal__zoom-btn"
                    onClick={() => zoomRef.current?.zoomOut()}
                    title="Alejar"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <button
                    className="diagram-modal__zoom-btn"
                    onClick={() => zoomRef.current?.resetTransform()}
                    title="Restablecer"
                  >
                    <Maximize2 size={16} />
                  </button>
                  <div className="diagram-modal__zoom-divider" />
                  <button
                    className={`diagram-modal__zoom-btn ${showPanel ? 'diagram-modal__zoom-btn--active' : ''}`}
                    onClick={() => setShowPanel(!showPanel)}
                    title={showPanel ? 'Ocultar panel' : 'Mostrar panel'}
                  >
                    {showPanel ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                  </button>
                </div>

                {renderError && (
                  <div className="diagram-modal__render-error">
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
                    wrapperClass="diagram-modal__transform-wrapper"
                    contentClass="diagram-modal__transform-content"
                  >
                    <div
                      ref={svgContainerRef}
                      className="diagram-modal__svg-container"
                      dangerouslySetInnerHTML={{ __html: svgHtml }}
                      onClickCapture={handleSvgClick}
                    />
                  </TransformComponent>
                </TransformWrapper>

                {/* Floating color picker for SVG node clicks */}
                {svgColorPicker && (
                  <div
                    className="diagram-modal__svg-color-picker"
                    style={{
                      left: svgColorPicker.x,
                      top: svgColorPicker.y,
                    }}
                  >
                    <span className="diagram-modal__svg-color-picker-label">
                      {nodes.find((n) => n.id === svgColorPicker.nodeId)?.label}
                    </span>
                    <div className="diagram-modal__svg-color-picker-grid">
                      {NODE_COLORS.map((c) => (
                        <button
                          key={c.value}
                          className={`diagram-modal__color-option ${
                            (nodes.find((n) => n.id === svgColorPicker.nodeId)?.color || "") === c.value
                              ? "diagram-modal__color-option--active"
                              : ""
                          }`}
                          style={{ backgroundColor: c.value || "#d1d5db" }}
                          title={c.name}
                          onClick={() => {
                            handleUpdateNode(svgColorPicker.nodeId, "color", c.value);
                            setSvgColorPicker(null);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: Visual Editor Panel */}
              {showPanel && (
              <div className="diagram-modal__editor-panel">
                {/* Nodes Section */}
                <div className="diagram-modal__section">
                  <div className="diagram-modal__section-header">
                    <span className="diagram-modal__section-title">
                      Nodos ({nodes.length})
                    </span>
                    <button
                      className="diagram-modal__add-btn"
                      onClick={() => {
                        setShowAddNode(!showAddNode);
                        setShowAddEdge(false);
                      }}
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {/* Add Node Form */}
                  {showAddNode && (
                    <div className="diagram-modal__add-form">
                      <input
                        type="text"
                        className="diagram-modal__input"
                        placeholder="Nombre del nodo"
                        value={newNodeLabel}
                        onChange={(e) => setNewNodeLabel(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddNode()}
                        autoFocus
                      />
                      <div className="diagram-modal__form-row">
                        <select
                          className="diagram-modal__select"
                          value={newNodeShape}
                          onChange={(e) =>
                            setNewNodeShape(e.target.value as NodeShape)
                          }
                        >
                          {SHAPES.map((s) => (
                            <option key={s} value={s}>
                              {SHAPE_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        <select
                          className="diagram-modal__select diagram-modal__select--color"
                          value={newNodeColor}
                          onChange={(e) => setNewNodeColor(e.target.value)}
                          style={
                            newNodeColor
                              ? {
                                  borderColor: newNodeColor,
                                  backgroundColor: newNodeColor + "18",
                                }
                              : undefined
                          }
                        >
                          {NODE_COLORS.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        className="diagram-modal__form-submit"
                        onClick={handleAddNode}
                        disabled={!newNodeLabel.trim()}
                      >
                        Agregar nodo
                      </button>
                    </div>
                  )}

                  {/* Node List */}
                  <div className="diagram-modal__node-list">
                    {[...nodes].sort((a, b) => a.label.localeCompare(b.label)).map((node) => (
                      <div key={node.id} className="diagram-modal__node-card">
                        {/* Color swatch picker */}
                        <div className="diagram-modal__node-color-wrap">
                          <button
                            className="diagram-modal__color-swatch"
                            style={{
                              backgroundColor: node.color || "#d1d5db",
                            }}
                            onClick={() =>
                              setColorPickerNodeId(
                                colorPickerNodeId === node.id ? null : node.id
                              )
                            }
                            title="Cambiar color"
                          />
                          {colorPickerNodeId === node.id && (
                            <div className="diagram-modal__color-dropdown">
                              {NODE_COLORS.map((c) => (
                                <button
                                  key={c.value}
                                  className={`diagram-modal__color-option ${
                                    (node.color || "") === c.value
                                      ? "diagram-modal__color-option--active"
                                      : ""
                                  }`}
                                  style={{
                                    backgroundColor: c.value || "#d1d5db",
                                  }}
                                  title={c.name}
                                  onClick={() => {
                                    handleUpdateNode(
                                      node.id,
                                      "color",
                                      c.value
                                    );
                                    setColorPickerNodeId(null);
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Label */}
                        <div className="diagram-modal__node-info">
                          {editingNodeId === node.id ? (
                            <input
                              type="text"
                              className="diagram-modal__node-input"
                              value={node.label}
                              onChange={(e) =>
                                handleUpdateNode(
                                  node.id,
                                  "label",
                                  e.target.value
                                )
                              }
                              onBlur={handleNodeLabelBlur}
                              onKeyDown={handleNodeLabelKeyDown}
                              autoFocus
                            />
                          ) : (
                            <span
                              className="diagram-modal__node-label"
                              onClick={() => setEditingNodeId(node.id)}
                              title="Clic para editar"
                            >
                              {node.label}
                            </span>
                          )}
                          <div className="diagram-modal__node-meta">
                            <select
                              className="diagram-modal__shape-select"
                              value={node.shape}
                              onChange={(e) =>
                                handleUpdateNode(
                                  node.id,
                                  "shape",
                                  e.target.value
                                )
                              }
                            >
                              {SHAPES.map((s) => (
                                <option key={s} value={s}>
                                  {SHAPE_LABELS[s]}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Delete */}
                        <button
                          className="diagram-modal__delete-btn"
                          onClick={() => handleDeleteNode(node.id)}
                          title="Eliminar nodo"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Edges Section */}
                <div className="diagram-modal__section">
                  <div className="diagram-modal__section-header">
                    <span className="diagram-modal__section-title">
                      Conexiones ({edges.length})
                    </span>
                    <button
                      className="diagram-modal__add-btn"
                      onClick={() => {
                        setShowAddEdge(!showAddEdge);
                        setShowAddNode(false);
                      }}
                      disabled={nodes.length < 2}
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {/* Add Edge Form */}
                  {showAddEdge && (
                    <div className="diagram-modal__add-form">
                      <div className="diagram-modal__form-row">
                        <select
                          className="diagram-modal__select"
                          value={newEdgeFrom}
                          onChange={(e) => setNewEdgeFrom(e.target.value)}
                        >
                          <option value="">Origen...</option>
                          {nodes.map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.label}
                            </option>
                          ))}
                        </select>
                        <ArrowRight
                          size={16}
                          className="diagram-modal__arrow-icon"
                        />
                        <select
                          className="diagram-modal__select"
                          value={newEdgeTo}
                          onChange={(e) => setNewEdgeTo(e.target.value)}
                        >
                          <option value="">Destino...</option>
                          {nodes.map((n) => (
                            <option key={n.id} value={n.id}>
                              {n.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text"
                        className="diagram-modal__input"
                        placeholder="Etiqueta (opcional)"
                        value={newEdgeLabel}
                        onChange={(e) => setNewEdgeLabel(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddEdge()}
                      />
                      <button
                        className="diagram-modal__form-submit"
                        onClick={handleAddEdge}
                        disabled={
                          !newEdgeFrom || !newEdgeTo || newEdgeFrom === newEdgeTo
                        }
                      >
                        Agregar conexión
                      </button>
                    </div>
                  )}

                  {/* Edge List */}
                  <div className="diagram-modal__edge-list">
                    {[...edges]
                      .map((edge, i) => ({ edge, originalIndex: i }))
                      .sort((a, b) => getNodeLabel(a.edge.from).localeCompare(getNodeLabel(b.edge.from)))
                      .map(({ edge, originalIndex }) => (
                      <div key={originalIndex} className="diagram-modal__edge-row">
                        <span className="diagram-modal__edge-text">
                          <strong>{getNodeLabel(edge.from)}</strong>
                          {" → "}
                          <strong>{getNodeLabel(edge.to)}</strong>
                          {edge.label && (
                            <span className="diagram-modal__edge-label-text">
                              {" "}
                              ({edge.label})
                            </span>
                          )}
                        </span>
                        <button
                          className="diagram-modal__delete-btn"
                          onClick={() => handleDeleteEdge(originalIndex)}
                          title="Eliminar conexión"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {edges.length === 0 && (
                      <p className="diagram-modal__empty-text">
                        Sin conexiones
                      </p>
                    )}
                  </div>
                </div>
              </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="diagram-modal__footer">
          <button
            className="diagram-modal__btn diagram-modal__btn--cancel"
            onClick={onClose}
          >
            Cerrar
          </button>
          <button
            className="diagram-modal__btn diagram-modal__btn--regenerate"
            onClick={onRegenerate}
            disabled={isGenerating}
          >
            <RefreshCw size={16} />
            Regenerar
          </button>
          <button
            className="diagram-modal__btn diagram-modal__btn--download"
            onClick={handleDownloadPng}
            disabled={!svgHtml || isGenerating}
          >
            <Download size={16} />
            PNG
          </button>
          <button
            className="diagram-modal__btn diagram-modal__btn--download-alt"
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

export default DiagramModal;
