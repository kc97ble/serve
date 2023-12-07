const FastUrlParser = require("fast-url-parser");
const Path = require("path");
const serveHandler = require("serve-handler");
const pathIsInside = require("path-is-inside");
const Fs = require("fs");
const { minimatch } = require("minimatch");

const { Rule } = require("./typing");
const { createError } = require("micro");

/**
 * @param {string} path
 */
async function readRulesAt(path) {
  try {
    const text = await Fs.promises.readFile(path, "utf-8");
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      return data.map((item) => Rule.parse(item));
    } else {
      return [Rule.parse(data)];
    }
  } catch {
    return undefined;
  }
}

/**
 * @param {string} path
 * @param {import("zod").infer<typeof Rule>[]} rules
 */
function checkRules(path, rules) {
  const now = Date.now();

  for (const rule of rules) {
    if (rule.match) {
      const patterns = Array.isArray(rule.match) ? rule.match : [rule.match];
      if (!patterns.some((p) => minimatch(path, p))) {
        continue;
      }
    }

    if (rule.block) {
      return ["Access denied.", "You cannot access this file."].join("\n\n");
    }

    if (rule.prior && now >= rule.prior) {
      return [
        "Too late.",
        "You can only access this file BEFORE",
        new Date(rule.prior).toISOString(),
        "but now is",
        new Date(now).toISOString(),
      ].join("\n\n");
    }

    if (rule.since && now < rule.since) {
      return [
        "Too early.",
        "You can only access this file AFTER",
        new Date(rule.prior).toISOString(),
        "but now is",
        new Date(now).toISOString(),
      ].join("\n\n");
    }
  }

  return null;
}

/**
 * @param {{ path: string; root: string; }} params
 */
async function check({ path, root }) {
  const dirs = [];
  for (let d = path; pathIsInside(d, root); d = Path.dirname(d)) {
    dirs.unshift(d);
  }

  for (const currentDir of dirs) {
    const rules = await readRulesAt(Path.join(currentDir, ".serverc.json"));
    if (!rules) continue;
    const relativePath = Path.relative(currentDir, path);
    const error = checkRules(relativePath, rules);
    if (error) {
      throw createError(
        403,
        [
          error,
          JSON.stringify({ rules, relativePath, currentDir }, null, 2),
        ].join("\n\n")
      );
    }
  }
}

/**
 * @param {{ root: string }} config
 */
function getHandler({ root }) {
  /**
   * @param {import('http').IncomingMessage} req
   * @param {import('http').ServerResponse} res
   */
  return async function (req, res) {
    const relativePath = decodeURIComponent(
      FastUrlParser.parse(req.url).pathname
    );
    const absolutePath = Path.join(root, relativePath).replace(/\/+$/, "");
    await check({ path: absolutePath, root });
    await serveHandler(req, res, { public: root });
  };
}

module.exports = { getHandler };