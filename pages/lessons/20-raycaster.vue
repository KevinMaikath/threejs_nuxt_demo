<template>
    <canvas ref="canvas" class="full-screen"></canvas>
</template>

<script lang="ts">
import Component from "vue-class-component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
import {
    AmbientLight,
    Clock,
    DirectionalLight,
    Group,
    Mesh,
    MeshBasicMaterial,
    Raycaster,
    SphereGeometry,
    Vector2,
    Vector3,
} from "three";
import * as THREE from "three";
import LessonSetupMixin from "~/mixins/lesson-setup.vue";
import { removeAllListeners, WindowListenersMap } from "~/types/dom";

type BasicSphereMesh = Mesh<SphereGeometry, MeshBasicMaterial>;

@Component
export default class RayCasterLesson extends LessonSetupMixin {
    canvas!: HTMLCanvasElement;
    controls!: OrbitControls;

    spheres: BasicSphereMesh[] = [];
    rayCaster!: Raycaster;

    // Current position of the mouse
    mouse: Vector2 = new Vector2();

    mouseListeners: WindowListenersMap = {};

    currentIntersection;

    // Imported model section
    isImportedModelSectionEnabled = false;
    gltfLoader!: any;
    duckScene!: Group;
    ambientLight!: AmbientLight;
    directionalLight!: DirectionalLight;
    modelIntersection;

    gui!: GUI;

    mounted() {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.setUp();

        this.setUpImportedModelSection();

        this.addSpheres();
        this.addRayCaster();

        this.setUpMouseMoveListener();
        this.setUpMouseClickListener();

        // this.checkRayIntersects();

        this.setUpOrbitControls();
        this.setUpAnimation();
        this.startAnimation();
    }

    destroy() {
        super.destroy();
        removeAllListeners(this.mouseListeners);
    }

    addSpheres() {
        const sphere1 = this.createSphere();
        sphere1.position.set(-2, 5, 0);

        const sphere3 = this.createSphere();
        sphere3.position.set(2, 6, 0);

        this.spheres = [sphere1, sphere3];

        if (!this.isImportedModelSectionEnabled) {
            const sphere2 = this.createSphere();
            sphere2.position.set(0, 0, 0);
            this.spheres.splice(1, 0, sphere2);
        }

        this.scene.add(...this.spheres);
    }

    /**
     * Create a BasicSphereMesh. We need to create each sphere with an independent material in order to later modify
     * the color of that unique material (if all the spheres share the same material, when we modify the color for one
     * sphere all the spheres will be affected).
     */
    createSphere(): BasicSphereMesh {
        const geometry = new SphereGeometry(0.5, 16, 16);
        const material = new MeshBasicMaterial({ color: "#ff0000" });
        return new Mesh(geometry, material);
    }

    addRayCaster() {
        this.rayCaster = new Raycaster();

        const rayOrigin = new Vector3(-5, 0, 0);
        const rayDirection = new Vector3(10, 0, 0);
        rayDirection.normalize(); // The direction has to be normalized

        this.rayCaster.set(rayOrigin, rayDirection);
    }

    /**
     * Check which objects does the RayCaster intersect with. Each check will return a list of Intersections.
     * An Intersection has the following information:
     * - distance: the distance between the origin of the ray and the collision point.
     * - face: what face of the geometry was hit by the ray.
     * - faceIndex: the index of that face.
     * - object: what object is concerned by the collision.
     * - point: a Vector3 of the exact position in 3D space of the collision.
     * - uv: the UV coordinates in that geometry.
     */
    checkRayIntersects() {
        // Check one single object. This will always return an array of Intersections because it's possible for a
        // RayCaster to intersect one object more than once.
        const individualIntersect = this.rayCaster.intersectObject(
            this.spheres[0]
        );
        console.log(individualIntersect);

        // Check multiple objects at the same tim
        const multipleIntersects = this.rayCaster.intersectObjects(
            this.spheres
        );
        console.log(multipleIntersects);
    }

    /**
     * Store the current mouse position using a window event listener.
     */
    setUpMouseMoveListener() {
        this.mouseListeners.mousemove = (event: Event) => {
            // We can't directly use the position of the mouse in the DOM (position in pixels). WebGL needs values
            // from -1 to 1 for this so that we can pass them to the RayCaster.
            this.mouse.x =
                ((event as MouseEvent).clientX / this.sizes.width) * 2 - 1;
            this.mouse.y =
                -((event as MouseEvent).clientY / this.sizes.height) * 2 + 1;
        };

        window.addEventListener("mousemove", this.mouseListeners.mousemove);
    }

    /**
     * Add a listener to the mouse click and check if the RayCaster intersects with any object at that moment.
     * It uses this.currentIntersection, which is set from the animation function.
     */
    setUpMouseClickListener() {
        this.mouseListeners.click = () => {
            if (!this.currentIntersection) return;

            const objectIndex = this.spheres.indexOf(
                this.currentIntersection.object
            );
            console.log("click on sphere", objectIndex);
        };

        window.addEventListener("click", this.mouseListeners.click);
    }

    /***************************************************************************
     * New section with imported models
     **************************************************************************/

    setUpImportedModelSection() {
        this.isImportedModelSectionEnabled = true;
        this.addGLTFLoader();
        this.addDuckModel();
        this.addLights();
    }

    addGLTFLoader() {
        // Importing this at the beginning of the file was causing errors
        const { GLTFLoader } = require("three/examples/jsm/loaders/GLTFLoader");

        this.gltfLoader = new GLTFLoader();
    }

    addDuckModel() {
        this.gltfLoader.load("/models/Duck/glTF-Binary/Duck.glb", (gltf) => {
            this.duckScene = gltf.scene.clone();

            // Add the whole scene
            this.duckScene.position.y = -0.8;
            this.scene.add(this.duckScene);
        });
    }

    addLights() {
        // Ambient Light
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);

        // Directional Light
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        this.directionalLight.position.set(1, 2, 3);
        this.scene.add(this.directionalLight);
    }

    setUpAnimation() {
        const clock = new Clock();

        this.animation = (_: number) => {
            const elapsedTime = clock.getElapsedTime();

            // Spheres animation
            this.spheres.forEach((sphere, index) => {
                sphere.position.y = Math.sin(elapsedTime * index * 1.5) * 1.5;
            });

            // Refresh the spheres color to the default color. If we don't do this, they will remain with the new color
            // since they intersect with the RayCaster for the first time.
            this.spheres.forEach((sphere) => {
                sphere.material.color.set("#ff0000");
            });

            // RayCaster from the mouse position.
            // We set the position/orientation of the RayCaster here and not in the "mousemove" event because that event
            // might be triggered more times than the framerate in some browsers.
            this.rayCaster.setFromCamera(this.mouse, this.camera);

            // Change the spheres color if the RayCaster intersects with them
            const intersections = this.rayCaster.intersectObjects(this.spheres);
            intersections.forEach((intersection) => {
                const mesh = intersection.object as BasicSphereMesh;
                mesh.material.color.set("#0000ff");
            });

            // Simulate the "mouseenter" and "mouseleave" events on an object in the scene.
            if (intersections.length > 0) {
                if (!this.currentIntersection) {
                    console.log("mouseenter");
                }

                this.currentIntersection = intersections[0];
            } else {
                if (this.currentIntersection) {
                    console.log("mouseleave");
                }

                this.currentIntersection = null;
            }

            // Imported model section
            if (!this.isImportedModelSectionEnabled || !this.duckScene) return;

            /**
             * Notes:
             *
             * `duckScene` is a Group, not a Mesh, but the RayCaster still works
             * on it because it checks for all the children recursively by
             * default. We can enable/disable that with the second parameter of
             * `intersectObject()`.
             *
             * This method returns an array of Intersections for 2 reasons:
             * - It could detect an intersection with multiple Meshes (multiple
             *      children of the Group in this case).
             * - It could detect multiple intersections with the same Mesh
             *      (which can be the case with complex geometries).
             */
            this.modelIntersection = this.rayCaster.intersectObject(
                this.duckScene
            );

            if (this.modelIntersection.length > 0) {
                this.duckScene.scale.set(1.2, 1.2, 1.2);
            } else {
                this.duckScene.scale.set(1, 1, 1);
            }
        };
    }
}
</script>
