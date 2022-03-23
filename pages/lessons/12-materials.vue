<template>
    <canvas ref="canvas"></canvas>
</template>

<script lang="ts">
import Component from "vue-class-component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as THREE from "three";
import {
    Clock,
    Mesh,
    MeshBasicMaterial,
    MeshDepthMaterial,
    MeshLambertMaterial,
    MeshMatcapMaterial,
    MeshNormalMaterial,
    MeshPhongMaterial,
    MeshToonMaterial,
    Texture,
    TextureLoader,
} from "three";
import LessonSetupMixin from "~/mixins/lesson-setup.vue";

@Component
export default class MaterialsLesson extends LessonSetupMixin {
    canvas!: HTMLCanvasElement;
    controls!: OrbitControls;

    textureLoader!: TextureLoader;
    texture!: Texture;
    material!:
        | MeshBasicMaterial
        | MeshNormalMaterial
        | MeshMatcapMaterial
        | MeshDepthMaterial
        | MeshLambertMaterial
        | MeshPhongMaterial
        | MeshToonMaterial;

    plane!: Mesh;
    sphere!: Mesh;
    torus!: Mesh;

    clock!: Clock;
    objects!: Mesh[];

    mounted() {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.setUpSizes();
        this.setUp();

        this.setUpTextureLoader();
        this.setUpTexture();
        this.setUpMaterial();

        this.addPlane();
        this.addSphere();
        this.addTorus();

        this.setUpOrbitControls();
        this.setUpClock();
        this.setUpAnimation();
        this.startAnimation();
    }

    setUpTextureLoader() {
        this.textureLoader = new THREE.TextureLoader();
    }

    setUpTexture() {
        this.texture = this.textureLoader.load("/textures/matcaps/1.png");
    }

    setUpMaterial() {
        // this.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

        /**
         * We can modify the parameters of the Material after initialization
         */
        // this.material.color.set("#ff00ff");
        // this.material.color = new THREE.Color(0xff00ff);

        // this.material = new THREE.MeshBasicMaterial({ map: this.texture });
        // this.material.map = this.texture;

        /**
         * If we want to use opacity (or an Alpha map), we need to set transparent = true
         */
        // this.material.transparent = true;

        // this.material.opacity = 0.5;
        // this.material.alphaMap = this.textureLoader.load(
        //     "/textures/door/alpha.jpg"
        // );

        /**
         * A Normal map represents what parts of the Geometry is pointing to the outside and what to the inside.
         * It is used for lightning, reflections, refractions, etc.
         *
         * For example, given a point in a Geometry, if a light points to that point it will reflect if the normal is
         * to the outside and not reflect if it's to the inside (that point will be in the shadow)
         *
         * MeshNormalMaterial is usually used for debugging normals.
         */
        // this.material = new THREE.MeshNormalMaterial();

        /**
         * FlatShading will remove the curves between points in the Geometry
         */
        // this.material.flatShading = true;

        /**
         * MatCaps will use the normals to display the right color on a texture that looks like a sphere.
         *
         * This can be used to simulate light when there's actually none.
         */
        // this.material = new MeshMatcapMaterial();
        // this.material.matcap = this.textureLoader.load(
        //     "/textures/matcaps/8.png"
        // );

        /**
         * MeshDepthMaterial will color the geometry depending on how close it is to the `near` of the camera.
         * (White when it's close to the `near`and black when it's close to the `far`)
         */
        // this.material = new MeshDepthMaterial();

        this.setUpLights();

        /**
         * MeshLambertMaterial will react to light.
         *
         * This material can make some blurry lines in some geometries, but overall it's a very performant
         * material so we can get good frame rates with it.
         */
        // this.material = new MeshLambertMaterial({ color: 0x00ff00 });

        /**
         * MeshPhongMaterial is similar to MeshLambertMaterial but you won't have the strange patterns (it's less
         * performant tho).
         *
         * Also, you can see light reflections with this material.
         */
        // this.material = new MeshPhongMaterial();

        /**
         * We can control the light reflection of this material
         */
        // (this.material as MeshPhongMaterial).shininess = 100;
        // (this.material as MeshPhongMaterial).specular = new THREE.Color(
        //     0x00ff00
        // );

        /**
         * MeshToonMaterial gives a feeling of a cartoonish style and we can add a gradientMap
         */
        this.material = new MeshToonMaterial();

        /**
         * By default, we see a gradient instead of a clear separation (the cartoon effect) because the gradient image
         * is very small and the magFilter tries to fix it with the mip-mapping. We can set the minFilter and magFilter
         * to NearestFilter to fix that
         */
        const gradientTexture = this.textureLoader.load(
            "/textures/gradients/3.jpg"
        );
        gradientTexture.minFilter = THREE.NearestFilter;
        gradientTexture.magFilter = THREE.NearestFilter;
        this.material.gradientMap = gradientTexture;

        /**
         * We can make a plane have both sides by setting the side attribute
         */
        this.material.side = THREE.DoubleSide;
    }

    /**
     * Add some lights to test the materials that need light.
     */
    setUpLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.5);
        pointLight.position.x = 2;
        pointLight.position.y = 3;
        pointLight.position.z = 4;

        this.scene.add(pointLight);
    }

    addPlane() {
        this.plane = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
            this.material
        );
        this.scene.add(this.plane);
    }

    addSphere() {
        this.sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            this.material
        );
        this.sphere.position.x = -1.5;
        this.scene.add(this.sphere);
    }

    addTorus() {
        this.torus = new THREE.Mesh(
            new THREE.TorusGeometry(0.3, 0.2, 16, 32),
            this.material
        );
        this.torus.position.x = 1.5;
        this.scene.add(this.torus);
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

    setUpClock() {
        this.clock = new THREE.Clock();
    }

    setUpAnimation() {
        this.objects = [this.plane, this.sphere, this.torus];

        this.animation = (_: number) => {
            const elapsedTime = this.clock.getElapsedTime();
            this.controls.update();

            this.objects.forEach((obj) => {
                obj.rotation.y = 0.15 * elapsedTime;
                obj.rotation.x = 0.3 * elapsedTime;
            });
        };
    }
}
</script>

<style scoped lang="scss">
canvas {
    max-height: 100%;
}
</style>
