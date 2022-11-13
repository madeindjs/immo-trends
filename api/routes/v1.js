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

    const [d2017, d2018, d2019] = await Promise.all([2017, 2018, 2019].map((year) => getDvfStats(year, zipCode)));

    return { 2017: d2017, 2018: d2018, 2019: d2019 };
  });
};
