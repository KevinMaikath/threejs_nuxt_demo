<template>
    <canvas ref="canvas" class="full-screen"></canvas>
</template>

<script lang="ts">
import Component from "vue-class-component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { PerspectiveCamera } from "three";
import LessonSetupMixin from "~/mixins/lesson-setup.vue";

declare global {
    interface Document {
        webkitFullscreenElement: boolean;
        webkitExitFullscreen: () => {};
    }

    interface HTMLCanvasElement {
        webkitRequestFullscreen: () => {};
    }
}

type LessonListener = "resize" | "dblclick";

@Component({
    layout: "fullscreen",
})
export default class ResizingLesson extends LessonSetupMixin {
    controls!: OrbitControls;
    camera!: PerspectiveCamera;
    canvas!: HTMLCanvasElement;

    listeners: { [key in LessonListener]: () => void } = {
        resize: () => {},
        dblclick: () => {},
    };

    mounted() {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.setUpSizes();

        this.setUp(false);
        this.addCube();

        this.setUpResizeListener();
        this.setUpDoubleClickListener();

        this.setUpOrbitControls();

        this.setUpAnimation();
        this.startAnimation();
    }

    destroyed() {
        this.removeListeners();
    }

    setUpSizes() {
        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight,
        };
    }

    setUpResizeListener() {
        this.listeners.resize = () => {
            this.setUpSizes();

            this.camera.aspect = this.sizes.width / this.sizes.height;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(this.sizes.width, this.sizes.height);

            // You can increase the pixelRatio to improve the image quality
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        };
        window.addEventListener("resize", this.listeners.resize);
    }

    setUpDoubleClickListener() {
        this.listeners.dblclick = () => {
            // This has compatibility with Safari (webkit)
            const fullscreenElement =
                document.fullscreenElement || document.webkitFullscreenElement;

            if (!fullscreenElement) {
                if (this.canvas.requestFullscreen) {
                    // Avoid "Uncaught in promise" error, because we truly don't care about it
                    this.canvas.requestFullscreen().catch(() => {});
                } else if (this.canvas.webkitRequestFullscreen) {
                    this.canvas.webkitRequestFullscreen();
                }
            } else if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        };
        window.addEventListener("dblclick", this.listeners.dblclick);
    }

    removeListeners() {
        window.removeEventListener("resize", this.listeners.resize);
        window.removeEventListener("dblclick", this.listeners.dblclick);
    }

    setUpAnimation() {
        this.animation = (_: number) => {
            this.camera.lookAt(this.cube.position);
        };
    }
}
</script>
