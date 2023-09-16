<template>
    <canvas ref="canvas" class="full-screen"></canvas>
</template>

<script lang="ts">
import Component from "vue-class-component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
import { AmbientLight, AnimationMixer, DirectionalLight, Mesh } from "three";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import LessonSetupMixin from "~/mixins/lesson-setup.vue";

@Component
export default class ImportedModelsLesson extends LessonSetupMixin {
    canvas!: HTMLCanvasElement;
    controls!: OrbitControls;

    gui!: GUI;

    plane!: Mesh;
    ambientLight!: AmbientLight;
    directionalLight!: DirectionalLight;

    gltfLoader!: any;

    animationMixer!: AnimationMixer;

    /**
     * # MODEL FORMATS
     *
     * GLTF is becoming a real-time standard (most 3D software, game engines and libraries support it). However, if you
     * only need the data of a geometry you can use lighter formats like OBJ, FBX, STL, or PLY.
     *
     * # GLTF formats
     *
     * GLTF is a format, but it can have different file formats:
     * - glTF
     *      Inside it you can find:
     *      - A .gltf file, containing information about cameras, lights, scenes, materials and objects transformations.
     *      - A .bin file, containing the necessary geometries
     *      - A .png file, containing the texture
     *
     *      The .gltf file references the other files.
     *
     * - glTF-Binary
     *      Contains a unique .glb file. It's easier to load because it's only one file but it's more difficult to edit
     *      because it's a binary file.
     *
     * - glTF-Draco
     *      The buffer data is compressed using the Draco algorithm, so it's lighter than the other formats.
     *
     * - glTF-Embedded
     *      Contains a unique JSON file. It's like the glTF format but the .bin and the texture is embedded inside this
     *      JSON, so it's the heaviest format.
     */
    mounted() {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.setUp();
        this.setUpOrbitControls();

        this.setUpDefaultScene();

        this.addGLTFLoader();
        // this.loadModels();
        // this.loadModelsWithDraco();
        this.loadAnimatedModel();

        this.setUpAnimation();
        this.startAnimation();
    }

    /**
     * Set up the default components of the scene.
     */
    setUpDefaultScene() {
        const material = new THREE.MeshStandardMaterial();
        material.roughness = 0.8;
        material.side = THREE.DoubleSide;

        // Plane
        this.plane = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 10, 100, 100),
            material
        );
        this.plane.rotation.x = -Math.PI / 2;
        this.scene.add(this.plane);

        // Ambient Light
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);

        // Directional Light
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        this.directionalLight.position.set(2, 2, -1);
        this.scene.add(this.directionalLight);
    }

    addGLTFLoader() {
        this.gltfLoader = new GLTFLoader();
    }

    /**
     * Inside the data of the GLTF object given by the GLTFLoader, we can focus on:
     *  group -> children -> [0] (Object3D) -> children -> [0] (Camera) & [1] (Mesh)
     *
     * Also notice that a GLTF file can have multiple scenes inside, but it will always have a reference to the
     * default one (scene).
     *
     * The meshes always have a position, rotation and scale relative to the group. So be careful about this
     * when adding the Mesh directly to your scene.
     *
     * NOTE: the meshes inside a GLTF file are usually physically-rendered-materials, which are reactive to light. So
     * you may need lights in your scene in order to see the objects.
     *
     * There are multiple ways of adding the model into our scene:
     * - Add the whole GLTF scene into our scene.
     * - Add all the children of the default scene and ignore the cameras.
     * - Filter the children before adding it to the scene.
     * - Add only the Mesh (that could cause wrong scale, position and rotation)
     * - Open the file in a 3D software, clean it and export it again.
     *
     * Here we use the second option.
     */
    loadModels() {
        // this.gltfLoader.load("/models/Duck/glTF/Duck.gltf", (gltf) => {

        this.gltfLoader.load(
            "/models/FlightHelmet/glTF/FlightHelmet.gltf",
            (gltf) => {
                console.log({ gltf });
                // const object = gltf.scene.children[0];
                // this.scene.add(object);

                // const meshes = gltf.scene.children.filter(
                //     (obj) => obj instanceof Mesh
                // );
                // this.scene.add(meshes);

                /**
                 * This won't work properly because scene.add() will remove an object from the first scene and add it to
                 * the new one. Therefore, the indexes of the for loop will be a mess.
                 */
                // for (const child of gltf.scene.children) {
                //     this.scene.add(child);
                // }

                /** This will work */
                // const children = [...gltf.scene.children];
                // for (const child of children) {
                //     this.scene.add(child);
                // }

                /**
                 * You can always add the whole scene into the main one. It's much simpler but you have to be careful
                 * because you might be adding things that you don't want (like the PerspectiveCamera in the Duck
                 * example).
                 */
                this.scene.add(gltf.scene);
            }
        );
    }

    /**
     * In the case of GLTF with Draco compression, you need to instantiate a DracoLoader.
     *
     * The Draco decoder is also available in Web Assembly, which means that it can be run in a worker to improve
     * the performance significantly. Three.js provides the code for that inside the folder
     * `/three/examples/js/libs/`.
     *
     * You can copy the `draco` folder from there into your `/static/` folder in order to use it.
     *
     * NOTE: the code of the Draco loader will only be imported if it's used, so we can always provide the Draco loader
     * to the GLTF loader no matter if we use Draco compressed models or not because there won't be any performance
     * costs.
     *
     * Using the Draco compression can make the project lighter and a bit faster but we always need the decoder code and
     * we have to instantiate the Draco loader, so using it or not depends on your project.
     */
    loadModelsWithDraco() {
        const dracoLoader = new DRACOLoader();

        // Set the path to the Web Assembly code
        dracoLoader.setDecoderPath("/draco/");

        // Add the Draco loader to the GLTF Loader
        this.gltfLoader.setDRACOLoader(dracoLoader);

        this.gltfLoader.load("/models/Duck/glTF-Draco/Duck.gltf", (gltf) => {
            this.scene.add(gltf.scene);
        });
    }

    /**
     * GLTF supports animations inside the scenes that it contains.
     *
     * A GLTF object has a property `animations`, which contains a list of AnimationClip. In order to use them, we need
     * to create an AnimationMixer (some kind of player).
     */
    loadAnimatedModel() {
        this.gltfLoader.load("/models/Fox/glTF/Fox.gltf", (gltf) => {
            const foxScene = gltf.scene;
            // We need to scale this scene
            foxScene.scale.set(0.025, 0.025, 0.025);

            this.animationMixer = new AnimationMixer(foxScene);

            // Add the action to the Mixer. Remember to add mixer.update() in the main animation.
            const action = this.animationMixer.clipAction(gltf.animations[1]);
            action.play();

            this.scene.add(foxScene);
        });
    }

    setUpAnimation() {
        const clock = new THREE.Clock();
        let previousTime = 0;

        this.animation = (_: number) => {
            const elapsedTime = clock.getElapsedTime();
            const deltaTime = elapsedTime - previousTime;
            previousTime = elapsedTime;

            this.controls.update();

            if (this.animationMixer) {
                this.animationMixer.update(deltaTime);
            }
        };
    }
}
</script>
