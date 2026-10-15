import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist", "dist-gallery", "node_modules", "test-results", "playwright-report"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { "react-hooks": reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  // artifacts are untyped JSON by design; the parity layer reads them as such
  { files: ["**/*.{ts,tsx}"], rules: { "@typescript-eslint/no-explicit-any": "off" } },
  // tests drive a browser: page.evaluate bodies reference browser globals
  { files: ["tests/**/*.mjs", "*.config.*"], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
);
