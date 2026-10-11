import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// eslint-config-next 15.x ships legacy (eslintrc) presets; FlatCompat adapts them
// to ESLint 9 flat config. This is the Next.js 15 starter setup. (The previous
// "eslint-config-next/core-web-vitals" flat import only exists in v16.)
const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts", "playwright-report/**", "test-results/**"],
  },
];

export default eslintConfig;
