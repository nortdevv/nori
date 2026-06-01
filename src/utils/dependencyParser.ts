/**
 * Mermaid Dependency Diagram Parser & Serializer
 *
 * Converts between Mermaid "graph LR" code (with phase subgraphs) and a
 * structured model of phases → activities + dependency edges.
 *
 * A dependency diagram answers "which activity must finish before another"
 * on the way to completing a project — it is a DAG, NOT a timeline. There are
 * deliberately no dates, durations or task statuses here.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DepActivity {
  id: string;
  label: string;
}

export interface DepPhase {
  id: string;
  name: string;
  activities: DepActivity[];
}

export interface DepDependency {
  from: string; // prerequisite activity id
  to: string; // dependent activity id
}

export interface DependencyData {
  direction: string; // "LR" | "TD" | "RL" | "TB" | "BT"
  phases: DepPhase[];
  dependencies: DepDependency[];
}

const UNGROUPED_PHASE_ID = "F_OTRAS";
const ARROW_RE = /-->|-\.->|==>|---/;
const KEYWORDS = new Set(["graph", "flowchart", "subgraph", "end"]);

// ─── Parser ──────────────────────────────────────────────────────────────────

/**
 * Pull `ID["label"]` / `ID[label]` / `ID("label")` / `ID(label)` node
 * definitions out of a single line.
 */
function extractNodeDefs(text: string): { id: string; label: string }[] {
  const defs: { id: string; label: string }[] = [];
  const patterns = [
    /([A-Za-z_]\w*)\[\s*"?([^\]"]*)"?\s*\]/g, // rectangles ID[...] / ID["..."]
    /([A-Za-z_]\w*)\(\s*"?([^)"]*)"?\s*\)/g, // rounded   ID(...) / ID("...")
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const id = m[1];
      if (KEYWORDS.has(id)) continue;
      defs.push({ id, label: m[2].trim() });
    }
  }
  return defs;
}

/**
 * Extract dependency edges from a single line. Handles one edge per line as
 * well as chains (`A --> B --> C`) and inline node definitions.
 */
function extractEdgesFromLine(line: string): DepDependency[] {
  // Strip node-shape brackets and edge labels so only IDs + arrows remain.
  const stripped = line
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/\|[^|]*\|/g, " ");

  const tokens = stripped
    .split(ARROW_RE)
    .map((t) => t.trim().match(/^[A-Za-z_]\w*/)?.[0])
    .filter((t): t is string => Boolean(t));

  const deps: DepDependency[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    if (KEYWORDS.has(tokens[i]) || KEYWORDS.has(tokens[i + 1])) continue;
    deps.push({ from: tokens[i], to: tokens[i + 1] });
  }
  return deps;
}

/**
 * Parse a Mermaid dependency graph string into structured data.
 */
export function parseDependencyCode(code: string): DependencyData {
  const data: DependencyData = { direction: "LR", phases: [], dependencies: [] };
  const activityIndex = new Map<string, DepActivity>();
  const usedPhaseIds = new Set<string>();
  let currentPhase: DepPhase | null = null;
  let autoPhaseCounter = 0;

  const ensureFallbackPhase = (): DepPhase => {
    let fallback = data.phases.find((p) => p.id === UNGROUPED_PHASE_ID);
    if (!fallback) {
      fallback = { id: UNGROUPED_PHASE_ID, name: "Otras actividades", activities: [] };
      data.phases.push(fallback);
      usedPhaseIds.add(UNGROUPED_PHASE_ID);
    }
    return fallback;
  };

  const registerNodes = (line: string) => {
    for (const def of extractNodeDefs(line)) {
      if (activityIndex.has(def.id)) {
        // Backfill a better label if one was previously a placeholder.
        const existing = activityIndex.get(def.id)!;
        if (!existing.label || existing.label === existing.id) {
          existing.label = def.label || existing.label;
        }
        continue;
      }
      const activity: DepActivity = { id: def.id, label: def.label || def.id };
      activityIndex.set(def.id, activity);
      (currentPhase ?? ensureFallbackPhase()).activities.push(activity);
    }
  };

  for (const rawLine of code.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("%%")) continue;

    // Direction directive
    const dir = line.match(/^(?:graph|flowchart)\s+(LR|RL|TD|TB|BT)\b/i);
    if (dir) {
      data.direction = dir[1].toUpperCase();
      continue;
    }

    // Subgraph open
    const sg = line.match(/^subgraph\s+(.+)$/i);
    if (sg) {
      const rest = sg[1].trim();
      const titled = rest.match(/^([A-Za-z_]\w*)\s*[[("]+([^\])"]*)[\])"]+\s*$/);
      let id: string;
      let name: string;
      if (titled) {
        id = titled[1];
        name = titled[2].trim();
      } else {
        name = rest.replace(/^["']|["']$/g, "").trim();
        do {
          id = `F${++autoPhaseCounter}`;
        } while (usedPhaseIds.has(id));
      }
      if (usedPhaseIds.has(id)) {
        do {
          id = `F${++autoPhaseCounter}`;
        } while (usedPhaseIds.has(id));
      }
      currentPhase = { id, name: name || id, activities: [] };
      data.phases.push(currentPhase);
      usedPhaseIds.add(id);
      continue;
    }

    // Subgraph close
    if (/^end\b/i.test(line)) {
      currentPhase = null;
      continue;
    }

    // Edge line (also register any inline node defs on it)
    if (ARROW_RE.test(line)) {
      data.dependencies.push(...extractEdgesFromLine(line));
      registerNodes(line);
      continue;
    }

    // Plain node definition line
    registerNodes(line);
  }

  // Ensure every edge endpoint exists as an activity.
  for (const dep of data.dependencies) {
    for (const endpoint of [dep.from, dep.to]) {
      if (!activityIndex.has(endpoint)) {
        const activity: DepActivity = { id: endpoint, label: endpoint };
        activityIndex.set(endpoint, activity);
        ensureFallbackPhase().activities.push(activity);
      }
    }
  }

  // Drop self-dependencies and duplicate edges.
  const seen = new Set<string>();
  data.dependencies = data.dependencies.filter((d) => {
    if (d.from === d.to) return false;
    const key = `${d.from}->${d.to}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (data.phases.length === 0) {
    data.phases.push({ id: "F1", name: "Fase 1", activities: [] });
  }

  return data;
}

// ─── Serializer ──────────────────────────────────────────────────────────────

/**
 * Sanitize a label for a quoted Mermaid node/subgraph title.
 */
function escapeLabel(label: string): string {
  return label.replace(/"/g, "'").replace(/\s+/g, " ").trim();
}

/**
 * Convert structured dependency data back into Mermaid code.
 */
export function serializeDependencyCode(data: DependencyData): string {
  const direction = data.direction || "LR";
  const lines: string[] = [`graph ${direction}`];

  for (const phase of data.phases) {
    lines.push(`    subgraph ${phase.id}["${escapeLabel(phase.name)}"]`);
    for (const activity of phase.activities) {
      lines.push(`        ${activity.id}["${escapeLabel(activity.label)}"]`);
    }
    lines.push(`    end`);
  }

  if (data.dependencies.length > 0) {
    lines.push("");
    for (const dep of data.dependencies) {
      lines.push(`    ${dep.from} --> ${dep.to}`);
    }
  }

  return lines.join("\n");
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Flat list of every activity across all phases. */
export function allActivities(data: DependencyData): (DepActivity & { phaseId: string; phaseName: string })[] {
  return data.phases.flatMap((p) =>
    p.activities.map((a) => ({ ...a, phaseId: p.id, phaseName: p.name }))
  );
}

/** Generate a globally-unique activity id (A1, A2, …). */
export function generateActivityId(data: DependencyData): string {
  const existing = new Set<string>();
  for (const p of data.phases) for (const a of p.activities) existing.add(a.id);
  let i = 1;
  while (existing.has(`A${i}`)) i++;
  return `A${i}`;
}

/** Generate a unique phase id (F1, F2, …). */
export function generatePhaseId(data: DependencyData): string {
  const existing = new Set(data.phases.map((p) => p.id));
  let i = 1;
  while (existing.has(`F${i}`)) i++;
  return `F${i}`;
}
