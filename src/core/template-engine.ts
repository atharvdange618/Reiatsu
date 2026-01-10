import { readFileSync } from "fs";
import { resolve, dirname, normalize, sep } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const VIEWS_PATH = resolve(__dirname, "../views");

/**
 * A simple template engine that compiles templates with embedded JavaScript.
 * Supports escaped and raw output, as well as plain JavaScript code execution.
 */

function escapeHtml(str: any): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Compiles a template string into a function that can render data.
 * The template can contain:
 * - `<%= ... %>` for escaped output
 * - `<%- ... %>` for raw output
 * - `<% ... %>` for plain JavaScript code execution
 *
 * @security WARNING: This function uses `new Function()` which is similar to `eval()`.
 * Only use with trusted template sources. Do NOT use with user-generated content.
 * For user-generated templates, consider using a sandboxed library like Handlebars or EJS.
 *
 * @param {string} template - The template string to compile.
 * @returns {function} A function that takes data and returns the rendered string.
 * @throws {Error} If template contains forbidden code patterns
 */
export function compile(
  template: string
): (data: Record<string, any>) => string {
  if (
    template.includes("require(") ||
    template.includes("import(") ||
    template.includes("process.") ||
    template.includes("global.") ||
    template.includes("__dirname") ||
    template.includes("__filename")
  ) {
    throw new Error(
      "Template contains forbidden code patterns that could pose security risks"
    );
  }
  let code = 'let output = "";\n';
  let cursor = 0;
  const regex = /<%([=-]?)([\s\S]+?)%>/g;
  let match: RegExpExecArray | null;

  const addText = (text: string) => {
    code += `output += ${JSON.stringify(text)};\n`;
  };

  while ((match = regex.exec(template))) {
    const rawText = template.slice(cursor, match.index);
    if (rawText) addText(rawText);

    const [fullMatch, flag, content] = match;
    const trimmed = content.trim();

    if (flag === "=") {
      // Escaped output
      code += `output += escapeHtml(${trimmed});\n`;
    } else if (flag === "-") {
      // Raw output
      code += `output += (${trimmed});\n`;
    } else {
      // Plain JS code
      code += `${trimmed}\n`;
    }

    cursor = match.index + fullMatch.length;
  }

  addText(template.slice(cursor));
  code += "return output;";

  return function render(data: Record<string, any>): string {
    const args = Object.keys(data);
    const values = Object.values(data);
    const renderFn = new Function(...args, "escapeHtml", code);
    return renderFn(...values, escapeHtml);
  };
}

/**
 * Renders a template string with the provided data.
 *
 * @param {string} template - The template string to render.
 * @param {Record<string, any>} data - The data to inject into the template.
 * @returns {string} The rendered string.
 */
export function render(template: string, data: Record<string, any>): string {
  return compile(template)(data);
}

/**
 * Renders a template file with the provided data.
 *
 * @param {string} filePath - The path to the template file.
 * @param {Record<string, any>} data - The data to inject into the template.
 * @returns {string} The rendered string.
 * @throws {Error} If path traversal is detected
 */
export function renderFile(filePath: string, data: Record<string, any>) {
  const fullPath = resolve(VIEWS_PATH, normalize(filePath));

  if (!fullPath.startsWith(VIEWS_PATH + sep)) {
    throw new Error("Path traversal attempt blocked");
  }

  const template = readFileSync(fullPath, "utf8");
  return render(template, data);
}
