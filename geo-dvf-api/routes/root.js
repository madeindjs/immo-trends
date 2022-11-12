"use strict";

/**
 * @param {import('fastify').FastifyInstance} fastify
 * @param {*} opts
 */
module.exports = async function (fastify, opts) {
  fastify.get("/", async function (request, reply) {
    return { root: true };
  });
};
