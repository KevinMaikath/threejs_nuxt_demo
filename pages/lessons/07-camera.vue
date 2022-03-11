<template>
    <canvas ref="canvas"></canvas>
</template>

<script lang="ts">
import Component from "vue-class-component";
import { Clock } from "three";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import LessonSetupMixin from "~/mixins/lesson-setup.vue";

type LessonListener = "mousemove";

@Component
export default class CameraLesson extends LessonSetupMixin {
    clock!: Clock;

    cursorPosition = {
        x: 0,
        y: 0,
    };

    controls!: OrbitControls;

    listeners: { [key in LessonListener]: (event?: any) => void } = {
        mousemove: () => {},
    };

    mounted() {
        this.setUp();
        this.addCube();
        this.postCameraSetup();
        this.setUpClock();

        // this.setUpMouseListener();

        this.setUpOrbitControls();

        this.setUpAnimation();
        this.startAnimation();
    }

    destroyed() {
        this.removeMouseListener();
    }

    setUpCamera() {
        this.setUpPerspectiveCamera();
    }

    /**
     * PerspectiveCamera can take 4 parameters:
     *  - fov: vertical field of view. Recommended values between 45 and 75 (which is already high)
     *  - aspect ratio
     *  - near: minimum distance from the camera to any object in order for the object to be rendered.
     *  - far: same as "near" but maximum distance
     *
     *  Avoid putting extreme values to near and far (like 0.0000001 or 9999999.9) to avoid a bug called
     *  z-fighting (if 2 objects are too close, the camera won't be able to decide which one is in front
     *  of the other)
     */
    setUpPerspectiveCamera() {
        const { width, height } = this.sizes;
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
        this.scene.add(this.camera);
    }

    /**
     * OrthographicCamera can take 6 parameters:
     * - left
     * - right
     * - top
     * - bottom
     * - near
     * - far
     *
     * left, right, top and bottom define the portion of the scene that will be rendered.
     * Each value is the position of the border of the corresponding side from the center of the camera.
     * For example, left = -1 and right = 1 will show a view of 2 units of width.
     *
     * near and far are the same as with PerspectiveCamera.
     */
    setUpOrthographicCamera() {
        // With this values, the cube will be more like a rectangle because we're rendering a square in a
        // rectangle canvas. If the canvas had the same height and width, the cube would be shown properly.
        // this.camera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.1, 100);

        // The correct solution to don't have the objects distorted is to calculate the horizontal distances using
        // the aspect ratio of the canvas.
        const { width, height } = this.sizes;
        const aspectRatio = width / height;
        this.camera = new THREE.OrthographicCamera(
            aspectRatio * -2,
            aspectRatio * 2,
            2,
            -2,
            0.1,
            100
        );

        this.scene.add(this.camera);
    }

    postCameraSetup() {
        // this.camera.position.set(3, 3, 3);
        this.camera.position.z = 3;
        this.camera.lookAt(this.cube.position);
    }

    setUpClock() {
        this.clock = new THREE.Clock();
    }

    setUpMouseListener() {
        this.listeners.mousemove = (event) => {
            this.cursorPosition.x =
                (event.clientX / this.sizes.width - 0.5) * 2;
            this.cursorPosition.y =
                (event.clientY / this.sizes.height - 0.5) * 2;
        };
        window.addEventListener("mousemove", this.listeners.mousemove);
    }

    removeMouseListener() {
        window.removeEventListener("mousemove", this.listeners.mousemove);
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

        // We can set the default camera target
        // this.controls.target.y = 2
        // this.controls.update()

        // We can enable damping (animation smoothness an acceleration)
        this.controls.enableDamping = true;
        // We need to update the controls in each frame (in the animation)
    }

    setUpAnimation() {
        this.animation = (_: number) => {
            // const elapsedTime = this.clock.getElapsedTime();
            // this.cube.rotation.y = elapsedTime;

            // this.camera.position.x = this.cursorPosition.x * -3;
            // this.camera.position.y = this.cursorPosition.y * 3;

            // this.camera.position.x =
            //     -2 * Math.sin(this.cursorPosition.x * Math.PI);
            // this.camera.position.z =
            //     2 * Math.cos(this.cursorPosition.x * Math.PI);
            //
            // this.camera.position.y = this.cursorPosition.y * -2;

            this.controls.update();

            this.camera.lookAt(this.cube.position);
        };
    }
}
</script>

<style scoped lang="scss"></style>
