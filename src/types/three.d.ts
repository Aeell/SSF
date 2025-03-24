import { Object3D, Vector3 } from 'three';

declare module 'three' {
  interface Object3D {
    position: Vector3;
  }

  interface WebGLRenderer {
    shadowMap: {
      enabled: boolean;
    };
  }
} 