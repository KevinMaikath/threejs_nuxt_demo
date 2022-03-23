<template>
    <canvas ref="canvas"></canvas>
</template>

<script lang="ts">
import Component from "vue-class-component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as THREE from "three";
import { LoadingManager, Texture, TextureLoader } from "three";
import LessonSetupMixin from "~/mixins/lesson-setup.vue";

@Component
export default class TexturesLesson extends LessonSetupMixin {
    canvas!: HTMLCanvasElement;
    controls!: OrbitControls;

    colorImage!: HTMLImageElement;
    colorTexture!: Texture;
    alphaTexture!: Texture;
    ambientOcclusionTexture!: Texture;
    heightTexture!: Texture;
    metalnessTexture!: Texture;
    normalTexture!: Texture;
    roughnessTexture!: Texture;

    loadingManager!: LoadingManager;
    textureLoader!: TextureLoader;

    /**
     * General Texture tips for optimization. We have to consider 3 main things about the Textures that we are using:
     *
     * - File Weight: since the users have to download the textures, the lighter the files the faster they will load.
     *      - JPG: lossy compression but lighter.
     *      - PNG: lossless compression but heavier.
     *
     * - Size (resolution): the smaller the better for the GPU. Also, since Three.js is going to mip-map the texture, it
     *      should have a size that is power of 2 (1024x1024, 256x256, 512x2048).
     *
     * - Data:
     *      - Sometimes it's better to have a texture composed by color + alpha than a color image with transparency.
     *      - Normal textures have to be very accurate, so it's better to use PNG.
     *      - You can combine different data in one texture by using red, blue, green and alpha channels.
     */
    mounted() {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.setUpSizes();
        this.setUp();

        // this.loadColorImageJS();

        this.setUpLoadingManager();
        this.setUpTextureLoader();
        this.loadColorImageTextureLoader();
        // this.loadAllTextures();

        // this.transformColorTexture();
        this.changeColorTextureMipMapping();

        this.addCube();
        this.setUpOrbitControls();

        this.setUpAnimation();
        this.startAnimation();
    }

    /**
     * Load an image into a Texture using vanilla JS
     */
    loadColorImageJS() {
        this.colorImage = new Image();
        this.colorImage.src = "/textures/door/color.jpg";

        // We already set the image to the texture because we don't know how much time
        // will it take to load
        this.colorTexture = new THREE.Texture(this.colorImage);

        // You can also use image.onload = () => {}
        this.colorImage.addEventListener("load", () => {
            // Once the image is loaded, we update the texture
            this.colorTexture.needsUpdate = true;
        });
    }

    setUpLoadingManager() {
        // The LoadingManager will homogenize the callbacks for all the loading processes
        this.loadingManager = new THREE.LoadingManager();

        // this.loadingManager.onStart = () => {
        //     console.log("loading started!");
        // };
        //
        // this.loadingManager.onProgress = (_, loaded) => {
        //     console.log("progress: " + loaded);
        // };
        //
        // this.loadingManager.onLoad = () => {
        //     console.log("loading finished!");
        // };
        //
        // this.loadingManager.onError = (url) => {
        //     console.log("loading error: ", url);
        // };
    }

    setUpTextureLoader() {
        // A single TextureLoader can be used to load multiple Texture
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    }

    /**
     * Load an image into a Texture using the TextureLoader
     */
    loadColorImageTextureLoader() {
        this.colorTexture = this.textureLoader.load(
            // "/textures/door/color.jpg"
            // "/textures/checkerboard-1024x1024.png"
            "/textures/checkerboard-8x8.png"
            // We can add onLoad, onProgress and onError callbacks
        );
    }

    loadAllTextures() {
        this.colorTexture = this.textureLoader.load("/textures/door/color.jpg");
        this.alphaTexture = this.textureLoader.load("/textures/door/alpha.jpg");
        this.ambientOcclusionTexture = this.textureLoader.load(
            "/textures/door/ambientOcclusion.jpg"
        );
        this.heightTexture = this.textureLoader.load(
            "/textures/door/height.jpg"
        );
        this.metalnessTexture = this.textureLoader.load(
            "/textures/door/metalness.jpg"
        );
        this.normalTexture = this.textureLoader.load(
            "/textures/door/normal.jpg"
        );
        this.roughnessTexture = this.textureLoader.load(
            "/textures/door/roughness.jpg"
        );
    }

    transformColorTexture() {
        // It's possible to modify the Texture in different ways.
        // this.colorTexture.repeat.x = 2;
        // this.colorTexture.repeat.y = 3;

        // In order to make "repeat" work properly, we have to set the values for the Texture wrapS/wrapT
        // to a type of Wrapping (RepeatWrapping / MirroredRepeatWrapping)
        this.colorTexture.wrapS = THREE.MirroredRepeatWrapping;
        this.colorTexture.wrapT = THREE.MirroredRepeatWrapping;

        this.colorTexture.offset.x = 0.5;
        this.colorTexture.offset.y = 0.5;

        this.colorTexture.rotation = Math.PI * 0.25; // rad

        // By default, the rotation takes one corner as the center of the rotation.
        // However, we can move the center of the Texture to rotate it from the real center.
        this.colorTexture.center.x = 0.5;
        this.colorTexture.center.y = 0.5;
    }

    changeColorTextureMipMapping() {
        /**
         * Mip-mapping is a process done automatically by Three.js where a Texture gets smaller version of itself to
         * be able to render it in different surfaces and scenarios. We can see it when we zoom a lot into the cube
         * (the texture will look blurry)
         *
         * Most of the mip-mapping filters in Three.js have similar results, but some of them can be better depending
         * on the situation.
         */

        // Minification filter (when the rendered texture is smaller than the base image)
        // Test with checkerboard-1024x1024.png
        this.colorTexture.minFilter = THREE.NearestFilter;

        // Magnification filter (when the rendered texture is larger than the base image)
        // Test with checkerboard-1024x1024.png
        this.colorTexture.magFilter = THREE.NearestFilter;

        /**
         * Overall, NearestFilter is the best in performance.
         *
         * Moreover, when using NearestFilter in minFilter we don't need min-mapping. So we can disable it.
         */
        this.colorTexture.generateMipmaps = false;
    }

    addCube() {
        /**
         * Three.js will handle the UV Unwrapping for us. The UV Unwrapping is some kind of 2D mapping of the texture
         * that specifies how is it positioned in the Geometry.
         *
         * If we create our custom Geometry or Texture, it's possible that we need to specify our own UV wrapping.
         * We can view the current UV Unwrapping with geometry.attributes.uv
         */
        const geometry = new THREE.BoxGeometry();
        // We create the Material with our texture
        const material = new THREE.MeshBasicMaterial({
            map: this.colorTexture,
        });
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);
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
