const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "dist/core/template-engine.js");
let content = fs.readFileSync(file, "utf8");
content = content.replace(
  /const `[^`]+` = dirname\(fileURLToPath\(import\.meta\.url\)\);/,
  "const __dirname = dirname(fileURLToPath(import.meta.url));"
);
content = content.replace(
  /const VIEWS_PATH = resolve\(`[^`]+`, "\.\.\/views"\);/,
  'const VIEWS_PATH = resolve(__dirname, "../views");'
);
fs.writeFileSync(file, content);
