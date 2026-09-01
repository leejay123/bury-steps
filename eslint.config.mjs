import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "prisma/migrations/**",
    ],
  },
  {
    rules: {
      // The codebase relies on a handful of intentional `any`s (mostly around
      // loosely-typed third-party payloads); downgrade rather than silence so
      // new, unintentional ones still show up during review.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // eslint-plugin-react-hooks v7 (bundled with the Next.js 16 upgrade)
      // ships a substantially stricter rule set — these four newly flag
      // ~34 pre-existing call sites across the codebase. Downgrading rather
      // than either rewriting that many React patterns as a side effect of
      // a version bump, or silencing the findings outright — same policy as
      // the two rules above. Worth a dedicated follow-up pass.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
