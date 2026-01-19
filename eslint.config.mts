import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "coverage", ".git"] },

  // Base JS/TS configs
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // React
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}"],
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...pluginReact.configs.flat.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/display-name": "off",
    },
  },

  // JSON
  {
    files: ["**/*.json"],
    language: "json/json",
    ...json.configs.recommended,
    rules: {
      ...json.configs.recommended.rules,
      "no-irregular-whitespace": "off",
    },
  },
  {
    files: ["**/*.jsonc", ".vscode/*.json"],
    language: "json/jsonc",
    ...json.configs.recommended,
    rules: {
      ...json.configs.recommended.rules,
      "no-irregular-whitespace": "off",
    },
  },

  // Markdown
  ...markdown.configs.recommended.map((config) => ({
    ...config,
    rules: {
      ...config.rules,
      "no-irregular-whitespace": "off" as const,
    },
  })),

  // CSS
  {
    files: ["**/*.css"],
    language: "css/css",
    ...css.configs.recommended,
    rules: {
      ...css.configs.recommended.rules,
      "no-irregular-whitespace": "off",
    },
  },
);
