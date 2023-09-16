<template>
    <canvas ref="canvas" class="full-screen"></canvas>
</template>

<script lang="ts">
import Component from "vue-class-component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as THREE from "three";
import {
    AmbientLight,
    DirectionalLight,
    Fog,
    Group,
    Mesh,
    PointLight,
    Texture,
    Vector3,
} from "three";
import LessonSetupMixin from "~/mixins/lesson-setup.vue";
import { setUv2Map } from "~/utils/textures";
import { randomNumberFromInterval } from "~/utils/random";

type TextureName =
    | "color"
    | "alpha"
    | "ambientOcclusion"
    | "height"
    | "normal"
    | "metalness"
    | "roughness";

type TextureMap = { [key in TextureName]?: Texture };

@Component
export default class HauntedHouseLesson extends LessonSetupMixin {
    canvas!: HTMLCanvasElement;
    controls!: OrbitControls;

    ambientLight!: AmbientLight;
    directionalLight!: DirectionalLight;
    doorLight!: PointLight;

    fog!: Fog;
    floor!: Mesh;
    house!: Group;

    textures!: {
        door: TextureMap;
        bricks: TextureMap;
        grass: TextureMap;
    };

    ghosts: PointLight[] = [];

    mounted() {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.setUp();
        this.setCameraPosition();

        this.loadTextures();
        this.fixGrassTextures();

        this.addLights();

        this.addFog();
        this.addFloor();
        this.addHouse();
        this.addBushes();
        this.addGraves();
        this.addGhosts();

        this.enableShadows();
        this.optimizeShadows();

        this.setUpOrbitControls();
        this.setUpAnimation();
        this.startAnimation();
    }

    setCameraPosition() {
        this.camera.position.set(0, 3, 8);
    }

    loadTextures() {
        const textureLoader = new THREE.TextureLoader();
        this.textures = {
            door: {
                color: textureLoader.load("/textures/door/color.jpg"),
                alpha: textureLoader.load("/textures/door/alpha.jpg"),
                ambientOcclusion: textureLoader.load(
                    "/textures/door/ambientOcclusion.jpg"
                ),
                height: textureLoader.load("/textures/door/height.jpg"),
                normal: textureLoader.load("/textures/door/normal.jpg"),
                metalness: textureLoader.load("/textures/door/metalness.jpg"),
                roughness: textureLoader.load("/textures/door/roughness.jpg"),
            },
            bricks: {
                color: textureLoader.load("/textures/bricks/color.jpg"),
                ambientOcclusion: textureLoader.load(
                    "/textures/bricks/ambientOcclusion.jpg"
                ),
                normal: textureLoader.load("/textures/bricks/normal.jpg"),
                roughness: textureLoader.load("/textures/bricks/roughness.jpg"),
            },
            grass: {
                color: textureLoader.load("/textures/grass/color.jpg"),
                ambientOcclusion: textureLoader.load(
                    "/textures/grass/ambientOcclusion.jpg"
                ),
                normal: textureLoader.load("/textures/grass/normal.jpg"),
                roughness: textureLoader.load("/textures/grass/roughness.jpg"),
            },
        };
    }

    /**
     * Since the grass texture is too big, we can make it self-repeat in the floor size a certain number of
     * times so that the grass looks smaller. We have to add the repeat mode to all the grass textures.
     */
    fixGrassTextures() {
        if (!this.textures.grass) return;

        const { color, ambientOcclusion, normal, roughness } =
            this.textures.grass;

        if (!color || !ambientOcclusion || !normal || !roughness) {
            return;
        }

        color.repeat.set(8, 8);
        color.wrapS = THREE.RepeatWrapping;
        color.wrapT = THREE.RepeatWrapping;

        ambientOcclusion.repeat.set(8, 8);
        ambientOcclusion.wrapS = THREE.RepeatWrapping;
        ambientOcclusion.wrapT = THREE.RepeatWrapping;

        normal.repeat.set(8, 8);
        normal.wrapS = THREE.RepeatWrapping;
        normal.wrapT = THREE.RepeatWrapping;

        roughness.repeat.set(8, 8);
        roughness.wrapS = THREE.RepeatWrapping;
        roughness.wrapT = THREE.RepeatWrapping;

        this.textures.grass = {
            color,
            ambientOcclusion,
            normal,
            roughness,
        };
    }

    addLights() {
        // Ambient Light
        this.ambientLight = new THREE.AmbientLight("#b9d5ff", 0.12);
        this.scene.add(this.ambientLight);

        // Directional Light (Moonlight)
        this.directionalLight = new THREE.DirectionalLight("#b9d5ff", 0.12);
        this.directionalLight.position.set(4, 5, -2);
        this.scene.add(this.directionalLight);

        // Door light
        this.doorLight = new THREE.PointLight("#ff7d46", 3, 7);
        this.doorLight.position.set(0, 2.2, 2.7);
        this.scene.add(this.doorLight);
    }

    addFog() {
        const fogColor = "#262837";
        this.fog = new THREE.Fog(fogColor, 1, 15);

        // We assign the Fog directly to the scene
        this.scene.fog = this.fog;

        /**
         * We can change the background color of the scene with setClearColor. By setting this parameter of the
         * renderer to the same color as the fog, we will have a more immersive experience to the scene that we
         * are presenting (we avoid having a blue square with a black background when the fog is too strong).
         */
        this.renderer.setClearColor(fogColor);
    }

    addFloor() {
        this.floor = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20, 100, 100),

            new THREE.MeshStandardMaterial({
                map: this.textures.grass.color,
                aoMap: this.textures.grass.ambientOcclusion,
                normalMap: this.textures.grass.normal,
                roughnessMap: this.textures.grass.roughness,
                side: THREE.DoubleSide,
            })
        );
        setUv2Map(this.floor.geometry);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.position.y = -0.01;

        this.scene.add(this.floor);
    }

    addHouse() {
        this.house = new THREE.Group();
        this.scene.add(this.house);

        // Walls
        const wallsHeight = 2.5;
        const wallsWidth = 4;
        const walls = new THREE.Mesh(
            new THREE.BoxGeometry(wallsWidth, wallsHeight, wallsWidth),
            new THREE.MeshStandardMaterial({
                map: this.textures.bricks.alpha,
                aoMap: this.textures.bricks.ambientOcclusion,
                normalMap: this.textures.bricks.normal,
                roughnessMap: this.textures.bricks.roughness,
            })
        );
        // Add the UV2 map for the ambient occlusion
        setUv2Map(walls.geometry);
        walls.position.y = wallsHeight / 2;
        walls.castShadow = true;
        this.house.add(walls);

        // Roof
        const roofHeight = 1;
        const roof = new THREE.Mesh(
            new THREE.ConeGeometry(3.5, 1, 4),
            new THREE.MeshStandardMaterial({ color: "#b35f45" })
        );
        roof.position.y = wallsHeight + roofHeight / 2;
        roof.rotation.y = Math.PI / 4;
        this.house.add(roof);

        // Door
        const doorHeight = 2.2;
        const door = new THREE.Mesh(
            new THREE.PlaneGeometry(2.2, doorHeight, 100, 100),
            new THREE.MeshStandardMaterial({
                map: this.textures.door?.color,
                transparent: true,
                alphaMap: this.textures.door?.alpha,
                aoMap: this.textures.door?.ambientOcclusion,
                displacementMap: this.textures.door?.height,
                displacementScale: 0.1,
                normalMap: this.textures.door?.normal,
                metalnessMap: this.textures.door?.metalness,
                roughnessMap: this.textures.door?.roughness,
            })
        );
        // Add the UV2 map for the ambient occlusion
        setUv2Map(door.geometry);
        door.position.z = wallsWidth / 2 + 0.01;
        door.position.y = doorHeight / 2 - 0.1; // Fix the missing height from the Texture
        this.house.add(door);
    }

    addBushes() {
        const bushGeometry = new THREE.SphereGeometry(1, 16, 16);
        const bushMaterial = new THREE.MeshStandardMaterial({
            color: "#89c854",
        });

        const bush1 = new THREE.Mesh(bushGeometry, bushMaterial);
        bush1.scale.set(0.5, 0.5, 0.5);
        bush1.position.set(0.8, 0.2, 2.2);
        bush1.castShadow = true;

        const bush2 = new THREE.Mesh(bushGeometry, bushMaterial);
        bush2.scale.set(0.25, 0.25, 0.25);
        bush2.position.set(1.4, 0.1, 2.1);
        bush2.castShadow = true;

        const bush3 = new THREE.Mesh(bushGeometry, bushMaterial);
        bush3.scale.set(0.4, 0.4, 0.4);
        bush3.position.set(-0.8, 0.1, 2.2);
        bush3.castShadow = true;

        const bush4 = new THREE.Mesh(bushGeometry, bushMaterial);
        bush4.scale.set(0.15, 0.15, 0.15);
        bush4.position.set(-1, 0.05, 2.6);
        bush4.castShadow = true;

        this.house.add(bush1, bush2, bush3, bush4);
    }

    addGraves() {
        const graves = new THREE.Group();
        this.scene.add(graves);

        const graveGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.2);
        const graveMaterial = new THREE.MeshStandardMaterial({
            color: "#b2b6b1",
        });

        for (let i = 0; i <= 50; i += 1) {
            const angle = Math.random() * Math.PI * 2; // Min: 0, Max: 2*PI
            const radius = 3 + Math.random() * 6; // Min: 3, Max: 9

            // With sin and cos, the grave will have a position inside the target circle (angle + radius)
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius;

            const grave = new THREE.Mesh(graveGeometry, graveMaterial);
            grave.position.set(x, 0.3, z);

            grave.rotation.y = (Math.random() - 0.5) * 0.5;
            grave.rotation.z = (Math.random() - 0.5) * 0.5;

            grave.castShadow = true;

            graves.add(grave);
        }
    }

    addGhosts() {
        const ghost1 = new THREE.PointLight("#ff00ff", 4, 3);
        const ghost2 = new THREE.PointLight("#00ffff", 4, 3);
        const ghost3 = new THREE.PointLight("#ffff00", 4, 3);

        this.ghosts = [ghost1, ghost2, ghost3];
        this.scene.add(...this.ghosts);
    }

    enableShadows() {
        this.renderer.shadowMap.enabled = true;

        this.directionalLight.castShadow = true;
        this.doorLight.castShadow = true;
        this.ghosts.forEach((ghost) => {
            ghost.castShadow = true;
        });

        // The walls, bushes and graves castShadow is set in their respectives add methods.

        this.floor.receiveShadow = true;
    }

    optimizeShadows() {
        this.directionalLight.shadow.mapSize.width = 256;
        this.directionalLight.shadow.mapSize.height = 256;
        this.directionalLight.shadow.camera.far = 15;

        this.doorLight.shadow.mapSize.width = 256;
        this.doorLight.shadow.mapSize.height = 256;
        this.doorLight.shadow.camera.far = 7;

        this.ghosts.forEach((ghost) => {
            ghost.shadow.mapSize.width = 256;
            ghost.shadow.mapSize.height = 256;
            ghost.shadow.camera.far = 7;
        });

        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    /**
     * Generate a function where a ghost changes it's position with the time.
     * The speed and the amplitude of the movement must be fixed but the time must vary on each animation tick.
     *
     * @param ghost PointLight to move
     * @param speed Speed of movement
     * @param amplitude Maximum amplitudes for the circular movement
     */
    ghostAnimation(
        ghost: PointLight,
        speed: number,
        amplitude: Vector3
    ): (time: number) => void {
        return (time) => {
            const angle = time * speed;
            ghost.position.set(
                Math.cos(angle) * amplitude.x,
                Math.sin(angle * amplitude.y),
                Math.sin(angle) * amplitude.z
            );
        };
    }

    setUpAnimation() {
        const clock = new THREE.Clock();

        const ghostAnimations = this.ghosts.map((ghost) => {
            const speed = randomNumberFromInterval(1, 1.5);
            const amplitude = new Vector3(
                randomNumberFromInterval(2, 6),
                randomNumberFromInterval(2, 6),
                randomNumberFromInterval(2, 6)
            );

            return this.ghostAnimation(ghost, speed, amplitude);
        });

        this.animation = (_: number) => {
            const elapsedTime = clock.getElapsedTime();

            ghostAnimations.forEach((animation) => {
                animation(elapsedTime);
            });
        };
    }
}
</script>
