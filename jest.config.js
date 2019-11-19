module.exports = {
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  // tests must be placed in `__tests__` folders
  testRegex: "/__tests__/.*\\.test\\.(jsx?|tsx?)$",
  testPathIgnorePatterns: ["/esm/", "/lib/", "/node_modules/"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverage: true,
  globals: {
    'ts-jest': {
      diagnostics: false,
    }
  },
};
