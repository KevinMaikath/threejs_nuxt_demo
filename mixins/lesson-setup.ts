import Vue from "vue";
import Component from "vue-class-component";
import * as THREE from "three";
import {
    BoxGeometry,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";

export type FrameRequestCallback = (time: number) => void;

/**
 * Handle most of the set up for Three.js
 *
 * Remember to put a <canvas ref="canvas"></canvas> in your Template
 */
@Component({
    layout: "fullscreen",
})
export default class LessonSetupMixin extends Vue {
    renderer!: WebGLRenderer;
    scene!: Scene;
    camera!: PerspectiveCamera;

    cube!: Mesh<BoxGeometry, MeshBasicMaterial>;
    controls?: OrbitControls;

    gui?: GUI;

    resizeListener?: () => void;

    private _animation?: FrameRequestCallback;

    sizes = {
        width: 1000,
        height: 750,
    };

    setUp(resize: boolean = true) {
        // Set up the window size before creating the renderer
        if (resize) {
            this.setUpSizes();
            this.setUpResizing();
        }

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

        this.controls = new OrbitControls(
            this.camera,
            this.$refs.canvas as HTMLElement
        );

        this.controls!.enableDamping = true;
    }

    /**
     * Create the resize listener callback and assign it to the window resize
     * event.
     */
    setUpResizing() {
        this.resizeListener = () => {
            this.setUpSizes();

            this.camera.aspect = this.sizes.width / this.sizes.height;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(this.sizes.width, this.sizes.height);

            // You can increase the pixelRatio to improve the image quality
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        };
        window.addEventListener("resize", this.resizeListener);
    }

    /** Clean listeners */
    beforeDestroy() {
        if (this.resizeListener) {
            window.removeEventListener("resize", this.resizeListener);
        }

        if (this.gui) this.gui.destroy();
    }

    /**
     * Render the scene. I can' call this method "render" because that's
     * something used in Vue.
     */
    play() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Set the animation function with the callback given as the parameter.
     * The callback doesn't need to care about calling requestAnimationFrame
     * inside of it, this method will handle that.
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
            if (this.controls) this.controls.update();
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
        const geometry = new BoxGeometry();
        const material = new MeshBasicMaterial();
        this.cube = new Mesh(geometry, material);
        this.scene.add(this.cube);
    }

    /**
     * Create a dat.GUI instance and save it in this.gui
     * It will also remove the previous GUIs from the DOM if there's anyone (if
     * we don't do that, we will add a new GUI everytime that the hot-reload is
     * triggered).
     */
    async addGui() {
        if (!process.client) return;

        const previousGui = document.querySelectorAll(".dg.main.a");
        for (const gui of previousGui) {
            gui.remove();
        }

        // The library dat.gui has to be imported locally to avoid the error
        // "window is not defined" on every page reload
        const { GUI } = await import("dat.gui");
        this.gui = new GUI({ name: "main-gui" });
    }
}
