<template>
    <canvas ref="canvas"></canvas>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import * as THREE from "three";
import {
    Mesh,
    WebGLRenderer,
    Scene,
    PerspectiveCamera,
    SphereGeometry,
    Object3D,
} from "three";
import { GUI } from "dat.gui";
import { AxisGridHelper } from "~/models/dat-gui";

type FrameRequestCallback = (time: number) => void;

@Component
export default class SolarSystem extends Vue {
    renderer!: WebGLRenderer;
    scene!: Scene;
    camera!: PerspectiveCamera;

    solarSystem!: Object3D;

    sphereGeometry!: SphereGeometry;
    sunMesh!: Mesh;

    earthOrbit!: Object3D;
    earthMesh!: Mesh;

    moonOrbit!: Object3D;
    moonMesh!: Mesh;

    gui!: GUI;

    // an array of objects whose rotation to update
    rotatingObjects: (Mesh | Object3D)[] = [];

    renderFunc!: FrameRequestCallback;

    mounted() {
        this.setUpRenderer();
        this.setUpScene();
        this.setUpLight();
        this.setUpCamera();

        this.setUpSphereGeometry();

        // The solar system contains the sun and the earth orbit
        this.setUpSolarSystem();
        this.setUpSun();
        this.setUpEarthOrbit();

        // The earth orbit contains the earth and the moon orbit
        this.setUpEarth();
        this.setUpMoonOrbit();

        // The moon orbit contains the moon
        this.setUpMoon();

        this.setUpGui();
        this.addHelpers();

        this.setUpRenderFunc();
        this.animate();
    }

    setUpRenderer() {
        const canvas = this.$refs.canvas as HTMLCanvasElement;
        this.renderer = new THREE.WebGLRenderer({ canvas });
    }

    setUpScene() {
        this.scene = new THREE.Scene();
    }

    setUpLight() {
        const color = 0xffffff;
        const intensity = 3;
        const light = new THREE.PointLight(color, intensity);

        this.scene.add(light);
    }

    setUpCamera() {
        const fov = 40;
        const aspect = 2; // the canvas default
        const near = 0.1;
        const far = 1000;

        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

        this.camera.position.set(0, 50, 0);
        this.camera.up.set(0, 0, 1);
        this.camera.lookAt(0, 0, 0);
    }

    setUpSolarSystem() {
        const solarSystem = new THREE.Object3D();
        this.scene.add(solarSystem);
        this.rotatingObjects.push(solarSystem);
        this.solarSystem = solarSystem;
    }

    setUpSphereGeometry() {
        // use the same sphere for everything
        const radius = 1;
        const widthSegments = 6;
        const heightSegments = 6;
        this.sphereGeometry = new THREE.SphereGeometry(
            radius,
            widthSegments,
            heightSegments
        );
    }

    setUpSun() {
        const sunMaterial = new THREE.MeshPhongMaterial({ emissive: 0xffff00 });
        const sunMesh = new THREE.Mesh(this.sphereGeometry, sunMaterial);
        sunMesh.scale.set(5, 5, 5); // make the sun large

        this.solarSystem.add(sunMesh);
        this.rotatingObjects.push(sunMesh);
        this.sunMesh = sunMesh;
    }

    setUpEarthOrbit() {
        const earthOrbit = new THREE.Object3D();
        earthOrbit.position.x = 10;
        this.solarSystem.add(earthOrbit);
        this.rotatingObjects.push(earthOrbit);
        this.earthOrbit = earthOrbit;
    }

    setUpEarth() {
        const earthMaterial = new THREE.MeshPhongMaterial({
            color: 0x2233ff,
            emissive: 0x112244,
        });
        const earthMesh = new THREE.Mesh(this.sphereGeometry, earthMaterial);

        this.earthOrbit.add(earthMesh);
        this.rotatingObjects.push(earthMesh);
        this.earthMesh = earthMesh;
    }

    setUpMoonOrbit() {
        const moonOrbit = new THREE.Object3D();
        moonOrbit.position.x = 2;
        this.earthOrbit.add(moonOrbit);
        this.rotatingObjects.push(moonOrbit);
        this.moonOrbit = moonOrbit;
    }

    setUpMoon() {
        const moonMaterial = new THREE.MeshPhongMaterial({
            color: 0x888888,
            emissive: 0x222222,
        });
        const moonMesh = new THREE.Mesh(this.sphereGeometry, moonMaterial);
        moonMesh.scale.set(0.5, 0.5, 0.5);

        this.moonOrbit.add(moonMesh);
        this.rotatingObjects.push(moonMesh);
        this.moonMesh = moonMesh;
    }

    setUpGui() {
        this.gui = new GUI();
    }

    addHelpers() {
        this.makeAxisGrid(this.solarSystem, "solarSystem", 25);
        this.makeAxisGrid(this.sunMesh, "sunMesh");
        this.makeAxisGrid(this.earthOrbit, "earthOrbit");
        this.makeAxisGrid(this.earthMesh, "earthMesh");
        this.makeAxisGrid(this.moonOrbit, "moonOrbit");
        this.makeAxisGrid(this.moonMesh, "moonMesh");
    }

    makeAxisGrid(node, label, units?) {
        const helper = new AxisGridHelper(node, units);
        this.gui.add(helper, "visible").name(label);
    }

    setUpRenderFunc() {
        this.renderFunc = function render(time: number) {
            time *= 0.001;

            if (this.resizeRendererToDisplaySize()) {
                const canvas = this.renderer.domElement;
                this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
                this.camera.updateProjectionMatrix();
            }

            this.rotatingObjects.forEach((obj) => {
                obj.rotation.y = time;
            });

            this.renderer.render(this.scene, this.camera);

            requestAnimationFrame(this.renderFunc.bind(this));
        };
    }

    resizeRendererToDisplaySize() {
        const canvas = this.renderer.domElement;
        const { clientWidth: width, clientHeight: height } = canvas;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            this.renderer.setSize(width, height, false);
        }
        return needResize;
    }

    animate() {
        requestAnimationFrame(this.renderFunc.bind(this));
    }
}
</script>

<style scoped lang="scss">
canvas {
    width: 100%;
    height: 100%;
    display: block;
}
</style>
