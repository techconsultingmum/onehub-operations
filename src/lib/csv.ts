// Safe CSV utilities — quotes fields, escapes embedded quotes, and prevents
// CSV/spreadsheet formula injection by prefixing risky leading characters.

const FORMULA_TRIGGERS = /^[=+\-@\t\r]/;

export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = typeof value === "string" ? value : String(value);
  // Block spreadsheet formula injection
  if (FORMULA_TRIGGERS.test(str)) {
    str = `'${str}`;
  }
  // Always quote to handle commas, newlines, quotes uniformly
  return `"${str.replace(/"/g, '""')}"`;
}

export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: Array<{ key: keyof T; header: string }>,
): string {
  const header = columns.map((c) => escapeCsvField(c.header)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escapeCsvField(row[c.key])).join(","))
    .join("\r\n");
  return `${header}\r\n${body}`;
}

export function downloadCsv(filename: string, csv: string): void {
  // BOM helps Excel detect UTF-8
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke so Safari can complete the download
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
