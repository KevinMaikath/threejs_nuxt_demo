<template>
    <canvas ref="canvas" class="full-screen"></canvas>
</template>

<script lang="ts">
import Component from "vue-class-component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as THREE from "three";
import {
    AmbientLight,
    CameraHelper,
    DirectionalLight,
    Material,
    Mesh,
    MeshStandardMaterial,
    PointLight,
    SpotLight,
} from "three";
import { GUI } from "dat.gui";
import LessonSetupMixin from "~/mixins/lesson-setup.vue";

@Component
export default class ShadowsLesson extends LessonSetupMixin {
    canvas!: HTMLCanvasElement;
    controls!: OrbitControls;

    material!: MeshStandardMaterial;
    sphere!: Mesh;
    plane!: Mesh;

    sphereShadowPlane!: Mesh;
    animateMovingBakedShadow: boolean = false;

    ambientLight!: AmbientLight;
    directionalLight!: DirectionalLight;
    spotLight!: SpotLight;
    pointLight!: PointLight;

    directionalLightCameraHelper!: CameraHelper;
    spotLightCameraHelper!: CameraHelper;
    pointLightCameraHelper!: CameraHelper;

    gui!: GUI;

    mounted() {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.setUpSizes();
        this.setUp();

        this.addObjects();
        this.addLights();

        this.enableShadows();
        this.setShadowMapAlgorithm();
        this.optimizeDirectionalLightShadows();
        this.optimizeSpotLightShadows();
        this.optimizePointLightShadows();

        this.addShadowCameraHelpers();

        // this.useBakedShadow();
        // this.useMovingBakedShadow();

        this.setUpGui();

        this.setUpOrbitControls();
        this.setUpAnimation();
        this.startAnimation();
    }

    addObjects() {
        const material = new THREE.MeshStandardMaterial();
        material.roughness = 0.8;
        material.side = THREE.DoubleSide;

        // Save the material to add it to the GUI later
        this.material = material;

        // Sphere
        this.sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 32, 32),
            material
        );
        this.scene.add(this.sphere);

        // Plane
        this.plane = new THREE.Mesh(
            new THREE.PlaneGeometry(5, 5, 100, 100),
            material
        );
        this.plane.position.y = -0.5;
        this.plane.rotation.x = -Math.PI / 2;
        this.scene.add(this.plane);
    }

    addLights() {
        // Ambient Light
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);

        // Directional Light
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        this.directionalLight.position.set(2, 2, -1);
        this.directionalLight.visible = false;
        this.scene.add(this.directionalLight);

        // Spot Light
        this.spotLight = new THREE.SpotLight(0xffffff, 0.4, 10, Math.PI * 0.3);
        this.spotLight.position.set(0, 2, 2);
        this.spotLight.visible = false;
        this.scene.add(this.spotLight);
        this.scene.add(this.spotLight.target);

        // Point Light
        this.pointLight = new THREE.PointLight(0xffffff, 0.4);
        this.pointLight.position.set(-1, 2, 0.5);
        // this.pointLight.visible = false;
        this.scene.add(this.pointLight);
    }

    enableShadows() {
        // Enable shadows in renderer
        this.renderer.shadowMap.enabled = true;

        /**
         * Object have 2 properties regarding the shadows:
         * - castShadows: indicates if this objects will be taken into account for generating shadows in other objects
         * - receiveShadow: indicates if shadows can be drawn in this object.
         */
        this.sphere.castShadow = true;
        this.plane.receiveShadow = true;

        /**
         * Only 3 types of Lights can cast shadows: DirectionalLight, PointLight and SpotLight.
         */
        this.directionalLight.castShadow = true;
        this.spotLight.castShadow = true;
        this.pointLight.castShadow = true;
    }

    /**
     * We can change the shadowMap algorithm from one of these options:
     * - THREE.BasicShadowMap: Very performant but lousy quality
     * - THREE.PCFShadowMap (default): Less performant but smoother edges
     * - THREE.PCFSoftShadowMap: Less performant but even softer edges
     * - THREE.VSMShadowMap: Less performant, more constraints, can have unexpected results
     *
     * PCFSoftShadowMap is the most used one, but we can't use the general blur (radius) with it.
     */
    setShadowMapAlgorithm() {
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    optimizeDirectionalLightShadows() {
        /**
         * A bigger shadowMap for a Light will result in better quality for the shadows generated.
         */
        this.directionalLight.shadow.mapSize.set(1024, 1024);

        /**
         * We can modify the Light "near" and "far" properties. This won't improve the quality of
         * the shadows but they will be more precise and we can avoid some shadow glitches with this.
         */
        this.directionalLight.shadow.camera.near = 1;
        this.directionalLight.shadow.camera.far = 6;

        /**
         * Since the DirectionalLight shadow camera is an OrthographicCamera, we can modify the amplitude to be more
         * precise on the field where the shadows are generated. The smaller the amplitude, the better quality on the
         * edges of the shadows generated. However, the amplitude has to be big enough to contain all the objects we
         * want to generate shadows for.
         */
        this.directionalLight.shadow.camera.top = 2;
        this.directionalLight.shadow.camera.right = 2;
        this.directionalLight.shadow.camera.bottom = -2;
        this.directionalLight.shadow.camera.left = -2;

        /**
         * We can add blur to the shadows. This blur doesn't take into account the proximity of the camera.
         * Sometimes it's better to get a blurry result by reducing the size of the shadowMap size.
         */
        // this.directionalLight.shadow.radius = 10;
    }

    optimizeSpotLightShadows() {
        this.spotLight.shadow.mapSize.set(1024, 1024);

        /**
         * In the case of SpotLights, the shadow camera is a PerspectiveCamera, so we need to modify the fov in order
         * to change the amplitude.
         */
        this.spotLight.shadow.camera.fov = 30;

        this.spotLight.shadow.camera.near = 1;
        this.spotLight.shadow.camera.far = 6;
    }

    /**
     * The shadows for the PointLights are more tricky.
     *
     * Three.js needs a camera for the Light to generate the shadowMap. The problem with the PointLight is that the
     * light goes from the center to every direction, and there's not any camera that can give a 360º view. What
     * Three.js does to solve it is to use 6 cameras for the shadowMaps for the PointLight, forming a cube around the
     * center of the Light. We can see that the pointLightCameraHelper is a PerspectiveCamera pointing to the bottom
     * (probably because it's the last one used for the shadowMaps).
     *
     * For this reason, Three.js need to do 6 renders before the real render to get the shadowMap of each camera for the
     * PointLight. That's why the PointLight is not the best Light for shadows in terms of performance.
     */
    optimizePointLightShadows() {
        this.pointLight.shadow.mapSize.set(1024, 1024);

        /**
         * It's not possible to modify the fov of the shadow camera, since it's supposed to have a 360º view.
         */

        this.pointLight.shadow.camera.near = 0.1;
        this.pointLight.shadow.camera.far = 5;
    }

    /**
     * We can enable a cameraHelper for a Light shadow camera to debug it with ease.
     */
    addShadowCameraHelpers() {
        // Directional Light
        this.directionalLightCameraHelper = new THREE.CameraHelper(
            this.directionalLight.shadow.camera
        );
        this.directionalLightCameraHelper.visible = false;
        this.scene.add(this.directionalLightCameraHelper);

        // Spot Light
        this.spotLightCameraHelper = new THREE.CameraHelper(
            this.spotLight.shadow.camera
        );
        this.spotLightCameraHelper.visible = false;
        this.scene.add(this.spotLightCameraHelper);

        // Point Light
        this.pointLightCameraHelper = new THREE.CameraHelper(
            this.pointLight.shadow.camera
        );
        this.pointLightCameraHelper.visible = false;
        this.scene.add(this.pointLightCameraHelper);
    }

    /**
     * Another solution for shadows is to use baked shadows instead of Three.js shadow generation.
     * The main problem about baked shadows is that they only work for static objects. If objects move the shadows
     * won't be updates, since they are drawn in the other objects with the baked shadow.
     */
    useBakedShadow() {
        this.renderer.shadowMap.enabled = false;

        const textureLoader = new THREE.TextureLoader();
        const bakedShadow = textureLoader.load(
            "/textures/shadows/bakedShadow.jpg"
        );

        // We add the sphere shadow in the Plane texture
        this.scene.remove(this.plane);
        this.plane = new THREE.Mesh(
            new THREE.PlaneGeometry(5, 5),
            new THREE.MeshBasicMaterial({ map: bakedShadow })
        );
        this.plane.position.y = -0.5;
        this.plane.rotation.x = -Math.PI / 2;
        this.scene.add(this.plane);
    }

    /**
     * Instead of a static baked shadow, we can use a very simple baked shadow that will change it's position or other
     * properties at the same time that the sphere moves. This way we can achieve moving shadows with a baked shadow.
     *
     * The goal is to create a plane that represents the shadow of the sphere, and move that plane with the sphere.
     */
    useMovingBakedShadow() {
        this.renderer.shadowMap.enabled = false;
        this.animateMovingBakedShadow = true;

        const textureLoader = new THREE.TextureLoader();
        const simpleShadow = textureLoader.load(
            "/textures/shadows/simpleShadow.jpg"
        );

        this.plane.position.y = -0.5;

        this.sphereShadowPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(1.5, 1.5),
            new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                alphaMap: simpleShadow,
            })
        );
        // Move this shadowPlane just a bit above the plane so that the camera knows that the shadow is above the plane
        // (it's a common glitch called z-fighting)
        this.sphereShadowPlane.position.y = this.plane.position.y + 0.01;
        this.sphereShadowPlane.rotation.x = this.plane.rotation.x;

        this.scene.add(this.sphereShadowPlane);
    }

    setUpGui() {
        const { GUI } = require("dat.gui");
        this.gui = new GUI({ name: "main-gui" });

        // Ambient Light
        const ambientLightFolder = this.gui.addFolder("Ambient light");
        ambientLightFolder.closed = false;
        ambientLightFolder.add(this.ambientLight, "intensity", 0, 1, 0.01);

        // Directional Light
        const directionalLightFolder = this.gui.addFolder("Directional Light");
        directionalLightFolder.closed = false;
        directionalLightFolder.add(this.directionalLight, "visible");
        directionalLightFolder.add(
            this.directionalLight,
            "intensity",
            0,
            1,
            0.01
        );
        directionalLightFolder
            .add(this.directionalLightCameraHelper, "visible")
            .name("shadow helper");
        // directionalLightFolder
        //     .add(this.directionalLight.shadow, "radius", 0, 10, 0.1)
        //     .name("shadow radius");

        // Spot Light
        const spotLightFolder = this.gui.addFolder("Spot Light");
        spotLightFolder.closed = false;
        spotLightFolder.add(this.spotLight, "visible");
        spotLightFolder
            .add(this.spotLight.shadow.camera, "fov", 0, 50, 0.1)
            .name("shadow fov");
        spotLightFolder
            .add(this.spotLightCameraHelper, "visible")
            .name("shadow helper");

        // Point Light
        const pointLightFolder = this.gui.addFolder("Point Light");
        pointLightFolder.closed = false;
        pointLightFolder.add(this.pointLight, "visible");
        pointLightFolder
            .add(this.pointLightCameraHelper, "visible")
            .name("shadow helper");

        // Material
        const materialFolder = this.gui.addFolder("Material");
        materialFolder.closed = false;
        materialFolder.add(this.material, "roughness", 0, 1, 0.01);
        materialFolder.add(this.material, "metalness", 0, 1, 0.01);

        // Shadow
        // const shadowFolder = this.gui.addFolder("Shadows");
        // shadowFolder.closed = false;
    }

    setUpAnimation() {
        const clock = new THREE.Clock();

        this.animation = (_: number) => {
            const elapsedTime = clock.getElapsedTime();
            this.controls.update();

            // Move the sphere
            this.sphere.position.set(
                Math.cos(elapsedTime) * 1.5,
                Math.abs(Math.sin(elapsedTime * 3)),
                Math.sin(elapsedTime) * 1.5
            );

            if (this.animateMovingBakedShadow) {
                // Move the sphere shadow with the sphere
                this.sphereShadowPlane.position.x = this.sphere.position.x;
                this.sphereShadowPlane.position.z = this.sphere.position.z;
                (this.sphereShadowPlane.material as Material).opacity =
                    1 - this.sphere.position.y;
            }
        };
    }
}
</script>
