<template>
    <div id="fullscreen_layout">
        <nuxt />
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component
export default class FullscreenLayout extends Vue {}
</script>

<style scoped lang="scss">
#fullscreen_layout {
    max-height: 100vh;
}
</style>
