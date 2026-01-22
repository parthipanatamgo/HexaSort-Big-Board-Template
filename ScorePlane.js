import * as THREE from "three";

export class CountPlane {
  constructor(options = {}) {
    this.number = options.number || 0;
    this.width = options.width || 1;
    this.height = options.height || 1;
    this.canvasSize = options.canvasSize || 128;
    this.fontSize = options.fontSize || 120;
    this.fontFamily = options.fontFamily || "Arial";
    this.textColor = options.textColor || "#ffffff";
    this.backgroundColor = options.backgroundColor || "#00000000";
    this.borderColor = options.borderColor || "#00000000";
    this.outlineColor = options.outlineColor || "#000000ff";

    this.createCanvas();
    this.createMesh();
    this.updateTexture();
  }

  createCanvas() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.canvasSize;
    this.canvas.height = this.canvasSize;
    this.ctx = this.canvas.getContext("2d");
    this.texture = new THREE.CanvasTexture(this.canvas);
  }

  createMesh() {
    const geometry = new THREE.PlaneGeometry(this.width, this.height);
    const material = new THREE.MeshBasicMaterial({
      map: this.texture,
      side: THREE.FrontSide,
      transparent: true,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotateX(-Math.PI / 2);
  }

  updateTexture() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear and fill background
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, w, h);

    // Draw border
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // Set font (before drawing)
    ctx.font = `bold ${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw text outline
    ctx.strokeStyle = "#000000"; // Outline color (black)
    ctx.lineWidth = 8; // Outline thickness
    ctx.lineJoin = "round"; // Smooth corners
    ctx.strokeText(this.number.toString(), w / 2, h / 2);

    // Draw filled text on top
    ctx.fillStyle = this.textColor;
    ctx.fillText(this.number.toString(), w / 2, h / 2);

    // Mark texture for update
    this.texture.needsUpdate = true;
  }

  setNumber(num) {
    this.number = num;
    this.updateTexture();
  }

  increment(amount = 1) {
    this.number += amount;
    this.updateTexture();
  }

  decrement(amount = 1) {
    this.number -= amount;
    this.updateTexture();
  }

  setPosition(x, y, z) {
    this.mesh.position.set(x, y, z);
  }

  setRotation(x, y, z) {
    this.mesh.rotation.set(x, y, z);
  }

  setScale(scale) {
    this.mesh.scale.set(scale, scale, 1);
  }

  addToScene(scene) {
    scene.add(this.mesh);
  }

  removeFromScene(scene) {
    scene.remove(this.mesh);
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.texture.dispose();
  }

  delete() {
    this.removeFromScene();
    this.dispose();
  }
}
