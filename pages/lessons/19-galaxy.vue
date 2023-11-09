<template>
    <canvas ref="canvas" class="full-screen"></canvas>
</template>

<script lang="ts">
import Component from "vue-class-component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
import * as THREE from "three";
import { BufferGeometry, PointsMaterial, BufferAttribute, Points } from "three";
import LessonSetupMixin from "~/mixins/lesson-setup";

@Component
export default class GalaxyLesson extends LessonSetupMixin {
    canvas!: HTMLCanvasElement;
    controls!: OrbitControls;

    galaxyParams = {
        count: 30000,
        size: 0.02,
        radius: 5,
        branches: 5,
        spin: 1,
        randomness: 0.2,
        randomnessPower: 3,
        insideColor: "#ff0000",
        outsideColor: "#0000ff",
    };

    galaxyGeometry!: BufferGeometry;
    galaxyMaterial!: PointsMaterial;
    galaxyPoints!: Points;

    gui!: GUI;

    async mounted() {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.setUp();

        // this.addParticles();

        this.generateGalaxy();

        await this.addGui();
        this.setUpGui();

        this.setUpOrbitControls();
        this.setUpAnimation();
        this.startAnimation();
    }

    /**
     * Properly clean the geometry and material from the previous galaxy and remove the points from the scene.
     * The dispose method will dispose an object (geometry or material) from the memory while the application is
     * running.
     */
    destroyPreviousGalaxy() {
        if (this.galaxyGeometry) this.galaxyGeometry.dispose();
        if (this.galaxyMaterial) this.galaxyMaterial.dispose();
        if (this.galaxyPoints) this.scene.remove(this.galaxyPoints);
    }

    generateGalaxy() {
        this.destroyPreviousGalaxy();

        this.galaxyGeometry = new BufferGeometry();
        const positions = new Float32Array(this.galaxyParams.count * 3);
        const colors = new Float32Array(this.galaxyParams.count * 3);

        const colorInside = new THREE.Color(this.galaxyParams.insideColor);
        const colorOutside = new THREE.Color(this.galaxyParams.outsideColor);

        // Generate a random value taking into account the randomness and a radius
        // This will make the particles spread more when the radius is higher and get more close to each other when they
        // are close to the center.
        // const randomValue = (radius: number) =>
        //     (Math.random() - 0.5) * this.galaxyParams.randomness * radius;

        const randomValue = (radius: number) => {
            // This will make the values close to 0 stay close to 0, the values close to 1 be close to 1 and the values
            // in the middle be reduced a lot. This way the particles will be more condensed in the branch origin and
            // more random when they are far from the branch origin.
            const randomPow = Math.pow(
                Math.random(),
                this.galaxyParams.randomnessPower
            );

            // With only the randomPow, we will only have positive values. This will randomly invert the value of
            // randomPow.
            const invertedRandom = randomPow * (Math.random() < 0.5 ? 1 : -1);

            return invertedRandom * this.galaxyParams.randomness * radius;
        };

        for (let i = 0; i < this.galaxyParams.count; i++) {
            const i3 = i * 3;

            // Position

            // Radius of the whole galaxy
            const radius = Math.random() * this.galaxyParams.radius;

            // Angle of each branch of the galaxy
            const branchModule = i % this.galaxyParams.branches;
            const branchAngle =
                (branchModule / this.galaxyParams.branches) * Math.PI * 2;

            // Angle of the spin of the particles in each branch. The further a particle is from the center, the more
            // it will spin.
            const spinAngle = radius * this.galaxyParams.spin;

            const randomX = randomValue(radius);
            const randomY = randomValue(radius);
            const randomZ = randomValue(radius);

            positions[i3] =
                Math.cos(branchAngle + spinAngle) * radius + randomX; // x
            positions[i3 + 1] = randomY; // y
            positions[i3 + 2] =
                Math.sin(branchAngle + spinAngle) * radius + randomZ; // z

            // Color

            // We want the particles to have more of the outsideColor the further they are from the center and more of
            // the insideColor the closer they are to the center.

            // Clone the colorInside so that we avoid modifying it.
            const particleColor = colorInside.clone();
            particleColor.lerp(colorOutside, radius / this.galaxyParams.radius);

            colors[i3] = particleColor.r;
            colors[i3 + 1] = particleColor.g;
            colors[i3 + 2] = particleColor.b;
        }

        const positionsAttribute = new BufferAttribute(positions, 3);
        this.galaxyGeometry.setAttribute("position", positionsAttribute);

        const colorsAttribute = new BufferAttribute(colors, 3);
        this.galaxyGeometry.setAttribute("color", colorsAttribute);

        this.galaxyMaterial = new PointsMaterial({
            size: this.galaxyParams.size,
            sizeAttenuation: true,
            depthWrite: true,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
        });

        this.galaxyPoints = new Points(
            this.galaxyGeometry,
            this.galaxyMaterial
        );
        this.scene.add(this.galaxyPoints);
    }

    setUpGui() {
        this.gui
            .add(this.galaxyParams, "count", 100, 100000, 100)
            .onFinishChange(this.generateGalaxy);
        this.gui
            .add(this.galaxyParams, "size", 0.001, 0.1, 0.0001)
            .onFinishChange(this.generateGalaxy);
        this.gui
            .add(this.galaxyParams, "radius", 0.1, 20, 0.5)
            .onFinishChange(this.generateGalaxy);
        this.gui
            .add(this.galaxyParams, "branches", 2, 20, 1)
            .onFinishChange(this.generateGalaxy);
        this.gui
            .add(this.galaxyParams, "spin", -3, 3, 0.01)
            .onFinishChange(this.generateGalaxy);
        this.gui
            .add(this.galaxyParams, "randomness", 0, 2, 0.01)
            .onFinishChange(this.generateGalaxy);
        this.gui
            .add(this.galaxyParams, "randomnessPower", 1, 10, 0.01)
            .onFinishChange(this.generateGalaxy);

        this.gui
            .addColor(this.galaxyParams, "insideColor")
            .onFinishChange(this.generateGalaxy);
        this.gui
            .addColor(this.galaxyParams, "outsideColor")
            .onFinishChange(this.generateGalaxy);
    }

    setUpAnimation() {
        const clock = new THREE.Clock();

        this.animation = (_: number) => {
            const elapsedTime = clock.getElapsedTime();

            this.galaxyPoints.rotation.y = elapsedTime * 0.1;
        };
    }
}
</script>
