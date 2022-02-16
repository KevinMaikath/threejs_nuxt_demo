<template>
    <div>
        <h2>Home</h2>

        <nuxt-link to="/cube">Cube</nuxt-link>
        <nuxt-link to="/solar-system">Solar System</nuxt-link>

        <h3>Lessons</h3>
        <div class="lesson-links-container">
            <nuxt-link
                v-for="route in lessonRoutes"
                :key="route.path"
                :to="route.path"
                class="lesson-links-item"
                >{{ route.name }}</nuxt-link
            >
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component
export default class Home extends Vue {
    lessonRoutes: any[] = [];
    created() {
        if (!this.$router.options.routes) return;

        this.lessonRoutes = this.$router.options.routes.filter((route) =>
            route.path.startsWith("/lessons")
        );
    }
}
</script>

<style scoped lang="scss">
.lesson-links {
    &-container {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(3, 1fr);
        max-width: 750px;
    }
}
</style>
