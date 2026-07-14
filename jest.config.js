// Jest config — pure-logic coverage over src/game/ (scoring, match rules,
// seeded determinism, edicts). Uses the Expo preset so the project's babel
// transform (incl. TS type-import elision) applies; the tested modules are
// pure, so no react-native runtime is pulled in.
module.exports = {
  preset: "jest-expo",
  testMatch: ["**/src/**/*.test.ts", "**/src/**/*.test.tsx"],
}
