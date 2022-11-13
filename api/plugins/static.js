"use strict";

const fp = require("fastify-plugin").default;
const path = require("path");

/**
 * This plugins adds some utilities to handle http errors
 *
 * @see https://github.com/fastify/fastify-sensible
 */
module.exports = fp(async function (fastify, opts) {
  fastify.register(require("@fastify/static"), {
    root: path.join(__dirname, "..", "..", "frontend", "dist"),
    // prefix: "/", // optional: default '/'
  });
});
