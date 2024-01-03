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
    Color,
    CubeCamera,
    CubeTexture,
    CubeTextureLoader,
    DataTexture,
    DirectionalLight,
    EquirectangularReflectionMapping,
    FloatType,
    HalfFloatType,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    Texture,
    TextureLoader,
    TorusGeometry,
    TorusKnotGeometry,
    WebGLCubeRenderTarget,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader";
import { GroundProjectedSkybox } from "three/examples/jsm/objects/GroundProjectedSkybox";
import LessonSetupMixin from "~/mixins/lesson-setup";

enum CameraLayers {
    DEFAULT = 1,
    ENVMAP = 2,
}

@Component
export default class EnvironmentMapLesson extends LessonSetupMixin {
    canvas!: HTMLCanvasElement;
    controls!: OrbitControls;

    gui!: GUI;

    directionalLight!: DirectionalLight;

    gltfLoader!: any;
    textureLoader!: TextureLoader;
    cubeTextureLoader!: CubeTextureLoader;
    rgbeLoader!: RGBELoader;
    exrLoader!: EXRLoader;

    environmentMap!: CubeTexture | DataTexture;
    torusKnot!: Mesh<TorusKnotGeometry, MeshStandardMaterial>;

    skybox!: GroundProjectedSkybox;

    realtimeEnvMap!: Texture;
    holyDonut!: Mesh;
    cubeCamera!: CubeCamera;

    config: any = {
        envMapIntensity: 1,
        // envMapType: "EXR",
        // envMapType: "HDRI",
        envMapType: "REALTIME",
        envAsSkybox: false,
    };

    async mounted() {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.setUp();
        this.setUpOrbitControls();

        this.configureRenderer();

        this.setUpLoaders();

        this.addLights();

        if (this.config.envMapType === "HDRI") {
            await this.loadHdriEnvironmentMap();
        } else if (this.config.envMapType === "EXR") {
            await this.loadExrEnvironmentMap();
        } else if (this.config.envMapType === "REALTIME") {
            await this.setRealTimeEnvironmentMap();
            this.addHolyDonut();
            this.createCubeRender();
            this.hideTorusKnotFromEnvironmentMap();
        } else {
            await this.loadCubeEnvironmentMap();
        }

        if (this.config.envAsSkybox) {
            this.setSkybox();
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
        this.textureLoader = new TextureLoader();
        this.cubeTextureLoader = new CubeTextureLoader();
        this.rgbeLoader = new RGBELoader();
        this.exrLoader = new EXRLoader();
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
        this.environmentMap = await this.cubeTextureLoader.loadAsync([
            "/textures/environmentMaps/0/px.jpg",
            "/textures/environmentMaps/0/nx.jpg",
            "/textures/environmentMaps/0/py.jpg",
            "/textures/environmentMaps/0/ny.jpg",
            "/textures/environmentMaps/0/pz.jpg",
            "/textures/environmentMaps/0/nz.jpg",
        ]);
        this.environmentMap.colorSpace = "srgb";
        this.scene.environment = this.environmentMap;

        if (!this.config.envAsSkybox) {
            this.scene.background = this.environmentMap;
        }
    }

    async loadHdriEnvironmentMap() {
        this.environmentMap = await this.rgbeLoader.loadAsync(
            "/textures/environmentMaps/1/2k.hdr"
        );
        this.environmentMap.mapping = EquirectangularReflectionMapping;
        this.scene.environment = this.environmentMap;

        if (!this.config.envAsSkybox) {
            this.scene.background = this.environmentMap;
        }
    }

    async loadExrEnvironmentMap() {
        this.environmentMap = await this.exrLoader.loadAsync(
            "/textures/environmentMaps/exr/laufenurg_church_2k.exr"
        );
        this.environmentMap.mapping = EquirectangularReflectionMapping;
        this.scene.environment = this.environmentMap;

        if (!this.config.envAsSkybox) {
            this.scene.background = this.environmentMap;
        }
    }

    async setRealTimeEnvironmentMap() {
        // Base environment map
        this.realtimeEnvMap = await this.textureLoader.loadAsync(
            "/textures/environmentMaps/blockade/cozy_interior.jpg"
        );
        this.realtimeEnvMap.mapping = THREE.EquirectangularReflectionMapping;
        this.realtimeEnvMap.colorSpace = THREE.SRGBColorSpace;

        this.scene.background = this.realtimeEnvMap;
    }

    /**
     * A Cube Render is a cube that is going to render all of its 6 sides in
     * order to generate a CubeTexture. We're going to generate that CubeTexture
     * on each frame in order to achieve a real-time environment map.
     *
     * This can result to be very expensive in terms of performance. Reducing
     * the resolution of the cube or using a lower-quality type might help.
     */
    createCubeRender() {
        const cubeRenderTarget = new WebGLCubeRenderTarget(
            // Resolution of each side of the cube
            256,
            // We use here a FloatType because it can store 32 bits for a wide
            // range of values, so that we can achieve a similar behaviour to
            // HDR. We can also use HalfFloatType which can store 16 bits,
            // which is still a good quality and more performant.
            // THis means that if we make the color of the holyDonut be
            // (10,10,10) instead of the default white (1,1,1), we will see a
            // higher intensity in the real-time environment map.
            { type: HalfFloatType }
        );
        this.scene.environment = cubeRenderTarget.texture;

        this.cubeCamera = new CubeCamera(0.1, 100, cubeRenderTarget);
    }

    /**
     *  By default, there's an issue with the real-time environment map that
     *  we're generating. If we remove the roughness on the torus knot we can
     *  notice that that same torus is being reflected inside itself. This is
     *  because the cubeRenderTarget is rendering everything that the cubeCamera
     *  can see, which includes the torus knot.
     *
     *  This can be fixed by using Layers, which are "tags" or "categories" that
     *  can be assigned to any object and will let the cameras know which layers
     *  are they working with. By default, the layers of a camera are set to 0.
     */
    hideTorusKnotFromEnvironmentMap() {
        this.cubeCamera.layers.set(CameraLayers.ENVMAP);

        this.holyDonut.layers.enable(CameraLayers.ENVMAP);
    }

    /**
     * Set the current environmentMap as the Skybox so that it's projected
     * directly from the ground (instead of having the ground on the infinite).
     *
     * NOTE: this will look well as long as all the objects in the scene are
     * above 0 (Y), because the center of the skybox is at 0,0,0.
     */
    setSkybox() {
        this.skybox = new GroundProjectedSkybox(this.environmentMap);
        this.skybox.scale.setScalar(50);
        this.scene.add(this.skybox);
    }

    async loadHelmet() {
        const gltf = await this.gltfLoader.loadAsync(
            "/models/FlightHelmet/glTF/FlightHelmet.gltf"
        );

        gltf.scene.scale.set(10, 10, 10);
        gltf.scene.position.set(0, 0, 0);
        gltf.scene.rotation.y = Math.PI * 0.5;
        this.scene.add(gltf.scene);

        this.updateAllMaterials();
    }

    addTorusKnot() {
        this.torusKnot = new Mesh(
            new TorusKnotGeometry(1, 0.4, 100, 16),
            new MeshStandardMaterial({
                roughness: 0,
                metalness: 1,
                color: 0xaaaaaa,
            })
        );
        this.torusKnot.position.x = -4;
        this.torusKnot.position.y = 4;
        this.scene.add(this.torusKnot);
    }

    addHolyDonut() {
        this.holyDonut = new Mesh(
            new TorusGeometry(8, 0.5),
            // HDR color
            new MeshBasicMaterial({ color: new Color(10, 10, 10) })
        );
        this.holyDonut.position.y = 3.5;
        this.scene.add(this.holyDonut);
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
        // Env map
        this.gui
            .add(this.config, "envMapIntensity", 1, 10, 0.001)
            .onChange(this.updateAllMaterials);

        this.gui.add(this.scene, "backgroundBlurriness", 0, 1, 0.001);
        this.gui.add(this.scene, "backgroundIntensity", 0, 5, 0.001);

        // Skybox
        if (this.config.envAsSkybox) {
            this.gui.add(this.skybox, "radius", 1, 200, 0.001);
            this.gui.add(this.skybox, "height", 1, 100, 0.001);
        }
    }

    setUpAnimation() {
        const clock = new THREE.Clock();
        // const previousTime = 0;

        this.animation = (_: number) => {
            const elapsedTime = clock.getElapsedTime();
            if (this.holyDonut) {
                this.holyDonut.rotation.x = Math.sin(elapsedTime) * 2;
            }

            if (this.cubeCamera) {
                this.cubeCamera.update(this.renderer, this.scene);
            }

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
