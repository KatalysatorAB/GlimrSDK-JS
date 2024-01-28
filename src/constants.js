"use strict";

module.exports = {
  GLIMR_HOST: "//pixel.glimr.io",
  GLIMR_PATHS: {
    tags: "/v4/iptags/:id/",
    store: "/v4/collect/:id/"
  },

  MAX_CACHE_TIME: 300,
  MAC_FALLBACK_TIME: 86400,

  CACHE_TIMINGS: {
    tags: 0,
    fallback: 0,
  },

  V2_PREFIX: "[v2]:",

  IS_FALLBACK: false,
  FALLBACK_MAPPING: []
};
