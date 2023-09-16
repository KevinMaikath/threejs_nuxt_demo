<template>
    <div class="main-container">
        <canvas ref="canvas" class="full-screen"></canvas>

        <div class="content-container">
            <section class="section">
                <h1>My Portfolio</h1>
            </section>
            <section class="section">
                <h2>My projects</h2>
            </section>
            <section class="section">
                <h2>Contact me</h2>
            </section>
        </div>
    </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
import * as THREE from "three";
import {
    Clock,
    Group,
    Mesh,
    MeshToonMaterial,
    PointsMaterial,
    Vector2,
} from "three";
import gsap from "gsap";
import LessonSetupMixin from "~/mixins/lesson-setup.vue";
import { removeAllListeners, WindowListenersMap } from "~/types/dom";

@Component({ layout: "default" })
export default class ScrollLesson extends LessonSetupMixin {
    canvas!: HTMLCanvasElement;
    controls!: OrbitControls;

    gui!: GUI;

    material!: MeshToonMaterial;
    particlesMaterial!: PointsMaterial;
    objects: Mesh[] = [];

    parameters = {
        materialColor: "#ffeded",
        objectsDistance: 4,
        particlesCount: 200,
    };

    listeners: WindowListenersMap = {};

    cameraGroup: Group = new Group();

    // Current vertical scroll in the Window
    scrollY: number = 0;
    currentSection = 0;

    // Current position of the mouse in the Window
    mouse: Vector2 = new Vector2();

    async mounted() {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.setUp();
        this.addCameraToCameraGroup();

        this.addObjects();
        this.addLight();

        this.setObjectPositions();

        this.addParticles();

        this.setUpScroll();
        this.setUpMousemove();

        await this.addGui();
        this.setUpGui();

        this.setUpAnimation();
        this.startAnimation();
    }

    beforeDestroy() {
        removeAllListeners(this.listeners);
    }

    /**
     * Remove the scrollbars size from the total height.
     */
    protected setUpSizes() {
        this.sizes = {
            width: window.innerWidth - 15,
            height: window.innerHeight,
        };
    }

    /**
     * Override the default setUpRenderer to set "alpha=true" to have a transparent background on the scene.
     */
    protected setUpRenderer() {
        const canvas = this.$refs.canvas as HTMLCanvasElement;

        // By default, "alpha=true" will set the "clearAlpha" of the renderer to 0. We can specify a value for the
        // "clearAlpha" with renderer.setClearAlpha(0.5)
        this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true });

        const { width, height } = this.sizes;
        this.renderer.setSize(width, height);
    }

    /**
     * Add the Camera to a Group and add that Group to the Scene.
     * This will help us achieve the "parallax" effect by moving the Group for that while still moving the Camera to
     * achieve the scroll.
     */
    addCameraToCameraGroup() {
        this.cameraGroup.add(this.camera);
        this.scene.add(this.cameraGroup);
    }

    addObjects() {
        // Textures
        const textureLoader = new THREE.TextureLoader();
        const gradientTexture = textureLoader.load("/textures/gradients/3.jpg");

        // Change the default gradient effect to a cartoon-ish effect
        gradientTexture.magFilter = THREE.NearestFilter;

        // Material
        const { materialColor: color } = this.parameters;
        this.material = new MeshToonMaterial({
            color,
            gradientMap: gradientTexture,
        });

        // Objects
        const mesh1 = new THREE.Mesh(
            new THREE.TorusGeometry(1, 0.4, 16, 60),
            this.material
        );
        const mesh2 = new THREE.Mesh(
            new THREE.ConeGeometry(1, 2, 32),
            this.material
        );
        const mesh3 = new THREE.Mesh(
            new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16),
            this.material
        );

        this.objects = [mesh1, mesh2, mesh3];
        this.scene.add(...this.objects);
    }

    addLight() {
        const directionalLight = new THREE.DirectionalLight("#ffffff", Math.PI);
        directionalLight.position.set(1, 1, 0);
        this.scene.add(directionalLight);
    }

    /**
     * Set the position of each object in the scene.
     *
     * By default, in Three.js, the field of view is vertical. This means that if you put one object on the top part of
     * the render and one object on the bottom part of the render and then you resize the window, you'll notice that the
     * objects stay put at the top and at the bottom.
     *
     * That means that if we separate two objects enough so that we can see the first one but not the second one, we
     * will always see the first one but not the second one no matter the screen size.
     */
    setObjectPositions() {
        this.objects.forEach((object, index) => {
            object.position.y = -this.parameters.objectsDistance * index;
            object.position.x = 2 * (index % 2 ? -1 : 1);
        });
    }

    addParticles() {
        // Geometry
        const positions = new Float32Array(this.parameters.particlesCount * 3);

        for (let i = 0; i < this.parameters.particlesCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] =
                this.parameters.objectsDistance * 0.5 -
                Math.random() *
                    this.parameters.objectsDistance *
                    this.objects.length;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }

        const particlesGeometry = new THREE.BufferGeometry();
        particlesGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
        );

        // Material
        this.particlesMaterial = new THREE.PointsMaterial({
            color: this.parameters.materialColor,
            sizeAttenuation: true,
            size: 0.03,
        });

        // Points
        const particles = new THREE.Points(
            particlesGeometry,
            this.particlesMaterial
        );
        this.scene.add(particles);
    }

    setUpScroll() {
        this.listeners.scroll = () => {
            this.scrollY = window.scrollY;

            // This works because each section has a height of exactly 100vh
            const newSection = Math.round(this.scrollY / this.sizes.height);

            if (newSection !== this.currentSection) {
                this.currentSection = newSection;
                this.animateObject(this.currentSection);
            }
        };

        window.addEventListener("scroll", this.listeners.scroll);
    }

    /**
     * Animate an object by making it spin.
     * @param objectIndex Index of the section corresponding to the object to animate
     */
    animateObject(objectIndex: number) {
        // This won't work if we are also setting the objects rotation in the animation function.
        // In order to have both things working together, we can set object.rotation += deltaTime * 0.1 in the animation
        // function in order to add a rotation all the time instead of setting it.
        gsap.to(this.objects[objectIndex].rotation, {
            duration: 1.5,
            ease: "power2.inOut",
            x: "+=3",
            y: "+=6",
        });
    }

    setUpMousemove() {
        this.listeners.mousemove = (event: Event) => {
            const mouseEvent = event as MouseEvent;

            // Here we normalize the values so that they go from -0.5 to 0.5.
            // This way we will achieve the same behaviour in different screen sizes
            this.mouse.x = mouseEvent.clientX / this.sizes.width - 0.5;
            this.mouse.y = mouseEvent.clientY / this.sizes.height - 0.5;
        };

        window.addEventListener("mousemove", this.listeners.mousemove);
    }

    setUpGui() {
        this.gui.addColor(this.parameters, "materialColor").onChange(() => {
            this.material.color.set(this.parameters.materialColor);
            this.particlesMaterial.color.set(this.parameters.materialColor);
        });
    }

    setUpAnimation() {
        const clock = new Clock();
        let previousTime = 0;

        this.animation = (_: number) => {
            const elapsedTime = clock.getElapsedTime();

            /**
             * The time delta stores the time between each frame.
             * This will help us make animations that behave the same way in screens with different refresh rate.
             *
             * The Clock class has a method "getDelta", but that won't give us the expected result and could mess up
             * the behaviour.
             */
            const deltaTime = elapsedTime - previousTime;
            previousTime = elapsedTime;

            for (const obj of this.objects) {
                obj.rotation.x += deltaTime * 0.1;
                obj.rotation.y += deltaTime * 0.12;
            }

            // Camera "scroll"
            this.camera.position.y =
                (-this.scrollY / this.sizes.height) *
                this.parameters.objectsDistance;

            // Parallax without easing
            // this.cameraGroup.position.x = this.mouse.x;
            // this.cameraGroup.position.y = -this.mouse.y;

            /**
             * Parallax with easing.
             *
             * "Easing" consists on smoothing the movement animation so that it doesn't look too linear.
             * We can achieve the easing by moving the camera just a part of the distance between its current position
             * and the target position and making it move slower the closer it gets to the target position.
             *
             * In this case, we make the camera move a 10th part of the distance to the mouse position.
             */
            // this.cameraGroup.position.x +=
            //     (this.mouse.x - this.cameraGroup.position.x) * 0.1
            // this.cameraGroup.position.y +=
            //     (-this.mouse.y - this.cameraGroup.position.y) * 0.1;

            /**
             * If we want the animation to behave the same way in screens with different refresh rate, we need to use
             * deltaTime. Since deltaTime has a very little value (around 0.016 for 60fps screens), we need to multiply
             * it by a value higher than before in order to see a decent movement.
             */
            this.cameraGroup.position.x +=
                // Decrease the amplitude of the effect by half
                (this.mouse.x * 0.5 - this.cameraGroup.position.x) *
                (5 * deltaTime);
            this.cameraGroup.position.y +=
                (-this.mouse.y * 0.5 - this.cameraGroup.position.y) *
                (5 * deltaTime);
        };
    }
}
</script>

<style lang="scss" scoped>
canvas.full-screen {
    position: fixed;
    z-index: 0;
}

.main-container {
    position: relative;
    background-color: #1e1a20;
}

.content-container {
    padding: 30px;
    z-index: 1;
}

.section {
    display: flex;
    align-items: center;
    height: 100vh;
    position: relative;
    font-family: "Cabin", sans-serif;
    color: #ffeded;
    text-transform: uppercase;
    font-size: 7vmin;
    padding-left: 10%;
    padding-right: 10%;
}

section:nth-child(even) {
    justify-content: flex-end;
}
</style>
