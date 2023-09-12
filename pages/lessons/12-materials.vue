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
    MeshStandardMaterial,
    MeshToonMaterial,
    Texture,
    TextureLoader,
} from "three";
import { GUI } from "dat.gui";
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
        | MeshToonMaterial
        | MeshStandardMaterial;

    plane!: Mesh;
    sphere!: Mesh;
    torus!: Mesh;

    gui!: GUI;

    clock!: Clock;
    objects!: Mesh[];

    mounted() {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.setUpSizes();
        this.setUp();

        this.setUpTextureLoader();
        this.setUpTexture();
        // this.setUpMaterial();
        this.setUpLights();

        this.addEnvironmentMap();

        this.addGui();
        this.setUpGui();

        this.addPlane();
        this.addSphere();
        this.addTorus();

        // this.addAmbientOcclusionMap();
        // this.addDisplacementMap();
        // this.addMetalnessMap();
        // this.addRoughnessMap();
        // this.addNormalMap();
        // this.addAlphaMap();

        this.setUpOrbitControls();
        this.setUpClock();
        this.setUpAnimation();
        this.startAnimation();
    }

    setUpTextureLoader() {
        this.textureLoader = new THREE.TextureLoader();
    }

    setUpTexture() {
        this.texture = this.textureLoader.load("/textures/door/color.jpg");
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
        // this.material = new MeshToonMaterial();

        /**
         * By default, we see a gradient instead of a clear separation (the cartoon effect) because the gradient image
         * is very small and the magFilter tries to fix it with the mip-mapping. We can set the minFilter and magFilter
         * to NearestFilter to fix that
         */
        // const gradientTexture = this.textureLoader.load(
        //     "/textures/gradients/5.jpg"
        // );
        // gradientTexture.minFilter = THREE.NearestFilter;
        // gradientTexture.magFilter = THREE.NearestFilter;
        // gradientTexture.generateMipmaps = false;
        // this.material.gradientMap = gradientTexture;

        /**
         * MeshStandardMaterial uses physically based rendering principles (PBR). Like the Lambert and Phong materials,
         * it supports light but with a better algorithm and better parameters like roughness and metalness.
         */
        this.material = new MeshStandardMaterial();

        // (this.material as MeshStandardMaterial).roughness = 0.45;
        // (this.material as MeshStandardMaterial).metalness = 0.45;

        (this.material as MeshStandardMaterial).map = this.texture;

        /**
         * We can make a plane have both sides by setting the side attribute
         */
        this.material.side = THREE.DoubleSide;

        /**
         * Other materials:
         * - MeshPhysicalMaterial: it's like MeshStandardMaterial but with a clear coat over it (a special shining).
         * - PointMaterial: used for particles.
         * - ShaderMaterial and RawShaderMaterial: used for shaders.
         */
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

    setUpGui() {
        // This will only work if the material is a MeshStandardMaterial.
        if ("metalness" in this.material) {
            this.gui.add(this.material, "metalness").min(0).max(1).step(0.0001);
        }

        if ("roughness" in this.material) {
            this.gui.add(this.material, "roughness").min(0).max(1).step(0.0001);
        }

        if ("aoMapIntensity" in this.material) {
            this.gui
                .add(this.material, "aoMapIntensity")
                .min(0)
                .max(10)
                .step(0.01);
        }

        if ("displacementScale" in this.material) {
            this.gui
                .add(this.material, "displacementScale")
                .min(0)
                .max(1)
                .step(0.0001);
        }
    }

    addPlane() {
        this.plane = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1, 100, 100),
            this.material
        );
        this.scene.add(this.plane);
    }

    addSphere() {
        this.sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 64, 64),
            this.material
        );
        this.sphere.position.x = -1.5;
        this.scene.add(this.sphere);
    }

    addTorus() {
        this.torus = new THREE.Mesh(
            new THREE.TorusGeometry(0.3, 0.2, 64, 128),
            this.material
        );
        this.torus.position.x = 1.5;
        this.scene.add(this.torus);
    }

    /**
     * The Ambient Occlusion Map consists of the details of a Texture that decide which parts should be darker or
     * lighter due to the shape of the Texture (it tries to give a better approach to 3D for the Texture).
     *
     * In order to add an Ambient Occlusion Map to a Mesh, we need to provide a set of UV coordinates called "uv2" to
     * the geometries.
     */
    addAmbientOcclusionMap() {
        // We're just copying the values from "uv" to "uv2"
        this.sphere.geometry.setAttribute(
            "uv2",
            new THREE.BufferAttribute(
                this.sphere.geometry.attributes.uv.array,
                2
            )
        );
        this.plane.geometry.setAttribute(
            "uv2",
            new THREE.BufferAttribute(
                this.plane.geometry.attributes.uv.array,
                2
            )
        );
        this.torus.geometry.setAttribute(
            "uv2",
            new THREE.BufferAttribute(
                this.torus.geometry.attributes.uv.array,
                2
            )
        );

        (this.material as MeshStandardMaterial).aoMap = this.textureLoader.load(
            "/textures/door/ambientOcclusion.jpg"
        );

        // We can also adjust the intensity of the aoMap in the material
        // (this.material as MeshStandardMaterial).aoMapIntensity = 3;
    }

    /**
     * Also known as Height map, the Displacement gives relief (topography) to the material (3D).
     */
    addDisplacementMap() {
        (this.material as MeshStandardMaterial).displacementMap =
            this.textureLoader.load("/textures/door/height.jpg");

        /**
         * At the beginning it will look horrible because the geometries have too little vertices and the Displacement
         * map is too strong. We can adjust the displacement scale here but the number of vertices must be set up when
         * creating the geometries.
         */
        (this.material as MeshStandardMaterial).displacementScale = 0.05;
    }

    /**
     * Add the Metalness map to the Material. It's usually not a good idea to mix metalness with metalnessMap.
     */
    addMetalnessMap() {
        (this.material as MeshStandardMaterial).metalnessMap =
            this.textureLoader.load("/textures/door/metalness.jpg");
    }

    /**
     * Add the Roughness map to the Material. It's usually not a good idea to mix roughness with roughnessMap.
     */
    addRoughnessMap() {
        (this.material as MeshStandardMaterial).roughnessMap =
            this.textureLoader.load("/textures/door/roughness.jpg");
    }

    /**
     * Add the Normal map to the Material.
     */
    addNormalMap() {
        (this.material as MeshStandardMaterial).normalMap =
            this.textureLoader.load("/textures/door/normal.jpg");

        // We can change the Normal intensity with a Vector2 (x, y)
        (this.material as MeshStandardMaterial).normalScale.set(0.5, 0.5);
    }

    /**
     * Add the Normal map to the Material. We need to set material.transparent = true in order to make the Alpha work.
     */
    addAlphaMap() {
        (this.material as MeshStandardMaterial).alphaMap =
            this.textureLoader.load("/textures/door/alpha.jpg");
        (this.material as MeshStandardMaterial).transparent = true;
    }

    /**
     * Add the Environment map to the scene. This is the background image of the scene.
     *
     * Three.js only supports cube environment maps. Therefore we need a CubeTextureLoader to load those maps.
     */
    addEnvironmentMap() {
        const cubeTextureLoader = new THREE.CubeTextureLoader();

        // Cube Textures need 6 vertices
        const environmentMap = cubeTextureLoader.load([
            "/textures/environmentMaps/0/px.jpg", // Positive X
            "/textures/environmentMaps/0/nx.jpg", // Negative X
            "/textures/environmentMaps/0/py.jpg",
            "/textures/environmentMaps/0/ny.jpg",
            "/textures/environmentMaps/0/pz.jpg",
            "/textures/environmentMaps/0/nz.jpg",
        ]);

        /**
         * This will reset the material to give an example of how can we make a Material reflect the environment map.
         */
        this.material = new MeshStandardMaterial();
        (this.material as MeshStandardMaterial).metalness = 0.7;
        (this.material as MeshStandardMaterial).roughness = 0.2;
        (this.material as MeshStandardMaterial).envMap = environmentMap;
    }

    setUpClock() {
        this.clock = new THREE.Clock();
    }

    setUpAnimation() {
        this.objects = [this.plane, this.sphere, this.torus];

        this.animation = (_: number) => {
            const elapsedTime = this.clock.getElapsedTime();

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
