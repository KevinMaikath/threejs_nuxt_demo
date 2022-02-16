<template>
    <canvas ref="canvas"></canvas>
</template>

<script lang="ts">
import Component from "vue-class-component";
import * as THREE from "three";
import { Clock } from "three";
import { gsap } from "gsap";
import LessonSetupMixin from "~/mixins/lesson-setup.vue";

@Component
export default class AnimationsLesson extends LessonSetupMixin {
    // We save the last time (Date.now()) here to be able to access it in the next
    // animation() iteration
    lastTime: number = 0;

    clock!: Clock;

    mounted() {
        this.setUp();
        this.addCube();

        this.play();

        // this.lastTime = Date.now();
        this.setUpClock();
        // this.setUpGsap();

        this.setUpAnimation();
        this.startAnimation();
    }

    setUpAnimation() {
        this.animation = this.clockAnimation;
    }

    /**
     * Rotate the cube with the default frame rate.
     */
    defaultAnimation(_: number) {
        this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;
    }

    /**
     * Rotate the cube at the same speed for any frame rate by
     * multiplying the rotation value by the timeDelta in each iteration
     */
    timeDeltaAnimation(_: number) {
        // If we get the timeDelta and multiply the rotation by it, we make
        // sure that the object will rotate at the same speed in any kind of
        // monitor (in any kind of fps)
        const currentTime = Date.now();
        const timeDelta = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.cube.rotation.x += 0.001 * timeDelta;
        this.cube.rotation.y += 0.001 * timeDelta;
    }

    setUpClock() {
        this.clock = new THREE.Clock();
    }

    /**
     * Rotate the cube by the value of the clocks elapsedTime. Since the rotation
     * depends on the time from the clock instead of rotating a constant amount per
     * frame rate, the cube will rotate at the same speed in any frame rate.
     */
    clockAnimation(_: number) {
        // elapsedTime is the time in seconds since the clock was initialized
        const elapsedTime = this.clock.getElapsedTime();

        // This time we don't increase the value ot the rotation in each iteration.
        // Since the elapsedTime will increase it's value in each iteration, we set
        // the rotation value equal to the elapsedTime. Otherwise the cube would just
        // accelerate infinitely
        // this.cube.rotation.x = elapsedTime;
        // this.cube.rotation.y = elapsedTime;

        // We can make the cube do a full revolution per second like this
        // this.cube.rotation.x = elapsedTime * Math.PI * 2

        // We can have oscillations with the help of trigonometry
        this.cube.position.x = Math.sin(elapsedTime * 1.5);
        this.cube.position.y = Math.cos(elapsedTime * 1.5);
        this.cube.position.z = Math.tan(elapsedTime * 1.5);

        this.camera.lookAt(this.cube.position);
    }

    /**
     * Specify all the animations using GSAP.
     * GSAP will call requestAnimationFrame internally to get it's own clock to handle
     * the animations timing, but it's still necessary to call renderer.render() to
     * make the animations happen (this is done by gsapAnimation).
     */
    setUpGsap() {
        // This will update the cube.position until x=2 in 1 time unit with 1 unit time of delay.
        gsap.to(this.cube.position, { duration: 1, delay: 1, x: 2 });
        gsap.to(this.cube.position, { duration: 1, delay: 2, x: 0 });
    }

    /**
     * Move the cube using GSAP animation.
     * This callback isn't going to do anything since all the animations are specified in
     * setUpGsap.
     */
    gsapAnimation(_: number) {}
}
</script>
