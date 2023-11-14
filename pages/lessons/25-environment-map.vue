<template>
    <div>
        <canvas ref="canvas" class="full-screen"></canvas>
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
    DataTexture,
    DirectionalLight,
    EquirectangularReflectionMapping,
    Mesh,
    MeshStandardMaterial,
    TorusKnotGeometry,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import LessonSetupMixin from "~/mixins/lesson-setup";

@Component
export default class EnvironmentMapLesson extends LessonSetupMixin {
    canvas!: HTMLCanvasElement;
    controls!: OrbitControls;

    gui!: GUI;

    directionalLight!: DirectionalLight;

    gltfLoader!: any;
    cubeTextureLoader!: CubeTextureLoader;
    rgbeLoader!: RGBELoader;

    cubeEnvironmentMap!: CubeTexture;
    hdriEnvironmentMap!: DataTexture;
    torusKnot!: Mesh<TorusKnotGeometry, MeshStandardMaterial>;

    config: any = {
        envMapIntensity: 1,
        // envMapType: "cubeMap",
        envMapType: "HDRI",
    };

    async mounted() {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.setUp();
        this.setUpOrbitControls();

        this.configureRenderer();

        this.setUpLoaders();

        this.addLights();

        if (this.config.envMapType === "HDRI") {
            this.loadHdriEnvironmentMap();
        } else {
            this.loadCubeEnvironmentMap();
        }

        this.loadHelmet();
        this.addTorusKnot();

        await this.addGui();
        this.setUpGui();

        this.setUpAnimation();
        this.startAnimation();
    }

    configureRenderer() {
        this.renderer.outputColorSpace = "srgb";
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 3;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    setUpLoaders() {
        this.gltfLoader = new GLTFLoader();
        this.cubeTextureLoader = new CubeTextureLoader();
        this.rgbeLoader = new RGBELoader();
    }

    addLights() {
        this.directionalLight = new DirectionalLight("#ffffff", Math.PI * 3);
        this.directionalLight.shadow.camera.far = 15;
        this.directionalLight.shadow.mapSize.set(1024, 1024);
        this.directionalLight.shadow.normalBias = 0.05;
        this.directionalLight.position.set(0.25, 3, -2.25);
        this.scene.add(this.directionalLight);
    }

    async loadCubeEnvironmentMap() {
        this.cubeEnvironmentMap = await this.cubeTextureLoader.loadAsync([
            "/textures/environmentMaps/0/px.jpg",
            "/textures/environmentMaps/0/nx.jpg",
            "/textures/environmentMaps/0/py.jpg",
            "/textures/environmentMaps/0/ny.jpg",
            "/textures/environmentMaps/0/pz.jpg",
            "/textures/environmentMaps/0/nz.jpg",
        ]);
        this.cubeEnvironmentMap.colorSpace = "srgb";

        this.scene.background = this.cubeEnvironmentMap;
        this.scene.environment = this.cubeEnvironmentMap;
    }

    async loadHdriEnvironmentMap() {
        this.hdriEnvironmentMap = await this.rgbeLoader.loadAsync(
            "/textures/environmentMaps/1/2k.hdr"
        );
        this.hdriEnvironmentMap.mapping = EquirectangularReflectionMapping;

        this.scene.background = this.hdriEnvironmentMap;
        this.scene.environment = this.hdriEnvironmentMap;
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

    addTorusKnot() {
        this.torusKnot = new Mesh(
            new TorusKnotGeometry(1, 0.4, 100, 16),
            new MeshStandardMaterial({
                roughness: 0.3,
                metalness: 1,
                color: 0xaaaaaa,
            })
        );
        this.torusKnot.position.x = -4;
        this.torusKnot.position.y = 4;
        this.scene.add(this.torusKnot);
    }

    updateAllMaterials() {
        this.scene.traverse((child: any) => {
            if (child.isMesh && child.material?.isMeshStandardMaterial) {
                child.material.envMapIntensity = this.config.envMapIntensity;
                child.material.needsUpdate = true;
            }
        });
    }

    setUpGui() {
        // Particles
        this.gui
            .add(this.config, "envMapIntensity", 1, 10, 0.001)
            .onChange(this.updateAllMaterials);

        this.gui.add(this.scene, "backgroundBlurriness", 0, 1, 0.001);
        this.gui.add(this.scene, "backgroundIntensity", 0, 5, 0.001);
    }

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
