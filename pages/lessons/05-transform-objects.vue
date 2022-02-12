<template>
    <canvas ref="canvas"></canvas>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import * as THREE from "three";
import {
    AxesHelper,
    Group,
    Mesh,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
} from "three";

@Component
export default class TransformObjectsPage extends Vue {
    renderer!: WebGLRenderer;
    scene!: Scene;
    camera!: PerspectiveCamera;

    cube!: Mesh;
    axesHelper!: AxesHelper;

    group!: Group;

    readonly sizes = {
        width: 1000,
        height: 750,
    };

    mounted() {
        this.setUpRenderer();
        this.setUpScene();
        this.setUpCamera();

        // this.addCube();

        this.play();

        // this.moveCube();
        // this.moveCamera();
        this.addAxesHelper();
        //
        // this.resizeCube();
        //
        // this.rotateCube();
        //
        // this.lookAtCube();

        this.setUpGroup();
        this.moveGroup();
    }

    setUpRenderer() {
        const canvas = this.$refs.canvas as HTMLCanvasElement;
        this.renderer = new THREE.WebGLRenderer({ canvas });

        const { width, height } = this.sizes;
        this.renderer.setSize(width, height);
    }

    setUpScene() {
        this.scene = new THREE.Scene();
    }

    setUpCamera() {
        const { width, height } = this.sizes;
        this.camera = new THREE.PerspectiveCamera(75, width / height);
        this.camera.position.z = 3;
        this.scene.add(this.camera);
    }

    addCube() {
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);
    }

    /**
     * Render the scene. I can' call this method "render" because that's something used in Vue
     */
    play() {
        this.renderer.render(this.scene, this.camera);
    }

    moveCube() {
        const { position: cubePosition } = this.cube;
        cubePosition.x = 0.7;
        cubePosition.y = 1;
        cubePosition.y = -1;

        // Distance from the center of the scene to the cube
        console.log("length", cubePosition.length());

        // Distance from the cube to the camera
        const distanceToCamera = cubePosition.distanceTo(this.camera.position);
        console.log("distance to camera", distanceToCamera);

        // You can normalize a vector (reduce its total length to 1)
        cubePosition.normalize();
        console.log("normalized length", cubePosition.length());

        this.play();
    }

    moveCamera() {
        const { position: cameraPosition } = this.camera;

        // You can update the 3 values of position at once
        cameraPosition.set(2, 1, 4);
    }

    addAxesHelper() {
        // The length of the axes helpers displayed is 1 unit.
        // You can set the size of the helpers with THREE.AxesHelper(size).
        this.axesHelper = new THREE.AxesHelper();
        this.scene.add(this.axesHelper);

        this.play();
    }

    resizeCube() {
        const { scale: cubeScale } = this.cube;
        cubeScale.set(2, 0.5, 0.5);

        this.play();
    }

    rotateCube() {
        // For rotations, you have to imagine the axis that you're going to rotate as a stick
        // going through the objects center and then you rotate the stick
        const { rotation: cubeRotation } = this.cube;
        cubeRotation.y = 0.5;

        // The value that you're rotating is radians.
        // For example, if you want to do a half revolution (180º) you have to rotate with a value of PI
        cubeRotation.z = Math.PI;

        // You must be careful while rotating more than one axis because when you rotate one you're changing the
        // orientation of the others. Also you can actually lock one axis and don't be able to rotate it anymore
        // (this is called a gimbal lock)
        //
        // In order to organize the axes rotation better, you can change the order in which the axes are rotated
        // (default is "XYZ")
        //
        // If you comment this, you'll see that the following rotation will have a different result
        cubeRotation.reorder("YXZ");

        // Rotate 45º
        cubeRotation.x = Math.PI * 0.25;
        cubeRotation.y = Math.PI * 0.25;

        this.play();
    }

    lookAtCube() {
        this.camera.lookAt(this.cube.position);
        this.play();
    }

    setUpGroup() {
        this.group = new THREE.Group();
        this.scene.add(this.group);

        const cube1 = new THREE.Mesh(
            new THREE.BoxGeometry(),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        cube1.position.x = -2;

        const cube2 = new THREE.Mesh(
            new THREE.BoxGeometry(),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        );

        const cube3 = new THREE.Mesh(
            new THREE.BoxGeometry(),
            new THREE.MeshBasicMaterial({ color: 0x0000ff })
        );

        cube3.position.x = 2;

        // You can add multiple objects at the same time
        this.group.add(cube1, cube2, cube3);
    }

    moveGroup() {
        // This will move all the objects inside the group at once
        this.group.position.y = 1;
        this.play();
    }
}
</script>

<style scoped lang="scss"></style>
