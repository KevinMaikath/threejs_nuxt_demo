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
} from "three";

type FrameRequestCallback = (time: number) => void;

@Component
export default class SolarSystem extends Vue {
    renderer!: WebGLRenderer;
    scene!: Scene;
    camera!: PerspectiveCamera;

    sphereGeometry!: SphereGeometry;
    sunMesh!: Mesh;
    earthMesh!: Mesh;

    // an array of objects whose rotation to update
    rotatingObjects: Mesh[] = [];

    renderFunc!: FrameRequestCallback;

    mounted() {
        this.setUpRenderer();
        this.setUpScene();
        this.setUpLight();
        this.setUpCamera();

        this.setUpSphereGeometry();
        this.setUpSun();
        this.setUpEarth();

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

        this.scene.add(sunMesh);
        this.rotatingObjects.push(sunMesh);
        this.sunMesh = sunMesh;
    }

    setUpEarth() {
        const earthMaterial = new THREE.MeshPhongMaterial({
            color: 0x2233ff,
            emissive: 0x112244,
        });
        const earthMesh = new THREE.Mesh(this.sphereGeometry, earthMaterial);
        earthMesh.scale.set(0.2, 0.2, 0.2);
        earthMesh.position.x = 2;

        // We add it to the sunMesh instead of the scene to make it rotate around the sun
        this.sunMesh.add(earthMesh);
        this.rotatingObjects.push(earthMesh);
        this.earthMesh = earthMesh;
    }

    resizeRendererToDisplaySize() {
        const canvas = this.renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            this.renderer.setSize(width, height, false);
        }
        return needResize;
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
