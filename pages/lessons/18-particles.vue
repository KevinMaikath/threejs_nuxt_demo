<template>
    <canvas ref="canvas" class="full-screen"></canvas>
</template>

<script lang="ts">
import Component from "vue-class-component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
import * as THREE from "three";
import { BufferGeometry, Points, PointsMaterial } from "three";
import LessonSetupMixin from "~/mixins/lesson-setup.vue";

@Component
export default class ParticlesLesson extends LessonSetupMixin {
    canvas!: HTMLCanvasElement;
    controls!: OrbitControls;

    particlesGeometry!: BufferGeometry;
    particlesMaterial!: PointsMaterial;
    particles!: Points;
    particlesCount = 5000;

    gui!: GUI;

    mounted() {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.setUp();

        this.addParticles();

        this.setUpGui();

        this.setUpOrbitControls();
        this.setUpAnimation();
        this.startAnimation();
    }

    addParticles() {
        // this.particlesGeometry = new SphereGeometry(1, 32, 32);
        this.particlesGeometry = this.createCustomGeometry();

        // Texture
        const textureLoader = new THREE.TextureLoader();
        const particlesTexture = textureLoader.load(
            "/textures/particles/11.png"
        );

        // Particles use PointsMaterial as the default material.
        this.particlesMaterial = new PointsMaterial({
            size: 0.15, // Size of the particles
            // Specify if the distant particles should look smaller than the close ones
            sizeAttenuation: true,
            // color: "#ff88cc",

            // Plain texture
            // map: particlesTexture,

            // Transparent texture
            transparent: true,
            alphaMap: particlesTexture,

            /**
             * Even with "transparent" and "alphaTexture", we can still see the black edges of some particles because
             * WebGL doesn't know which one is in front of which.
             * The possible solutions are:
             */

            // 1. Using "alphaTest" with value higher than 0. That will make WebGL avoid rendering pixels with alpha
            // values of 0.
            // alphaTest: 0.001,

            // 2. Using "depthTest" as false. When true (default), WebGL will try to compare the depth of the object
            // that it's drawing with the objects that are already drawn.
            // This option might cause problems with other objects in the scene.
            // depthTest: false,

            // 3. Using "depthWrite" as false. When false, WebGL will do the same as "depthTest = false" but taking into
            // account other objects in the scene.
            depthWrite: false,

            // 4. Using blending. WebGL currently draws pixels one on top of the other. With blending, WebGL can add the
            // color of a new pixel to the color of the pixel already drawn.
            // This solution can impact the performance.
            blending: THREE.AdditiveBlending,

            // Allow to set the RGB color from the colorsAttribute in this.createCustomGeometry. The initial color of
            // the material will impact the color set from there.
            vertexColors: true,
        });

        this.particles = new Points(
            this.particlesGeometry,
            this.particlesMaterial
        );
        this.scene.add(this.particles);
    }

    createCustomGeometry(): BufferGeometry {
        const geometry = new BufferGeometry();

        // Each particle position needs 3 values (x,y,z)
        const arrayLength = this.particlesCount * 3;
        const positions = new Float32Array(arrayLength);

        // Each color for each particle needs 3 values (R,G,B)
        const colors = new Float32Array(arrayLength);
        const size = 10;

        for (let i = 0; i < arrayLength; i += 1) {
            positions[i] = (Math.random() - 0.5) * size;
            colors[i] = Math.random();
        }

        const positionsAttribute = new THREE.BufferAttribute(positions, 3);
        geometry.setAttribute("position", positionsAttribute);

        // Apart from this, we need to set "vertexColors = true" to the particles material.
        const colorsAttribute = new THREE.BufferAttribute(colors, 3);
        geometry.setAttribute("color", colorsAttribute);

        return geometry;
    }

    setUpGui() {
        const { GUI } = require("dat.gui");
        this.gui = new GUI({ name: "main-gui" });

        // Particles
        const materialFolder = this.gui.addFolder("Material");
        materialFolder.closed = false;
        materialFolder.add(this.particlesMaterial, "size", 0, 0.5, 0.01);

        // no effect with GUI
        // materialFolder.add(this.particlesMaterial, "sizeAttenuation");
        // materialFolder.addColor(this.particlesMaterial, "color");
    }

    setUpAnimation() {
        const clock = new THREE.Clock();

        this.animation = (_: number) => {
            const elapsedTime = clock.getElapsedTime();

            // A Points object inherits from Object3D, so we can animate it and it will affect to all the particles
            // this.particles.rotation.y = elapsedTime * 0.2;

            this.animateParticlesFromAttribute(elapsedTime);
        };
    }

    /**
     * Update the position attribute from this.particlesGeometry in order to animate the particles.
     *
     * This is just an example. Modifying the values of an attribute directly on the array is not a good practice and
     * it can lead to performance issues.
     *
     * The best way to animate particles is by using custom shaders instead of PointsMaterial.
     *
     * @param elapsedTime
     */
    animateParticlesFromAttribute(elapsedTime: number) {
        for (let i = 0; i < this.particlesCount; i++) {
            // Each particle position has 3 values (x,y,z)
            const i3 = i * 3;

            const xValue = this.particlesGeometry.attributes.position.array[i3];

            // @ts-ignore
            // This will animate the y attribute of the position
            this.particlesGeometry.attributes.position.array[i3 + 1] = Math.sin(
                elapsedTime + xValue
            );
        }

        // When directly updating an attribute value, we need to tell WebGl that we are updating it in order to
        // be updated when rendered
        this.particlesGeometry.attributes.position.needsUpdate = true;
    }
}
</script>
