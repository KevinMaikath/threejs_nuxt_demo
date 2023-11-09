<template>
    <canvas ref="canvas"></canvas>
</template>

<script lang="ts">
import Component from "vue-class-component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as THREE from "three";
import { Mesh, SpotLightHelper } from "three";
import LessonSetupMixin from "~/mixins/lesson-setup";

@Component
export default class LightsLesson extends LessonSetupMixin {
    canvas!: HTMLCanvasElement;
    controls!: OrbitControls;

    rotatingObjects!: Mesh[];
    fixedObjects!: Mesh[];

    spotLightHelper?: SpotLightHelper;

    /**
     * General Lights tips for performance.
     *
     * - Lights can cost a lot in terms of performance, so try to use as few lights as possible and use the less
     *   gpu-expensive ones. The cost of each type of light is:
     *      - Minimal: AmbientLight, HemisphereLight.
     *      - Moderate: DirectionalLight, PointLight.
     *      - High: SpotLight, ReactAreaLight.
     *
     * - "Baking" is a technique where we "bake" the lights into a texture. This way we don't need to set lights in the
     *   scene but in the other hand the textures will be more heavy and we won't be able to "move" the lights because
     *   there are none, they are set in the textures. This can be done in 3D softwares outside of Three.js.
     */
    mounted() {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.setUpSizes();
        this.setUp();

        this.addLights();
        this.addObjects();

        this.setUpOrbitControls();
        this.setUpAnimation();
        this.startAnimation();
    }

    addLights() {
        /**
         * AmbientLight applies omnidirectional lighting. It's used to give a base light intensity for the materials.
         *
         * Also used to simulate real-time light bouncing to look at the back of objects when they are not directly
         * lighted by a directional light, since real-time light bouncing is really gpu intensive.
         * You can test this by adding a DirectionalLight/PointLight to the Scene and toggle an AmbientLight to see the
         * results.
         */
        // const ambientLight = new THREE.AmbientLight(0xffffff, Math.PI * 0.5);
        // this.scene.add(ambientLight);

        // You can change the attributes after initialization
        // ambientLight.color = new THREE.Color(0xff0ff);
        // ambientLight.intensity = PI * 0.3;

        /**
         * HemisphereLight is similar to AmbientLight but with 2 colors, one coming from the sky and another one coming
         * from the ground
         */
        // const hemisphereLight = new THREE.HemisphereLight(
        //     0xff0000,
        //     0x0000ff,
        //     Math.PI * 0.5
        // );
        // this.scene.add(hemisphereLight);

        // The Helper will show the colors from each side
        // const hemisphereLightHelper = new THREE.HemisphereLightHelper(
        //     hemisphereLight,
        //     0.2
        // );
        // this.scene.add(hemisphereLightHelper);

        /**
         * DirectionalLight will gives us a lighting coming from one direction. All the light rays are parallels coming
         * from the same plane.
         *
         * By default, the light is coming from the top of the scene (positive Y). In order to change the direction
         * where the light comes from, we have to modify the position of the Light. A DirectionalLight will always point
         * to the center of the scene from it's current position.
         */
        // const directionalLight = new THREE.DirectionalLight(0x00fffc, Math.PI * 0.3);
        // directionalLight.position.set(1, 0.5, 0);
        // this.scene.add(directionalLight);

        // The Helper will show the color, the origin of the light (plane) and where it's facing to
        // const directionalLightHelper = new THREE.DirectionalLightHelper(
        //     directionalLight,
        //     0.3
        // );
        // this.scene.add(directionalLightHelper);

        /**
         * PointLight is similar to DirectionalLight but all the light rays will come from the same point, the Light's
         * current position. A PointLight will light in all the ways from it's position (like the sun).
         */
        // const pointLight = new THREE.PointLight(0x00ff00, 0.5);
        // pointLight.position.set(2, 3, 4);
        // this.scene.add(pointLight);

        // The distance states how far does the light go
        // pointLight.distance = 7;
        // The decay states how fast does the light decay in it's distance
        // pointLight.decay = 1.5;

        // The Helper will show the color and the origin position of the light.
        // const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.3);
        // this.scene.add(pointLightHelper);

        /**
         * RectAreaLight will create a plane with a specific size that illuminates in only one direction.
         *
         * This Light will only work with MeshStandardMaterial and MeshPhysicalMaterial.
         */
        const rectAreaLight = new THREE.RectAreaLight(0x4e00ff, 4, 2, 2);
        rectAreaLight.position.z = 2;
        this.scene.add(rectAreaLight);

        // We can change its position and the point it faces to
        // rectAreaLight.position.set(-1.5, 0, 1.5);
        // rectAreaLight.lookAt(new THREE.Vector3());

        // The Helper must be imported directly from the Three.js examples
        // const rectAreaLightHelper = new RectAreaLightHelper(rectAreaLight);
        // this.scene.add(rectAreaLightHelper);

        /**
         * SpotLight works like a flashlight. It will illuminate in a cone coming from it's current position.
         */
        // const spotLight = new THREE.SpotLight(
        //     0x78ff00,
        //     0.5,
        //     10,
        //     Math.PI * 0.1,
        //     0.25, // Penumbra states how much does the light blurs on the sides
        //     1
        // );
        // spotLight.position.set(0, 2, 3);
        // this.scene.add(spotLight);

        /**
         * In order to change where the SpotLight points to, we have to use it's target. We have to add it's target to
         * the scene and change it's position. We can't use spotLight.rotation or spotLight.lookAt to move it's target.
         */
        // spotLight.target.position.x = 2;
        // this.scene.add(spotLight.target);

        /**
         * The Helper will show the color and the full cone of illumination. However, it doesn't get the right target
         * initially. We have to manually update the helper in the next frame so that it faces the target properly.
         * (I update it in setUpAnimation)
         */
        // this.spotLightHelper = new THREE.SpotLightHelper(spotLight); // It has no size
        // this.scene.add(this.spotLightHelper);
    }

    addObjects() {
        // Use MeshStandardMaterial to have light reflections
        const material = new THREE.MeshStandardMaterial();
        material.roughness = 0.4;
        material.side = THREE.DoubleSide;

        // Sphere
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 32, 32),
            material
        );
        sphere.position.x = -1.5;

        // Cube
        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.8, 0.8),
            material
        );

        // Torus
        const torus = new THREE.Mesh(
            new THREE.TorusGeometry(0.4, 0.2, 32, 32),
            material
        );
        torus.position.x = 1.5;

        // Plane
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(5, 5, 100, 100),
            material
        );
        plane.position.y = -1;
        plane.rotation.x = -Math.PI / 2;

        this.rotatingObjects = [sphere, cube, torus];
        this.fixedObjects = [plane];

        [...this.rotatingObjects, ...this.fixedObjects].forEach((obj) => {
            this.scene.add(obj);
        });
    }

    setUpAnimation() {
        const clock = new THREE.Clock();

        this.animation = (_: number) => {
            const elapsedTime = clock.getElapsedTime();

            if (this.spotLightHelper) this.spotLightHelper.update();

            this.rotatingObjects.forEach((obj) => {
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
