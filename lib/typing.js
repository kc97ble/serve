const { z } = require("zod");

const Match = z.union([z.string(), z.string().array()]);

const Rule = z.object({
  match: Match.nullish(),
  since: z.number().safe().nullish(),
  prior: z.number().safe().nullish(),
  block: z.boolean().nullish(),
});

module.exports = {
  Match,
  Rule,
};
