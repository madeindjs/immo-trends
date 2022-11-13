"use strict";
const { getDvfStats } = require("../services/index");

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {Object} opts plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */
module.exports = async (fastify, opts) => {
  /**
   * @type {import('fastify').RouteShorthandOptions}
   * @const
   */
  const statsOpts = {
    schema: {
      body: {
        type: "object",
        properties: {
          zipCode: { type: "string" },
          year: { type: "string" },
        },
      },
    },
  };

  /**
   * ~~~sh
   * curl -X POST -d '{"zipCode": "69330"}' -H 'content-type: application/json' localhost:3000/v1/stats
   * ~~~
   */
  fastify.post("/api/v1/stats", statsOpts, async (request, reply) => {
    // @ts-ignore
    const zipCode = request.body?.zipCode;
    // @ts-ignore
    const year = request.body?.year;

    return getDvfStats(year, zipCode);
  });
};
