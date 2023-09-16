export default {
    ssr: true,

    head: {
        title: "threejs_nuxt_demo",
        htmlAttrs: {
            lang: "en",
        },
        meta: [
            { charset: "utf-8" },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1",
            },
            { hid: "description", name: "description", content: "" },
            { name: "format-detection", content: "telephone=no" },
        ],
        link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },

    css: ["@/assets/css/index.scss"],

    plugins: [],

    components: true,

    buildModules: [
        // https://go.nuxtjs.dev/typescript
        "@nuxt/typescript-build",
    ],

    modules: [],

    build: {
        transpile: ["three"],
    },
};
