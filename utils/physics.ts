import { Quaternion as TQuaternion, Vector3 } from "three";
import { Quaternion as CQuaternion, Vec3 } from "cannon";

export function vector3ToVec3(v: Vector3): Vec3 {
    return new Vec3(v.x, v.y, v.z);
}

export function vec3ToVector3(v: Vec3): Vector3 {
    return new Vector3(v.x, v.y, v.z);
}

export function threeQuaternionToCannonQuaternion(q: TQuaternion): CQuaternion {
    return new CQuaternion(q.x, q.y, q.z, q.w);
}

export function cannonQuaternionToThreeQuaternion(q: CQuaternion): TQuaternion {
    return new TQuaternion(q.x, q.y, q.z, q.w);
}
