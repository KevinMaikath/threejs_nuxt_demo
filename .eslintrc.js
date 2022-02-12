module.exports = {
    root: true,
    env: {
        browser: true,
        node: true,
    },
    parser: "vue-eslint-parser",
    extends: [
        "@nuxtjs/eslint-config-typescript",
        "eslint:recommended",
        "prettier",
        "plugin:prettier/recommended",
        "plugin:nuxt/recommended",
    ],
    plugins: ["prettier"],
    // add your custom rules here
    rules: {
        "no-use-before-define": "off",
        camelcase: "off",
        "no-unused-vars": "off",
        "no-console": "off",
    },
};
