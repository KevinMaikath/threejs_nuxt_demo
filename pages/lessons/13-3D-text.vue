<template>
    <canvas ref="canvas"></canvas>
</template>

<script lang="ts">
import Component from "vue-class-component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import * as THREE from "three";
import { Mesh, MeshMatcapMaterial, Texture, TextureLoader } from "three";
import LessonSetupMixin from "~/mixins/lesson-setup.vue";

@Component
export default class ThreeDTextLesson extends LessonSetupMixin {
    canvas!: HTMLCanvasElement;
    controls!: OrbitControls;

    textureLoader!: TextureLoader;
    texture!: Texture;

    fontLoader!: FontLoader;
    font!: Font;

    textGeometry!: TextGeometry;
    text!: Mesh;

    async mounted() {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.setUpSizes();
        this.setUp();

        this.setUpFontLoader();
        await this.loadHelvetikerFont();
        this.setUpTextGeometry();

        this.setUpTextureLoader();

        this.addText();
        this.addDonuts();

        this.setUpOrbitControls();
        this.setUpAnimation();
        this.startAnimation();
    }

    setUpFontLoader() {
        // We can't use FontLoad from THREE.FontLoad
        const { FontLoader } = require("three/examples/jsm/loaders/FontLoader");

        // We can use one FontLoader to load multiple fonts.
        this.fontLoader = new FontLoader();
    }

    async loadHelvetikerFont() {
        this.font = await this.fontLoader.loadAsync(
            "/typefaces/helvetiker_regular.typeface.json"
        );
    }

    setUpTextGeometry() {
        // We can't use TextBufferGeometry from THREE.TextBufferGeometry
        const {
            TextGeometry,
        } = require("three/examples/jsm/geometries/TextGeometry");

        /**
         * In terms of performance, the lower the curveSegments and bevelSegments the better. That will get us a
         * low-polly result but with better performance.
         */
        this.textGeometry = new TextGeometry("Hello Three.js", {
            font: this.font,
            size: 0.5,
            height: 0.2,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelOffset: 0,
            bevelSegments: 5,
        });

        /**
         * We can ask Three.js to compute the bounding of the Geometry as a box (instead of the default sphere) to be
         * able to get the size of it more precisely.
         */
        this.textGeometry.computeBoundingBox();

        /**
         * We can translate the Geometry to the center of the scene, instead of moving the Mesh. This way the Mesh
         * position will still be the center of the scene.
         */
        // const { max: boundingMax } = this.textGeometry.boundingBox as Box3;
        // this.textGeometry.translate(
        //     -boundingMax.x * 0.5,
        //     -boundingMax.y * 0.5,
        //     -boundingMax.z * 0.5
        // );

        /**
         * We can be even more precise if we remove the bevel size and thickness.
         */
        // this.textGeometry.translate(
        //     -(boundingMax.x - 0.02) * 0.5, // Subtract bevel size
        //     -(boundingMax.y - 0.02) * 0.5, // Subtract bevel size
        //     -(boundingMax.z - 0.03) * 0.5 // Subtract bevel thickness
        // );

        /**
         * Or we can just use the center() method to so everything for us.
         */
        this.textGeometry.center();
    }

    setUpTextureLoader() {
        this.textureLoader = new THREE.TextureLoader();
    }

    addText() {
        const material = new MeshMatcapMaterial();
        material.matcap = this.textureLoader.load("/textures/matcaps/8.png");

        this.text = new THREE.Mesh(this.textGeometry, material);
        this.scene.add(this.text);
    }

    addDonuts() {
        const donutGeometry = new THREE.TorusGeometry(0.3, 0.2, 20, 45);

        const matcapTexture = this.textureLoader.load(
            "/textures/matcaps/3.png"
        );
        const donutMaterial = new THREE.MeshMatcapMaterial({
            matcap: matcapTexture,
        });

        for (let i = 0; i < 100; i++) {
            const donut = new THREE.Mesh(donutGeometry, donutMaterial);

            // Set a random position
            donut.position.x = (Math.random() - 0.5) * 10;
            donut.position.y = (Math.random() - 0.5) * 10;
            donut.position.z = (Math.random() - 0.5) * 10;

            // Set a random rotation. There's no need to rotate the Z axis since the donut is symmetric
            donut.rotation.x = Math.random() * Math.PI;
            donut.rotation.y = Math.random() * Math.PI;

            // Set a random scale
            const scale = Math.random();
            donut.scale.set(scale, scale, scale);

            this.scene.add(donut);
        }
    }

    setUpAnimation() {
        this.animation = (_: number) => {
            this.camera.lookAt(this.text.position);
        };
    }
}
</script>

<style scoped lang="scss"></style>
