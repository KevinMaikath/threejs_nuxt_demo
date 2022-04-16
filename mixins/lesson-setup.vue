<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import * as THREE from "three";
import { Camera, Mesh, Scene, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export type FrameRequestCallback = (time: number) => void;

/**
 * Handle most of the set up for Three.js
 *
 * Remember to put a <canvas ref="canvas"></canvas> in your Template
 */
@Component
export default class LessonSetupMixin extends Vue {
    renderer!: WebGLRenderer;
    scene!: Scene;
    camera!: Camera;

    cube!: Mesh;
    controls?: OrbitControls;

    private _animation?: FrameRequestCallback;

    sizes = {
        width: 1000,
        height: 750,
    };

    setUp() {
        this.setUpRenderer();
        this.setUpScene();
        this.setUpCamera();
    }

    protected setUpRenderer() {
        const canvas = this.$refs.canvas as HTMLCanvasElement;
        this.renderer = new THREE.WebGLRenderer({ canvas });

        const { width, height } = this.sizes;
        this.renderer.setSize(width, height);
    }

    protected setUpScene() {
        this.scene = new THREE.Scene();
    }

    protected setUpCamera() {
        const { width, height } = this.sizes;
        this.camera = new THREE.PerspectiveCamera(75, width / height);
        this.camera.position.z = 3;
        this.scene.add(this.camera);
    }

    protected setUpSizes() {
        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight,
        };
    }

    protected setUpOrbitControls() {
        if (!this.$refs.canvas) return;

        const {
            OrbitControls,
        } = require("three/examples/jsm/controls/OrbitControls");

        this.controls = new OrbitControls(
            this.camera,
            this.$refs.canvas as HTMLElement
        );

        this.controls!.enableDamping = true;
    }

    /**
     * Render the scene. I can' call this method "render" because that's something used in Vue
     */
    play() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Set the animation function with the callback given as the parameter.
     * The callback doesn't need to care about calling requestAnimationFrame inside of it,
     * this method will handle that.
     *
     * @param func
     */
    set animation(func: FrameRequestCallback | undefined) {
        if (!func) {
            this._animation = undefined;
            return;
        }

        this._animation = (time: number) => {
            func(time);
            this.play();
            requestAnimationFrame(this._animation!.bind(this));
        };
    }

    get animation(): FrameRequestCallback | undefined {
        return this._animation;
    }

    startAnimation() {
        if (!this._animation) return;

        // window.requestAnimationFrame will execute the callback provided in the next frame.
        // It executes only once.
        window.requestAnimationFrame(this._animation.bind(this));
    }

    addCube() {
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial();
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);
    }
}
</script>
