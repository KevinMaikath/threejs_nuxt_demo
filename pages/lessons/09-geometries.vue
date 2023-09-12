<template>
    <canvas ref="canvas" class="full-screen"></canvas>
</template>

<script lang="ts">
import Component from "vue-class-component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
    BoxGeometry,
    BufferGeometry,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
} from "three";
import * as THREE from "three";
import LessonSetupMixin from "~/mixins/lesson-setup.vue";

@Component
export default class GeometriesLesson extends LessonSetupMixin {
    controls!: OrbitControls;
    camera!: PerspectiveCamera;
    canvas!: HTMLCanvasElement;

    mounted() {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.setUpSizes();
        this.setUp();

        // this.addCube();
        // this.addVerticesTriangle();
        this.addMultipleTriangles(50);

        this.setUpOrbitControls();
        this.setUpAnimation();
        this.startAnimation();
    }

    addCube() {
        const geometry = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true, // We can see the vertices of the geometry with this
        });
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);
    }

    addVerticesTriangle() {
        /**
         * We can manually set the vertices of a Geometry using BufferGeometry and giving
         * a Float32Array to it.
         *
         * We can create the Float32Array and give it some values one by one.
         */
        // const positionsArray = new Float32Array(9);
        //
        // // Vertex 1
        // positionsArray[0] = 0; // x
        // positionsArray[1] = 0; // y
        // positionsArray[2] = 0; // z
        //
        // // Vertex 2
        // positionsArray[3] = 0;
        // positionsArray[4] = 1;
        // positionsArray[5] = 0;
        //
        // // Vertex 3
        // positionsArray[6] = 1;
        // positionsArray[7] = 0;
        // positionsArray[8] = 0;

        /**
         * But we can also give it an array to create it quicker.
         */
        const positionsArray = new Float32Array([
            // Vertex 1 (x,y,z)
            0, 0, 0,
            // Vertex 2
            0, 1, 0,
            // Vertex 3
            1, 0, 0,
        ]);

        // itemSize (3) defines the number of values that composes one vertex
        const positionsAttribute = new THREE.BufferAttribute(positionsArray, 3);

        // We have to set the attributes after we create the geometry.
        // Three.js will automatically handle the shaders and the faces for the geometry for us.
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", positionsAttribute);

        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
        });
        this.cube = new Mesh<any, MeshBasicMaterial>(geometry, material);
        this.scene.add(this.cube);
    }

    addMultipleTriangles(numberOfTriangles: number) {
        const geometry = new THREE.BufferGeometry();

        // Each triangle needs 3 vertices, and each vertex needs 3 values (x,y,z)
        const arrayLength = numberOfTriangles * 3 * 3;
        const positions = new Float32Array(arrayLength);

        const size = 3;

        for (let i = 0; i < arrayLength; i += 1) {
            // "-0.5" will set the position limits from -0.5 to 0.5
            positions[i] = (Math.random() - 0.5) * size;
        }

        const positionsAttribute = new THREE.BufferAttribute(positions, 3);
        geometry.setAttribute("position", positionsAttribute);

        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
        });
        this.cube = new THREE.Mesh<any, MeshBasicMaterial>(geometry, material);
        this.scene.add(this.cube);
    }

    setUpAnimation() {
        this.animation = (_: number) => {
            this.camera.lookAt(this.cube.position);
        };
    }
}
</script>
