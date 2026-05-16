"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFrontmatter = parseFrontmatter;
const yaml_1 = require("yaml");
/**
 * Minimal frontmatter parser. Only supports YAML (the `---` delimiter).
 * Does NOT support `---js` / `---javascript` to avoid eval()-based RCE
 * that exists in gray-matter's built-in JS engine.
 */
function parseFrontmatter(raw) {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match)
        return { data: {}, content: raw };
    const data = (0, yaml_1.parse)(match[1]) ?? {};
    return { data, content: match[2] ?? '' };
}
//# sourceMappingURL=frontmatter.js.map