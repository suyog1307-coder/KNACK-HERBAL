import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // The standard hydration-guard pattern (useState + useEffect for isMounted)
      // is intentional and well-understood. Disable this overly strict rule.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
