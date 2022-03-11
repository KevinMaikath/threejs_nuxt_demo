<template>
    <canvas ref="canvas"></canvas>
</template>

<script lang="ts">
import Component from "vue-class-component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
import { gsap } from "gsap";
import LessonSetupMixin from "~/mixins/lesson-setup.vue";

@Component
export default class DebugLesson extends LessonSetupMixin {
    canvas!: HTMLCanvasElement;
    controls!: OrbitControls;
    gui!: GUI;

    guiParameters = {
        cubeColor: 0x00ff00,
        spin: this.spin,
    };

    mounted() {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.setUpSizes();
        this.setUp();

        this.addCube();
        this.setUpOrbitControls();

        this.setUpGui();
        this.setUpColorChangeGui();
        this.setUpFunctionGui();

        this.setUpAnimation();
        this.startAnimation();
    }

    setUpOrbitControls() {
        if (!this.$refs.canvas) return;

        const {
            OrbitControls,
        } = require("three/examples/jsm/controls/OrbitControls");

        this.controls = new OrbitControls(
            this.camera,
            this.$refs.canvas as HTMLElement
        );

        this.controls.enableDamping = true;
    }

    setUpGui() {
        // The library dat.gui has to be imported locally to avoid the error
        // "window is not defined" on every page reload
        const { GUI } = require("dat.gui");
        this.gui = new GUI();

        /**
         * TIPS:
         *  We can hide the gui -> this.gui.hide()
         *
         *  We can initialize the gui closed -> new GUI({ closed: true })
         *      (also this.gui.close())
         *
         *  We can set the width of the GUI -> new GUI({ width: 400 })
         *      (also can Drag-n-Drop the UI)
         */

        this.gui.add(this.cube.position, "x", -3, 3, 0.01);
        this.gui.add(this.cube.position, "y", -3, 3, 0.01).name("y-axis");
        this.gui.add(this.cube.position, "z").min(-3).max(3).step(0.01);

        this.gui.add(this.cube, "visible");
        this.gui.add(this.cube.material, "wireframe");
    }

    setUpColorChangeGui() {
        // Colors have to be set with addColor()
        this.gui
            .addColor(this.guiParameters, "cubeColor")
            // Since we have to update the color from guiParameters instead of directly in the cube
            // (it's not possible with GUI), we can listen to the GUI value change and then update the
            // cube color in the callback
            .onChange(() => {
                // @ts-ignore
                this.cube.material.color.set(this.guiParameters.cubeColor);
            });
    }

    setUpFunctionGui() {
        this.gui.add(this.guiParameters, "spin");
    }

    spin() {
        gsap.to(this.cube.rotation, {
            duration: 1,
            y: this.cube.rotation.y + Math.PI * 2,
        });
    }

    setUpAnimation() {
        this.animation = (_: number) => {
            this.controls.update();
            this.camera.lookAt(this.cube.position);
        };
    }
}
</script>

<style scoped lang="scss">
canvas {
    max-height: 100%;
}
</style>
