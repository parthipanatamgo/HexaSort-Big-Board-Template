import { GLTFLoader } from "three/examples/jsm/Addons.js";
export function loadGLB(modelPath) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      function (gltf) {
        let foundGeometry;
        let foundMaterial;
        let _mesh;
        gltf.scene.traverse(function (child) {
          if (child.isMesh) {
            _mesh = child;
            foundGeometry = child.geometry;
            foundMaterial = child.material;
          }
        });

        if (foundGeometry && foundMaterial) {
          resolve({
            geometry: foundGeometry,
            material: foundMaterial,
            scene: gltf.scene, // Also returning the scene as it's often useful
            mesh: _mesh,
          });
        } else {
          reject(new Error("No suitable mesh found in the GLB model."));
        }
      },
      function (xhr) {
        //console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      function (error) {
        reject(error);
      },
    );
  });
}
