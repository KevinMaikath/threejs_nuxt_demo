<template>
    <canvas ref="canvas" class="full-screen"></canvas>
</template>

<script lang="ts">
import Component from "vue-class-component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
import * as THREE from "three";
import { AmbientLight, DirectionalLight, Mesh } from "three";
import LessonSetupMixin from "~/mixins/lesson-setup.vue";

@Component
export default class CustomBlenderModels extends LessonSetupMixin {
    canvas!: HTMLCanvasElement;
    controls!: OrbitControls;

    gui!: GUI;

    plane!: Mesh;
    ambientLight!: AmbientLight;
    directionalLight!: DirectionalLight;

    gltfLoader!: any;

    mounted() {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.setUp();
        this.setUpOrbitControls();

        this.setUpDefaultScene();

        this.addGLTFLoader();
        this.addBurger();

        this.setUpAnimation();
        this.startAnimation();
    }

    /**
     * Set up the default components of the scene.
     */
    setUpDefaultScene() {
        const material = new THREE.MeshStandardMaterial();
        material.roughness = 0.8;
        material.side = THREE.DoubleSide;

        // Plane
        this.plane = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 10, 100, 100),
            material
        );
        this.plane.rotation.x = -Math.PI / 2;
        this.scene.add(this.plane);

        // Ambient Light
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);

        // Directional Light
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        this.directionalLight.position.set(2, 2, -1);
        this.scene.add(this.directionalLight);
    }

    addGLTFLoader() {
        // Importing this at the beginning of the file was causing errors
        const { GLTFLoader } = require("three/examples/jsm/loaders/GLTFLoader");

        this.gltfLoader = new GLTFLoader();
    }

    // This burger has been made by myself using Blender
    addBurger() {
        this.gltfLoader.load("/models/Burger/Burger.glb", (gltf) => {
            gltf.scene.scale.set(0.2, 0.2, 0.2);
            this.scene.add(gltf.scene);
        });
    }

    setUpAnimation() {
        this.animation = (_: number) => {
            this.controls.update();
        };
    }
}
</script>
