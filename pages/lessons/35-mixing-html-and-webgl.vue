<template>
    <div>
        <canvas ref="canvas" class="full-screen"></canvas>

        <div
            id="loading-bar"
            ref="loading_bar"
            :class="{ finished: loaded }"
        ></div>

        <div
            v-for="(point, index) in infoPoints"
            :ref="`point_${index}`"
            :key="index"
            class="point"
        >
            <span class="label">{{ index + 1 }}</span>
            <span class="text"
                >Lorem ipsum dolor sit amet, consectetur adipisicing elit.</span
            >
        </div>
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
    Raycaster,
    ShaderMaterial,
    Vector3,
} from "three";
import { gsap } from "gsap";
import LessonSetupMixin from "~/mixins/lesson-setup.vue";

type InfoPoint = {
    position: Vector3;
    element?: HTMLDivElement;
};

@Component
export default class MixingHtmlAndWebGlLesson extends LessonSetupMixin {
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

    infoPoints: InfoPoint[] = [
        { position: new Vector3(1.55, 0.3, -0.6) },
        { position: new Vector3(0.5, 0.8, -1.6) },
        { position: new Vector3(1.6, -1.3, -0.7) },
    ];

    raycaster = new Raycaster();

    mounted() {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.setUp();
        this.camera.position.set(4, 1, -4);
        this.setUpOrbitControls();

        this.configureRenderer();
        this.addLoadingOverlay();
        this.setUpLoaders();

        this.addLights();
        this.loadEnvironmentMap();
        this.loadHelmet();

        this.getInfoPointsRef();

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
            "/models/DamagedHelmet/glTF/DamagedHelmet.gltf"
        );

        gltf.scene.scale.set(2.5, 2.5, 2.5);
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

    // <From Lesson 34>

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

    // <From Lesson 34 />

    /**
     * Get the reference of all the Info Points from the DOM
     */
    getInfoPointsRef() {
        this.infoPoints.forEach((point, index) => {
            const ref = `point_${index}`;
            const refList = this.$refs[ref] as HTMLDivElement[];

            // When the :ref is inside a v-for, it always returns a list of references.
            // Here we assume that the list will have only one item.
            if (refList && refList.length > 0) {
                point.element = refList[0];
            }
        });
    }

    setUpAnimation() {
        // const clock = new THREE.Clock();
        // let previousTime = 0;

        this.animation = (_: number) => {
            this.controls.update();

            // Don't run any logic for the Info points until the scene is ready
            if (!this.loaded) return;

            for (const point of this.infoPoints) {
                if (!point.element) continue;

                const screenPosition = point.position.clone();

                // From the docs: this will project the vector from the world space into the given camera's normalized
                // device coordinate (NDC) space.
                screenPosition.project(this.camera);

                /** Test if the point should be visible right now */

                // Here we can use the screenPosition (NDC) instead of the coordinates of the mouse.
                this.raycaster.setFromCamera(screenPosition, this.camera);
                const intersects = this.raycaster.intersectObjects(
                    this.scene.children,
                    true
                );

                if (intersects.length === 0) {
                    point.element.classList.add("visible");
                } else {
                    // Show the point if there isn't any other object in front of it
                    const intersectionDistance = intersects[0].distance;
                    const pointDistance = point.position.distanceTo(
                        this.camera.position
                    );

                    if (pointDistance < intersectionDistance) {
                        point.element.classList.add("visible");
                    } else {
                        point.element.classList.remove("visible");
                    }
                }

                // Transform the normalized values to pixels in the current viewport.
                const translateX = screenPosition.x * this.sizes.width * 0.5;
                const translateY = -screenPosition.y * this.sizes.height * 0.5;

                point.element.style.transform = `translate(${translateX}px, ${translateY}px)`;
            }
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

.point {
    position: absolute;
    top: 50%;
    left: 50%;

    .label {
        position: absolute;
        top: -20px;
        left: -20px;
        width: 40px;
        height: 40px;

        border-radius: 50%;
        background-color: #00000077;
        border: 1px solid #ffffff77;
        color: #ffffff;

        font-family: Helvetica, Arial, sans-serif;
        text-align: center;
        line-height: 40px;
        font-size: 14px;

        cursor: help;

        // Initial state
        transform: scale(0, 0);
        transition: transform 0.3s;
        will-change: transform;
    }

    .text {
        position: absolute;
        top: 30px;
        left: -120px;
        width: 200px;
        padding: 20px;

        border-radius: 4px;
        background-color: #00000077;
        border: 1px solid #ffffff77;
        color: #ffffff;

        font-family: Helvetica, Arial, sans-serif;
        text-align: center;
        line-height: 1.3em;
        font-size: 14px;

        // Initial state
        opacity: 0;
        transition: opacity 0.3s;
        will-change: opacity;

        // This will prevent the text from showing when hovering the hidden text
        pointer-events: none;
    }

    // Show the text when hovering the point
    &:hover .text {
        opacity: 1;
    }

    &.visible .label {
        transform: scale(1, 1);
    }
}
</style>
