import nextJest from "next/jest.js";

// Next.js's own Jest setup: it handles TypeScript for us.
const createJestConfig = nextJest({ dir: "./" });

export default createJestConfig({
  testEnvironment: "node",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
});
