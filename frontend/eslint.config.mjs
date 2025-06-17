import { dirname } from "path";
import { fileURLToPath } from "url";

import { FlatCompat } from "@eslint/eslintrc";

// 获取当前文件路径和目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 创建兼容层，用于从旧的配置（比如 extends）中导入规则
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",

      // 你自定义的 import/order 规则
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "parent",
            "sibling",
            "index",
            "internal",
            "object",
            "type",
          ],
          pathGroups: [
            {
              pattern: "react*",
              group: "builtin",
              position: "before",
            },
            {
              pattern: "@/components/**",
              group: "parent",
              position: "before",
            },
            {
              pattern: "@/utils/**",
              group: "parent",
              position: "after",
            },
            {
              pattern: "@/apis/**",
              group: "parent",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["react"],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
    },
  },
  {
    files: ["src/components/ui/**/*.{js,ts,jsx,tsx}"],
    rules: {
      "import/order": "off",
    },
  },
];

export default eslintConfig;
