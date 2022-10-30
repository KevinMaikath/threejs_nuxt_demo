<template>
    <canvas ref="canvas" class="full-screen"></canvas>
</template>

<script lang="ts">
import Component from "vue-class-component";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
import {
    AmbientLight,
    BoxGeometry,
    Clock,
    CubeTexture,
    CubeTextureLoader,
    DirectionalLight,
    DoubleSide,
    Mesh,
    MeshStandardMaterial,
    PCFSoftShadowMap,
    PlaneGeometry,
    SphereGeometry,
    Vector3,
} from "three";
import CANNON, { Body, World } from "cannon";
import LessonSetupMixin from "~/mixins/lesson-setup.vue";
import {
    cannonQuaternionToThreeQuaternion,
    vec3ToVector3,
    vector3ToVec3,
} from "~/utils/physics";

type SphereMesh = Mesh<SphereGeometry, MeshStandardMaterial>;
type FloorMesh = Mesh<PlaneGeometry, MeshStandardMaterial>;
type BoxMesh = Mesh<BoxGeometry, MeshStandardMaterial>;

type SphereInstance = { mesh: SphereMesh; body: Body };
type BoxInstance = { mesh: BoxMesh; body: Body };

@Component
export default class PhysicsLesson extends LessonSetupMixin {
    canvas!: HTMLCanvasElement;
    controls!: OrbitControls;

    gui!: GUI;
    guiActions: any = {};

    envMapTexture!: CubeTexture;
    sphere!: SphereMesh;
    floor!: FloorMesh;

    ambientLight!: AmbientLight;
    directionalLight!: DirectionalLight;

    physicsWorld!: World;
    physicsFloor!: Body;

    physicsSphere!: Body;

    // Default values for the spheres.
    // Creating them just once allows us to reuse them as many times as we want without impacting too much the
    // performance.
    sphereGeometry = new SphereGeometry(1, 32, 32);
    sphereMaterial = new MeshStandardMaterial({
        metalness: 0.3,
        roughness: 0.4,
        envMapIntensity: 0.5,
    });

    spheres: SphereInstance[] = [];

    boxGeometry = new BoxGeometry(1, 1, 1);
    boxMaterial = new MeshStandardMaterial({
        metalness: 0.3,
        roughness: 0.4,
        envMapIntensity: 0.5,
    });

    boxes: BoxInstance[] = [];

    mounted() {
        this.canvas = this.$refs.canvas as HTMLCanvasElement;
        this.setUp();
        this.camera.position.y = 5;
        this.camera.position.z = 10;
        this.enableShadows();

        this.loadTextures();
        // this.addSphere();
        this.addFloor();
        this.addLights();

        this.addPhysicsObjects();
        // this.setPhysicsMaterials();
        this.setPhysicsDefaultMaterial();
        this.setPhysicsWorldBroadPhase();
        this.setPhysicsWorldSleep();

        // this.applyInitialForceToSingleSphere();

        this.addGui();
        this.setUpGui();

        this.setUpOrbitControls();
        this.setUpAnimation();
        this.startAnimation();
    }

    enableShadows() {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFSoftShadowMap;
    }

    loadTextures() {
        const cubeTextureLoader = new CubeTextureLoader();

        this.envMapTexture = cubeTextureLoader.load([
            "/textures/environmentMaps/0/px.jpg",
            "/textures/environmentMaps/0/nx.jpg",
            "/textures/environmentMaps/0/py.jpg",
            "/textures/environmentMaps/0/ny.jpg",
            "/textures/environmentMaps/0/pz.jpg",
            "/textures/environmentMaps/0/nz.jpg",
        ]);

        this.sphereMaterial.envMap = this.envMapTexture;
        this.boxMaterial.envMap = this.envMapTexture;
    }

    addSphere() {
        this.sphere = new Mesh(
            new SphereGeometry(0.5, 32, 32),
            new MeshStandardMaterial({
                metalness: 0.3,
                roughness: 0.4,
                envMap: this.envMapTexture,
                envMapIntensity: 0.5,
            })
        );
        this.sphere.castShadow = true;
        this.sphere.position.y = 3;
        this.scene.add(this.sphere);
    }

    addFloor() {
        this.floor = new Mesh(
            new PlaneGeometry(10, 10),
            new MeshStandardMaterial({
                color: "#777777",
                metalness: 0.3,
                roughness: 0.4,
                envMap: this.envMapTexture,
                envMapIntensity: 0.5,
                side: DoubleSide,
            })
        );
        this.floor.receiveShadow = true;
        this.floor.rotation.x = -Math.PI * 0.5;
        this.scene.add(this.floor);
    }

    addLights() {
        this.ambientLight = new AmbientLight(0xffffff, 0.7);
        this.scene.add(this.ambientLight);

        this.directionalLight = new DirectionalLight(0xffffff, 0.2);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.set(1024, 1024);
        this.directionalLight.shadow.camera.far = 15;
        this.directionalLight.shadow.camera.left = -7;
        this.directionalLight.shadow.camera.top = 7;
        this.directionalLight.shadow.camera.right = 7;
        this.directionalLight.shadow.camera.bottom = -7;
        this.directionalLight.position.set(5, 5, 5);
        this.scene.add(this.directionalLight);
    }

    /**
     * The approach to give physics to a Three.js scene is to create a "physics world" where the physics will be
     * calculated and update the scene in consequence. In other words, that physics world should contain the objects we
     * want to calculate the physics on and we will update the position of the objects in the scene with the results of
     * the physics world.
     *
     * The physics world is created outside of Three.js with another JS library. The most used JS 3D physics libraries
     * are:
     * - Ammo.js: the most famous but heavy.
     * - Cannon.js: lighter than Ammo.js, easier to use but maintained by only 1 guy (used in this lesson)
     * - Oimo.js: lighter than Ammo.js, easier to use but maintained by only 1 guy.
     *
     * Additionally, there are JS 2D physics libraries that we can use when our world works in only 2 dimensions (like
     * a pin-ball game). The mose famous ones are: Matter.js, P2.js, Planck.js and Box2d.js.
     */
    addPhysicsObjects() {
        // Create the physics world and add gravity (same value as on Earth)
        this.physicsWorld = new World();
        this.physicsWorld.gravity.set(0, -9.82, 0);

        /**
         * In cannon.js, every Object of the scene is represented by a Body in the physics world.
         * The Bodies of the physics world must have the same size as in the scene so that we can calculate the
         * physics accurately.
         */
        // const sphereShape = new CANNON.Sphere(0.5);
        // const spherePosition = new CANNON.Vec3(0, 3, 0);
        // this.physicsSphere = new CANNON.Body({
        //     // The mass allows us to give the "weight" to the Bodies. For example, if two Bodies collide the one with
        //     // the highest mass will push the other one harder.
        //     mass: 1,
        //     position: spherePosition,
        //     shape: sphereShape,
        // });

        /**
         * We have to add all the Bodies to the physics world (the same way as for the objects in the Three.js scene).
         */
        // this.physicsWorld.addBody(this.physicsSphere);

        // Floor
        const floorShape = new CANNON.Plane();
        this.physicsFloor = new CANNON.Body({
            // A mass value of 0 will make the Body static (it won't be affected by gravity)
            mass: 0,
        });

        /**
         * By default, the plane is facing the camera. So we have to rotate it to make it match the plane in Three.js.
         * In Cannon.js, rotations work with Quaternions. To work with quaternions easily, Cannon.js provides the method
         * "setFromAxisAngle" (which is also available in Three.js, but working with "rotation" is so much easier).
         */
        this.physicsFloor.quaternion.setFromAxisAngle(
            // Unitary vector describing the axis to rotate
            new CANNON.Vec3(-1, 0, 0),
            // The value of the rotation
            Math.PI * 0.5
        );

        // We can add as many shapes as we want to a Body. This allows us to have Bodies with complex shapes.
        this.physicsFloor.addShape(floorShape);
        this.physicsWorld.addBody(this.physicsFloor);
    }

    /**
     * We can change the frictions and bouncing of the objects in the physics world by changing the material.
     * In Cannon.js, a Material object is just a reference. We have to set up the behaviour of each material on our own
     * in a ContactMaterial object.
     */
    setPhysicsMaterials() {
        const plasticMaterial = new CANNON.Material("plastic");
        const concreteMaterial = new CANNON.Material("concrete");

        /**
         * A ContactMaterial is the definition of behaviour of the collision of 2 Materials.
         * Given 2 Materials, we define how much friction and restitution do they have against each other
         * (0.3 by default).
         */
        const concretePlasticContactMaterial = new CANNON.ContactMaterial(
            plasticMaterial,
            concreteMaterial,
            { friction: 0.1, restitution: 0.7 }
        );

        // Add the ContactMaterial to the world
        this.physicsWorld.addContactMaterial(concretePlasticContactMaterial);

        // Set the Material of the objects
        this.physicsSphere.material = plasticMaterial;
        this.physicsFloor.material = concreteMaterial;
    }

    /**
     * When the world is simple enough, we can define a default Material and ContactMaterial instead of creating them
     * for each one of the type of objects in the physics world.
     */
    setPhysicsDefaultMaterial() {
        const defaultMaterial = new CANNON.Material("default");
        this.physicsWorld.defaultContactMaterial = new CANNON.ContactMaterial(
            defaultMaterial,
            defaultMaterial,
            { friction: 0.1, restitution: 0.7 }
        );
    }

    /**
     * The "broadphase" is the way the physics engine handles the collisions of each object with all the other objects on
     * every frame.
     * By default, Cannon.js comes with 3 different broadphases:
     * - NaiveBroadphase (default): Tests every Body against every other Bodies
     * - GridBroadphase: Divides the world in a grid and only tests Bodies against other Bodies in the same grid box or
     *      the neighbors' grid boxes.
     * - SAPBroadphase (Sweep and prune broadphase): Tests Bodies on arbitrary axes during multiples steps.
     */
    setPhysicsWorldBroadPhase() {
        // The SAPBroadphase is the best in terms of performance
        this.physicsWorld.broadphase = new CANNON.SAPBroadphase(
            this.physicsWorld
        );
    }

    /**
     * Allowing the physics world to "sleep" the objects will greatly increase the performance by stopping to check the
     * collisions of those objects that go below a certain speed.
     *
     * Once an object is affected by a new force, it will "wake up" again.
     *
     * It's possible to tweak the options of the sleep:
     * - sleepSpeedLimit: at which speed we consider that an object can be set to sleep
     * - sleepTimeLimit: how much time does an object have to be below the speed limit to put it to sleep
     */
    setPhysicsWorldSleep() {
        this.physicsWorld.allowSleep = true;
    }

    /**
     * Applying forces to the objects.
     *
     * In Cannon.js, there are 4 main methods to apply a force into an object:
     * - applyForce: apply a force from a specific point in space (not necessarily from the Body's surface). Used mainly
     *      to apply a force onto a domino's piece or to recreate the wind.
     * - applyImpulse: like "applyForce" but instead of adding to the force, it adds directly to the velocity.
     * - applyLocalForce / applyLocalImpulse: like the base methods but the coordinates are local to the Body, being
     *      (0,0,0) the center of the Body.
     */
    applyInitialForceToSingleSphere() {
        // This will push the sphere at the start of the animation
        this.physicsSphere.applyLocalForce(
            // Strength of the force
            new CANNON.Vec3(150, 0, 0),
            // Origin of the force (center of the sphere)
            new CANNON.Vec3(0, 0, 0)
        );
    }

    /**
     * Add a sphere both to the 3D world and the physics world with the given parameters.
     */
    createSphere(radius: number, position: Vector3) {
        // Three.js mesh
        const sphereMesh = new Mesh(this.sphereGeometry, this.sphereMaterial);

        /**
         * Instead of updating the radius of the sphere Geometry, we can just update the scale of the sphere Mesh
         */
        sphereMesh.scale.set(radius, radius, radius);
        sphereMesh.castShadow = true;
        sphereMesh.position.copy(position);
        this.scene.add(sphereMesh);

        // Cannon.js body
        const sphereShape = new CANNON.Sphere(radius);
        const sphereBody = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3().copy(vector3ToVec3(position)),
            shape: sphereShape,
        });
        this.physicsWorld.addBody(sphereBody);

        this.spheres.push({ mesh: sphereMesh, body: sphereBody });
    }

    createBox(width: number, height: number, depth: number, position: Vector3) {
        // Three.js mesh
        const boxMesh = new Mesh(this.boxGeometry, this.boxMaterial);
        boxMesh.scale.set(width, height, depth);
        boxMesh.castShadow = true;
        boxMesh.position.copy(position);
        this.scene.add(boxMesh);

        // Cannon.js body
        const boxShape = new CANNON.Box(
            // In Cannon.js, we have set the Cube size with the half-extent (distance between the center and a corner of
            // the cube)
            new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5)
        );
        const boxBody = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3().copy(vector3ToVec3(position)),
            shape: boxShape,
        });
        boxBody.position.copy(vector3ToVec3(position));
        this.physicsWorld.addBody(boxBody);

        this.boxes.push({ mesh: boxMesh, body: boxBody });
    }

    setUpGui() {
        this.guiActions = {
            addSphere: () => {
                this.createSphere(
                    Math.random(),
                    new Vector3(Math.random() * 0.5, 3, Math.random() * 0.5)
                );
            },
            addBox: () => {
                this.createBox(
                    Math.random(),
                    Math.random(),
                    Math.random(),
                    new Vector3(Math.random() * 0.5, 3, Math.random() * 0.5)
                );
            },
        };

        this.gui.add(this.guiActions, "addSphere");
        this.gui.add(this.guiActions, "addBox");
    }

    setUpAnimation() {
        const clock = new Clock();
        let previousTime = 0;
        // let ballsCounter = 1;

        this.animation = (_: number) => {
            const elapsedTime = clock.getElapsedTime();
            const deltaTime = elapsedTime - previousTime;
            previousTime = elapsedTime;

            // Create a ball every 2 seconds (max 10)
            // if (elapsedTime / 2 > ballsCounter && ballsCounter <= 10) {
            //     this.createSphere(0.5, new Vector3(0, 3, 0));
            //     ballsCounter += 1;
            // }

            /**
             * We have to update the physics world on each frame so it's synchronized with the scene.
             * The step function takes 3 parameters:
             * - A fixed time step. In this case we will set it to "1/60" (60fps). If this runs in a screen with a frame
             *      rate higher than 60fps, it will behave the same way because the physics world will always run at
             *      60fps.
             * - How much time passed since the last step.
             * - How many iterations should the world apply to catch up with a potential delay. This delay can happen
             *      because of screens with low or high frame rates or/and when the physics world needs to calculate
             *      too much stuff between steps.
             */
            this.physicsWorld.step(1 / 60, deltaTime, 3);

            /**
             * The "copy" method is available in many Three.js classes and will literally copy the values of the
             * variables x, y & z of the object given by parameters.
             */
            // this.sphere.position.copy(
            //     // This cast is safe because of the implementation of "copy()"
            //     this.physicsSphere.position as unknown as Vector3
            // );

            for (const sphere of this.spheres) {
                sphere.mesh.position.copy(vec3ToVector3(sphere.body.position));
            }

            for (const box of this.boxes) {
                box.mesh.position.copy(vec3ToVector3(box.body.position));
                box.mesh.quaternion.copy(
                    cannonQuaternionToThreeQuaternion(box.body.quaternion)
                );
            }

            /**
             * Simulate the effect of the wind on the Sphere.
             * This will accumulate a force onto the Sphere on each frame.
             */
            // this.physicsSphere.applyForce(
            //     new CANNON.Vec3(-0.5, 0, 0),
            //     this.physicsSphere.position
            // );
        };
    }
}
</script>
