<template>
    <div>
        <h2>Home</h2>

        <nuxt-link to="/cube">Cube</nuxt-link>
        <nuxt-link to="/solar-system">Solar System</nuxt-link>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component
export default class Home extends Vue {}
</script>

<style scoped lang="scss"></style>
