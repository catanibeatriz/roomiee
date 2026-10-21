// GitHub Pages serves the site from /<repo-name>/, so the web build needs that
// prefix. The deploy workflow sets EXPO_BASE_URL; local dev leaves it unset.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
});
