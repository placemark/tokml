module.exports = {
  transformIgnorePatterns: [
    'node_modules/(?!xast-util-to-xml|unist-builder|xastscript|stringify-entities|character-entities-legacy|character-entities-html4|ccount)',
  ],
  collectCoverage: true,
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
};
