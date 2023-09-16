<template>
    <canvas ref="canvas"></canvas>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import * as THREE from "three";
// import {
//     BoxGeometry,
//     Mesh,
//     MeshBasicMaterial,
//     PerspectiveCamera,
//     Scene,
//     WebGLRenderer,
// } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";

type FrameRequestCallback = (time: number) => void;

@Component
export default class Test extends Vue {
    renderer!: THREE.WebGLRenderer;
    scene!: THREE.Scene;
    camera!: THREE.PerspectiveCamera;

    cube!: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
    controls?: OrbitControls;

    gui?: GUI;

    resizeListener?: () => void;

    private _animation?: FrameRequestCallback;

    sizes = {
        width: 1000,
        height: 750,
    };

    mounted() {
        this.setUp();
    }

    setUp(resize: boolean = true) {
        // Set up the window size before creating the renderer
        // if (resize) {
        //     this.setUpSizes();
        //     this.setUpResizing();
        // }

        this.setUpRenderer();
        // this.setUpScene();
        // this.setUpCamera();
    }

    protected setUpRenderer() {
        const canvas = this.$refs.canvas as HTMLCanvasElement;
        this.renderer = new THREE.WebGLRenderer({ canvas });

        const { width, height } = this.sizes;
        this.renderer.setSize(width, height);
    }

    // protected setUpScene() {
    //     this.scene = new THREE.Scene();
    // }
    //
    // protected setUpCamera() {
    //     const { width, height } = this.sizes;
    //     this.camera = new THREE.PerspectiveCamera(75, width / height);
    //     this.camera.position.z = 3;
    //     this.scene.add(this.camera);
    // }
}
</script>

<style scoped lang="scss"></style>
