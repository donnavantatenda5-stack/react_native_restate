// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    settings: {
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx", ".d.ts"],
        },
      },
    },
    rules: {
      "import/no-unresolved": "off",
      "import/no-named-as-default-member": "off",
      "import/no-named-as-default": "off",
      "import/namespace": "off",
      "import/no-duplicates": "off",
      "import/named": "off",
      "import/default": "off",
      "import/export": "off",
      "import/no-cycle": "off",
      "import/no-self-import": "off",
      "import/no-extraneous-dependencies": "off",
    },
  },
]);
