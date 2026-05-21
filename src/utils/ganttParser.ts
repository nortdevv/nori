/**
 * Mermaid Gantt Chart Parser & Serializer
 *
 * Converts between Mermaid "gantt" code and structured task/section data.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type TaskStatus = "" | "done" | "active" | "crit";

export interface GanttTask {
  id: string;
  label: string;
  status: TaskStatus;
  start: string; // date "YYYY-MM-DD" or "after taskId"
  duration: string; // e.g. "10d"
}

export interface GanttSection {
  name: string;
  tasks: GanttTask[];
}

export interface GanttData {
  title: string;
  dateFormat: string;
  excludes: string;
  sections: GanttSection[];
}

// ─── Parser ──────────────────────────────────────────────────────────────────

/**
 * Parse a Mermaid gantt code string into structured data.
 */
export function parseGanttCode(code: string): GanttData {
  const lines = code.split("\n").map((l) => l.trimEnd());

  const data: GanttData = {
    title: "Plan de Implementacion",
    dateFormat: "YYYY-MM-DD",
    excludes: "weekends",
    sections: [],
  };

  let currentSection: GanttSection | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and the "gantt" directive
    if (!trimmed || trimmed === "gantt") continue;

    // Title
    const titleMatch = trimmed.match(/^title\s+(.+)$/);
    if (titleMatch) {
      data.title = titleMatch[1].trim();
      continue;
    }

    // Date format
    const dateFormatMatch = trimmed.match(/^dateFormat\s+(.+)$/);
    if (dateFormatMatch) {
      data.dateFormat = dateFormatMatch[1].trim();
      continue;
    }

    // Excludes
    const excludesMatch = trimmed.match(/^excludes\s+(.+)$/);
    if (excludesMatch) {
      data.excludes = excludesMatch[1].trim();
      continue;
    }

    // Section
    const sectionMatch = trimmed.match(/^section\s+(.+)$/);
    if (sectionMatch) {
      currentSection = { name: sectionMatch[1].trim(), tasks: [] };
      data.sections.push(currentSection);
      continue;
    }

    // Task line: "Label :status, id, start/after, duration"
    // or:        "Label :id, start/after, duration"
    // or:        "Label :status, id, duration" (if start is implicit)
    const taskMatch = trimmed.match(
      /^(.+?)\s*:\s*(.+)$/
    );
    if (taskMatch && currentSection) {
      const label = taskMatch[1].trim();
      const parts = taskMatch[2].split(",").map((p) => p.trim());

      const task: GanttTask = {
        id: "",
        label,
        status: "",
        start: "",
        duration: "",
      };

      // Parse parts based on count
      // Possible formats:
      // status, id, start, duration (4 parts)
      // status, id, duration (3 parts - no start, means after prev)
      // id, start, duration (3 parts - no status)
      // id, duration (2 parts)
      const STATUSES = ["done", "active", "crit"];

      if (parts.length >= 4) {
        // status, id, start, duration
        if (STATUSES.includes(parts[0])) {
          task.status = parts[0] as TaskStatus;
          task.id = parts[1];
          task.start = parts[2];
          task.duration = parts[3];
        }
      } else if (parts.length === 3) {
        if (STATUSES.includes(parts[0])) {
          // status, id, start_or_duration
          task.status = parts[0] as TaskStatus;
          task.id = parts[1];
          // Check if third part is a duration or a start
          if (parts[2].match(/^\d+d$/)) {
            task.duration = parts[2];
          } else {
            task.start = parts[2];
          }
        } else {
          // id, start, duration
          task.id = parts[0];
          task.start = parts[1];
          task.duration = parts[2];
        }
      } else if (parts.length === 2) {
        // id, duration
        task.id = parts[0];
        task.duration = parts[1];
      } else if (parts.length === 1) {
        task.id = parts[0];
      }

      // If duration wasn't captured from 3-part status format, try last part
      if (!task.duration && parts.length >= 3 && STATUSES.includes(parts[0])) {
        // status, id, after xxx, duration
        // Re-parse: might be "status, id, after xxx, 10d"
        const rawParts = taskMatch[2].split(",").map((p) => p.trim());
        if (rawParts.length === 4) {
          task.start = rawParts[2];
          task.duration = rawParts[3];
        }
      }

      currentSection.tasks.push(task);
    }
  }

  // If no sections were found, create a default one
  if (data.sections.length === 0) {
    data.sections.push({ name: "General", tasks: [] });
  }

  return data;
}

// ─── Serializer ──────────────────────────────────────────────────────────────

/**
 * Convert structured Gantt data back into Mermaid code.
 */
export function serializeGanttCode(data: GanttData): string {
  const lines: string[] = ["gantt"];

  lines.push(`    title ${data.title}`);
  lines.push(`    dateFormat  ${data.dateFormat}`);
  if (data.excludes) {
    lines.push(`    excludes ${data.excludes}`);
  }
  lines.push("");

  for (const section of data.sections) {
    lines.push(`    section ${section.name}`);
    for (const task of section.tasks) {
      const parts: string[] = [];
      if (task.status) parts.push(task.status);
      parts.push(task.id);
      if (task.start) parts.push(task.start);
      if (task.duration) parts.push(task.duration);
      lines.push(`    ${task.label}    :${parts.join(", ")}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

/**
 * Generate a unique task ID that doesn't conflict with existing ones.
 */
export function generateTaskId(data: GanttData): string {
  const existing = new Set<string>();
  for (const section of data.sections) {
    for (const task of section.tasks) {
      existing.add(task.id);
    }
  }
  let counter = 1;
  while (existing.has(`task${counter}`)) {
    counter++;
  }
  return `task${counter}`;
}
