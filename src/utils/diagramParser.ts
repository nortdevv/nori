/**
 * Mermaid Diagram Parser & Serializer
 *
 * Converts between Mermaid "graph TD" code and structured node/edge data.
 * This is the bridge between the visual editor UI and the Mermaid rendering engine.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type NodeShape =
  | "rect"
  | "rounded"
  | "stadium"
  | "cylinder"
  | "hexagon"
  | "circle";

export interface DiagramNode {
  id: string;
  label: string;
  shape: NodeShape;
  color: string | null;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label: string;
}

export interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

// ─── Shape rendering helpers ────────────────────────────────────────────────

const SHAPE_WRAPPERS: Record<NodeShape, [string, string]> = {
  rect: ["[", "]"],
  rounded: ["(", ")"],
  stadium: ["([", "])"],
  cylinder: ["[(", ")]"],
  hexagon: ["{{", "}}"],
  circle: ["((", "))"],
};

export const SHAPE_LABELS: Record<NodeShape, string> = {
  rect: "Rectángulo",
  rounded: "Redondeado",
  stadium: "Actor / Pill",
  cylinder: "Base de Datos",
  hexagon: "Sistema Externo",
  circle: "Círculo",
};

// ─── Parser ──────────────────────────────────────────────────────────────────

/**
 * Extract all node definitions from a Mermaid graph.
 * Nodes can appear as standalone definitions or within edge lines.
 *
 * Matches patterns like:
 *   A[Label], A(Label), A([Label]), A[(Label)], A{{Label}}, A((Label))
 */
function extractNodes(code: string): Map<string, DiagramNode> {
  const nodes = new Map<string, DiagramNode>();

  // Ordered from most specific (longest delimiters) to least specific
  const patterns: { regex: RegExp; shape: NodeShape }[] = [
    { regex: /\b([A-Za-z_]\w*)\(\[([^\]]*)\]\)/g, shape: "stadium" },
    { regex: /\b([A-Za-z_]\w*)\[\(([^)]*)\)\]/g, shape: "cylinder" },
    { regex: /\b([A-Za-z_]\w*)\{\{([^}]*)\}\}/g, shape: "hexagon" },
    { regex: /\b([A-Za-z_]\w*)\(\(([^)]*)\)\)/g, shape: "circle" },
  ];

  // Apply specific patterns first
  const matchedPositions = new Set<string>();

  for (const { regex, shape } of patterns) {
    let match;
    while ((match = regex.exec(code)) !== null) {
      const id = match[1];
      const label = match[2].trim().replace(/^"|"$/g, "");
      if (!nodes.has(id)) {
        nodes.set(id, { id, label, shape, color: null });
      }
      // Mark this position range as matched
      matchedPositions.add(`${match.index}-${match.index + match[0].length}`);
    }
  }

  // Now match simpler patterns, avoiding already-matched positions
  const roundedRegex = /\b([A-Za-z_]\w*)\(([^()[]*)\)/g;
  let match;
  while ((match = roundedRegex.exec(code)) !== null) {
    const id = match[1];
    if (id === "graph" || id === "flowchart" || id === "subgraph") continue;
    if (!nodes.has(id)) {
      const label = match[2].trim().replace(/^"|"$/g, "");
      nodes.set(id, { id, label, shape: "rounded", color: null });
    }
  }

  const rectRegex = /\b([A-Za-z_]\w*)\[([^\][\n]*)\]/g;
  while ((match = rectRegex.exec(code)) !== null) {
    const id = match[1];
    if (id === "graph" || id === "flowchart" || id === "subgraph") continue;
    if (!nodes.has(id)) {
      const label = match[2].trim().replace(/^"|"$/g, "");
      nodes.set(id, { id, label, shape: "rect", color: null });
    }
  }

  return nodes;
}

/**
 * Extract style directives to determine node colors.
 * Matches: style NodeId fill:#hexcolor
 */
function extractStyles(code: string): Map<string, string> {
  const styles = new Map<string, string>();
  const regex = /style\s+(\w+)\s+fill:(#[0-9a-fA-F]{3,8})/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    styles.set(match[1], match[2]);
  }
  return styles;
}

/**
 * Extract all edges from a Mermaid graph.
 * Matches patterns like:
 *   A --> B, A -->|label| B, A -.-> B, A ==> B
 */
function extractEdges(code: string): DiagramEdge[] {
  const edges: DiagramEdge[] = [];
  // Match edge patterns: A -->|optional label| B
  // Also handle: A --- B, A -.-> B, A ==> B, A --> B
  const regex =
    /\b([A-Za-z_]\w*)(?:\([^)]*\)|\[[^\]]*\]|\{\{[^}]*\}\}|\(\([^)]*\)\)|\(\[[^\]]*\]\)|\[\([^)]*\)\])?\s*(-->|-.->|==>|---)\s*(?:\|([^|]*)\|\s*)?([A-Za-z_]\w*)/g;

  let match;
  while ((match = regex.exec(code)) !== null) {
    const from = match[1];
    const label = match[3]?.trim() || "";
    const to = match[4];
    edges.push({ from, to, label });
  }

  return edges;
}

/**
 * Parse a Mermaid graph code string into structured data.
 */
export function parseMermaidCode(code: string): DiagramData {
  const nodes = extractNodes(code);
  const styles = extractStyles(code);
  const edges = extractEdges(code);

  // Apply styles to nodes
  for (const [nodeId, color] of styles) {
    const node = nodes.get(nodeId);
    if (node) {
      node.color = color;
    }
  }

  // Ensure all nodes referenced in edges exist
  for (const edge of edges) {
    if (!nodes.has(edge.from)) {
      nodes.set(edge.from, {
        id: edge.from,
        label: edge.from,
        shape: "rect",
        color: null,
      });
    }
    if (!nodes.has(edge.to)) {
      nodes.set(edge.to, {
        id: edge.to,
        label: edge.to,
        shape: "rect",
        color: null,
      });
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    edges,
  };
}

// ─── Serializer ──────────────────────────────────────────────────────────────

/**
 * Sanitize a label for Mermaid: wrap in quotes if it contains special chars.
 */
function sanitizeLabel(label: string): string {
  // If the label contains characters that could break Mermaid syntax, wrap in quotes
  if (/[[\](){}|<>/"\\]/.test(label)) {
    return `"${label.replace(/"/g, "'")}"`;
  }
  return label;
}

/**
 * Determine if a color is dark enough to need white text.
 */
function isDarkColor(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.6;
}

/**
 * Darken a hex color by a given factor (0 = no change, 1 = black).
 */
function darkenColor(hex: string, factor: number): string {
  const c = hex.replace("#", "");
  const r = Math.round(parseInt(c.substring(0, 2), 16) * (1 - factor));
  const g = Math.round(parseInt(c.substring(2, 4), 16) * (1 - factor));
  const b = Math.round(parseInt(c.substring(4, 6), 16) * (1 - factor));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Convert structured diagram data back into Mermaid code.
 */
export function serializeMermaidCode(data: DiagramData): string {
  const lines: string[] = ["graph TD"];

  // Node definitions
  for (const node of data.nodes) {
    const [open, close] = SHAPE_WRAPPERS[node.shape];
    const label = sanitizeLabel(node.label);
    lines.push(`    ${node.id}${open}${label}${close}`);
  }

  // Edge definitions
  for (const edge of data.edges) {
    if (edge.label) {
      lines.push(`    ${edge.from} -->|${sanitizeLabel(edge.label)}| ${edge.to}`);
    } else {
      lines.push(`    ${edge.from} --> ${edge.to}`);
    }
  }

  // Style directives for colored nodes
  const coloredNodes = data.nodes.filter((n) => n.color);
  if (coloredNodes.length > 0) {
    lines.push("");
    for (const node of coloredNodes) {
      const textColor = isDarkColor(node.color!) ? "#fff" : "#1a1a1a";
      const strokeColor = darkenColor(node.color!, 0.3);
      lines.push(
        `    style ${node.id} fill:${node.color},color:${textColor},stroke:${strokeColor},stroke-width:2px`
      );
    }
  }

  return lines.join("\n");
}

/**
 * Generate a unique node ID that doesn't conflict with existing ones.
 */
export function generateNodeId(existingNodes: DiagramNode[]): string {
  const existing = new Set(existingNodes.map((n) => n.id));
  let counter = 1;
  while (existing.has(`N${counter}`)) {
    counter++;
  }
  return `N${counter}`;
}
