<template>
    <div>
        <canvas ref="canvas" class="full-screen"></canvas>
        <div
            id="loading-bar"
            ref="loading_bar"
            :class="{ finished: loaded }"
        ></div>
    </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
import * as THREE from "three";
import {
    CubeTexture,
    CubeTextureLoader,
    DirectionalLight,
    LoadingManager,
    Mesh,
    MeshStandardMaterial,
    PlaneGeometry,
    ShaderMaterial,
} from "three";
import { gsap } from "gsap";
import LessonSetupMixin from "~/mixins/lesson-setup.vue";

@Component
export default class IntroAndLoadingLesson extends LessonSetupMixin {
    canvas!: HTMLCanvasElement;
    controls!: OrbitControls;

    gui!: GUI;

    directionalLight!: DirectionalLight;

    gltfLoader!: any;
    cubeTextureLoader!: CubeTextureLoader;

    loadingManager!: LoadingManager;
    loadingBar!: HTMLDivElement;
    loaded: boolean = false;
    progress: number = 0;

    environmentMap!: CubeTexture;

    overlayMaterial!: ShaderMaterial;
    overlay!: Mesh;

    ENV_MAP_INTENSITY = 2.5;

    /**
     * There are multiple ways to add a loading animation:
     * - Animate the <canvas> in CSS
     * - Animate a <div> above the <canvas> in CSS
     * - Animate a black rectangle in front of the camera
     *
     * In general, it's recommended to keep everything inside WebGL. So we will go for the 3rd option here.
     */
    mounted() {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.setUp();
        this.setUpOrbitControls();

        this.configureRenderer();

        this.addLoadingOverlay();
        this.addLoadingBar();

        this.setUpLoaders();

        this.addLights();
        this.loadEnvironmentMap();
        this.loadHelmet();

        this.setUpAnimation();
        this.startAnimation();
    }

    // <From Lesson 25>

    configureRenderer() {
        this.renderer.physicallyCorrectLights = true;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 3;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    addLights() {
        this.directionalLight = new DirectionalLight("#ffffff", 3);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.camera.far = 15;
        this.directionalLight.shadow.mapSize.set(1024, 1024);
        this.directionalLight.shadow.normalBias = 0.05;
        this.directionalLight.position.set(0.25, 3, -2.25);
        this.scene.add(this.directionalLight);
    }

    loadEnvironmentMap() {
        this.environmentMap = this.cubeTextureLoader.load([
            "/textures/environmentMaps/0/px.jpg",
            "/textures/environmentMaps/0/nx.jpg",
            "/textures/environmentMaps/0/py.jpg",
            "/textures/environmentMaps/0/ny.jpg",
            "/textures/environmentMaps/0/pz.jpg",
            "/textures/environmentMaps/0/nz.jpg",
        ]);
        this.environmentMap.encoding = THREE.sRGBEncoding;

        this.scene.background = this.environmentMap;
        this.scene.environment = this.environmentMap;
    }

    async loadHelmet() {
        const gltf = await this.gltfLoader.loadAsync(
            "/models/FlightHelmet/glTF/FlightHelmet.gltf"
        );

        gltf.scene.scale.set(10, 10, 10);
        gltf.scene.position.set(0, -4, 0);
        gltf.scene.rotation.y = Math.PI * 0.5;
        this.scene.add(gltf.scene);

        this.updateAllMaterials();
    }

    updateAllMaterials() {
        this.scene.traverse((child) => {
            if (
                child instanceof Mesh &&
                child.material instanceof MeshStandardMaterial
            ) {
                child.material.envMapIntensity = this.ENV_MAP_INTENSITY;
                child.material.needsUpdate = true;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    // <From Lesson 25/>

    setUpLoaders() {
        this.loadingBar = this.$refs.loading_bar as HTMLDivElement;
        this.loadingManager = new LoadingManager(
            () => {
                // Make the overlay fade away once everything is loaded
                gsap.to(this.overlayMaterial.uniforms.uAlpha, {
                    duration: 3,
                    value: 0,
                });

                // Wait 0.5s for the last progress animation before starting the finish animation
                // (setTimeout also works)
                gsap.delayedCall(0.5, () => {
                    // Remove the inline style of the loading bar so that the finish animation works properly
                    if (this.loadingBar) {
                        this.loadingBar.style.transform = ``;
                    }

                    this.loaded = true;
                });
            },
            (_, loaded, total) => {
                this.progress = loaded / total;

                // Scale the loading bar according to the current progress
                if (this.loadingBar) {
                    this.loadingBar.style.transform = `scaleX(${this.progress})`;
                }
            }
        );

        const { GLTFLoader } = require("three/examples/jsm/loaders/GLTFLoader");
        this.gltfLoader = new GLTFLoader(this.loadingManager);
        this.cubeTextureLoader = new CubeTextureLoader(this.loadingManager);
    }

    /**
     * Add a black plane that faces the camera. This plane is intended to fade away once all the textures and models are
     * loaded in the scene.
     */
    addLoadingOverlay() {
        // The clip space goes from -1 to 1, so the Plane needs to have a size of 2x2 in order to fit exactly the whole
        // screen
        const overlayGeometry = new PlaneGeometry(2, 2, 1, 1);

        // Use a Vertex shader to make the plane face the camera at any moment
        this.overlayMaterial = new ShaderMaterial({
            // Variables used inside the shaders
            uniforms: {
                uAlpha: { value: 1 },
            },
            vertexShader: `
                void main()
                {
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uAlpha;

                void main()
                {
                    gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
                }
            `,

            // This is necessary if we want to make the alpha value of the texture work
            transparent: true,
        });
        this.overlay = new Mesh(overlayGeometry, this.overlayMaterial);
        this.scene.add(this.overlay);
    }

    /**
     * Add a loading bar that will be displayed on top of the overlay.
     * Here we're doing it with an HTML <div> but we could've done it with a plane with a Shader material.
     */
    addLoadingBar() {}

    setUpAnimation() {
        // const clock = new THREE.Clock();
        // let previousTime = 0;

        this.animation = (_: number) => {
            this.controls.update();
        };
    }
}
</script>

<style lang="scss" scoped>
$loading-bar-height: 2px;

#loading-bar {
    position: absolute;
    top: calc(50% - (#{$loading-bar-height} / 2));
    width: 100%;
    height: $loading-bar-height;
    background-color: #ffffff;

    // Initial scale
    transform: scaleX(0);
    transform-origin: top left;

    transition: transform 0.2s ease-out;

    // This tells the browser what CSS properties are going to change in the HTML element.
    // This improve the performance of transitions.
    will-change: transform;

    &.finished {
        transform-origin: top right; // Make it go to the right
        transition: transform 1s ease-in-out;
    }
}
</style>
