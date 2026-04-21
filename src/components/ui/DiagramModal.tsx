import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  X,
  Download,
  RefreshCw,
  GitBranch,
  AlertTriangle,
  Code,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Palette,
} from "lucide-react";
import mermaid from "mermaid";
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import "./DiagramModal.css";

// Initialize mermaid once
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  flowchart: { htmlLabels: true, curve: "basis" },
});

const NODE_COLORS = [
  { name: "Rojo Banorte", value: "#ec0029" },
  { name: "Azul", value: "#3b82f6" },
  { name: "Verde", value: "#22c55e" },
  { name: "Morado", value: "#8b5cf6" },
  { name: "Naranja", value: "#f97316" },
  { name: "Amarillo", value: "#eab308" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Gris", value: "#6b7280" },
];

interface DiagramModalProps {
  source: string | null;
  isGenerating: boolean;
  error: string | null;
  onClose: () => void;
  onRegenerate: () => void;
  onSaveSource: (newSource: string) => void;
}

function DiagramModal({
  source,
  isGenerating,
  error,
  onClose,
  onRegenerate,
  onSaveSource,
}: DiagramModalProps) {
  const uniqueId = useId();
  const renderIdRef = useRef(0);

  // Tabs: "preview" or "editor"
  const [activeTab, setActiveTab] = useState<"preview" | "editor">("preview");
  const [editorCode, setEditorCode] = useState(source || "");
  const [svgHtml, setSvgHtml] = useState("");
  const [renderError, setRenderError] = useState<string | null>(null);

  // Color picker
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [colorPickerPos, setColorPickerPos] = useState({ x: 0, y: 0 });

  const svgContainerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ReactZoomPanPinchRef>(null);

  // Render mermaid code to SVG
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
        const { svg } = await mermaid.render(renderId, code);
        setSvgHtml(svg);
      } catch (err: any) {
        console.error("Mermaid render error:", err);
        setRenderError(err?.message || "Error de sintaxis en el diagrama");
      }
    },
    [uniqueId]
  );

  // Render when source changes (initial load or regenerate)
  useEffect(() => {
    if (source) {
      setEditorCode(source);
      renderDiagram(source);
    }
  }, [source, renderDiagram]);

  // Attach click handlers to SVG nodes for color picking
  useEffect(() => {
    if (!svgHtml || !svgContainerRef.current) return;

    const container = svgContainerRef.current;
    const nodes = container.querySelectorAll<SVGElement>(".node");

    const handleNodeClick = (e: Event) => {
      e.stopPropagation();
      const node = (e.currentTarget as SVGElement);
      const nodeId = node.id;

      // Get click position relative to the modal
      const mouseEvent = e as MouseEvent;
      const rect = container.closest(".diagram-modal")?.getBoundingClientRect();
      if (rect) {
        setColorPickerPos({
          x: mouseEvent.clientX - rect.left,
          y: mouseEvent.clientY - rect.top,
        });
      }

      setSelectedNodeId(nodeId);
      setShowColorPicker(true);
    };

    nodes.forEach((node) => {
      node.style.cursor = "pointer";
      node.addEventListener("click", handleNodeClick);
    });

    return () => {
      nodes.forEach((node) => {
        node.removeEventListener("click", handleNodeClick);
      });
    };
  }, [svgHtml]);

  // Apply color to selected node
  const applyColor = (color: string) => {
    if (!selectedNodeId || !svgContainerRef.current) return;

    const node = svgContainerRef.current.querySelector(`#${CSS.escape(selectedNodeId)}`);
    if (!node) return;

    // Find the rect/polygon/circle/path shape inside the node group
    const shapes = node.querySelectorAll<SVGElement>(
      "rect, polygon, circle, ellipse, path.basic"
    );
    shapes.forEach((shape) => {
      shape.style.fill = color;
      shape.style.stroke = color;
      shape.style.filter = "brightness(0.9)";
    });

    // Make text white for dark backgrounds
    const texts = node.querySelectorAll<SVGElement>("text, .nodeLabel");
    texts.forEach((text) => {
      text.style.fill = "#ffffff";
    });

    setShowColorPicker(false);
    setSelectedNodeId(null);
  };

  // Apply editor changes
  const handleApplyCode = () => {
    renderDiagram(editorCode);
    onSaveSource(editorCode);
    setActiveTab("preview");
  };

  // Download as SVG
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

  // Download as PNG
  const handleDownloadPng = () => {
    if (!svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector("svg");
    if (!svgEl) return;

    const canvas = document.createElement("canvas");
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
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

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowColorPicker(false);
    if (showColorPicker) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showColorPicker]);

  return (
    <div className="diagram-modal-overlay" onClick={onClose}>
      <div className="diagram-modal diagram-modal--wide" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="diagram-modal__header">
          <span className="diagram-modal__title">
            <GitBranch size={18} color="#ec0029" />
            Diagrama de Arquitectura
          </span>

          <div className="diagram-modal__tabs">
            <button
              className={`diagram-modal__tab ${activeTab === "preview" ? "diagram-modal__tab--active" : ""}`}
              onClick={() => setActiveTab("preview")}
            >
              <Eye size={14} />
              Vista Previa
            </button>
            <button
              className={`diagram-modal__tab ${activeTab === "editor" ? "diagram-modal__tab--active" : ""}`}
              onClick={() => {
                setActiveTab("editor");
                setShowColorPicker(false);
              }}
            >
              <Code size={14} />
              Editor
            </button>
          </div>

          <button className="diagram-modal__close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
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

          {/* Error from backend */}
          {error && !isGenerating && (
            <div className="diagram-modal__error">
              <div className="diagram-modal__error-icon">
                <AlertTriangle size={24} />
              </div>
              <p className="diagram-modal__error-text">{error}</p>
            </div>
          )}

          {/* Preview tab */}
          {!isGenerating && !error && activeTab === "preview" && svgHtml && (
            <div className="diagram-modal__preview-area">
              {/* Zoom controls */}
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
                <div className="diagram-modal__zoom-separator" />
                <button
                  className="diagram-modal__zoom-btn diagram-modal__zoom-btn--color"
                  title="Haz clic en un nodo para cambiar su color"
                >
                  <Palette size={16} />
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
                initialScale={1}
                minScale={0.3}
                maxScale={3}
                centerOnInit
                wheel={{ step: 0.08 }}
              >
                <TransformComponent
                  wrapperStyle={{ width: "100%", height: "100%" }}
                  contentStyle={{ width: "100%", display: "flex", justifyContent: "center" }}
                >
                  <div
                    ref={svgContainerRef}
                    className="diagram-modal__svg-container"
                    dangerouslySetInnerHTML={{ __html: svgHtml }}
                  />
                </TransformComponent>
              </TransformWrapper>

              <p className="diagram-modal__hint">
                🖱️ Scroll para zoom · Arrastra para mover · Clic en un nodo para cambiar su color
              </p>
            </div>
          )}

          {/* Editor tab */}
          {!isGenerating && !error && activeTab === "editor" && (
            <div className="diagram-modal__editor-area">
              <div className="diagram-modal__editor-header">
                <span>Código Mermaid</span>
                <button className="diagram-modal__apply-btn" onClick={handleApplyCode}>
                  <Eye size={14} />
                  Aplicar y ver
                </button>
              </div>
              <textarea
                className="diagram-modal__textarea"
                value={editorCode}
                onChange={(e) => setEditorCode(e.target.value)}
                spellCheck={false}
                placeholder="graph TD&#10;    A-->B"
              />
              <p className="diagram-modal__editor-hint">
                Edita el código Mermaid directamente. Haz clic en "Aplicar y ver" para previsualizar los cambios.
              </p>
            </div>
          )}
        </div>

        {/* Color Picker Popup */}
        {showColorPicker && (
          <div
            className="diagram-modal__color-picker"
            style={{ left: colorPickerPos.x, top: colorPickerPos.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="diagram-modal__color-picker-title">Color del nodo</span>
            <div className="diagram-modal__color-grid">
              {NODE_COLORS.map((c) => (
                <button
                  key={c.value}
                  className="diagram-modal__color-swatch"
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                  onClick={() => applyColor(c.value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="diagram-modal__footer">
          <button className="diagram-modal__btn diagram-modal__btn--cancel" onClick={onClose}>
            Cerrar
          </button>
          <button
            className="diagram-modal__btn diagram-modal__btn--regenerate"
            onClick={() => {
              setShowColorPicker(false);
              onRegenerate();
            }}
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
