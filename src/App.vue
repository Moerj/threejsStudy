<script setup>
import * as THREE from "three";
import img_ayaka from './assets/ayaka.jpg'
import img_shuye from './assets/shuye.jpg'
import { onMounted, onBeforeUnmount } from 'vue'

let animationFrameId

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    antialias: true
})

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.querySelector("#app").appendChild(renderer.domElement);

const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load(img_shuye);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 0, 5);
scene.add(directionalLight);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
    map: texture
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const axesHelper = new THREE.AxesHelper(2);
scene.add(axesHelper);

camera.position.set(0, 0, 3);

function animate() {
    animationFrameId = requestAnimationFrame(animate);
    if (cube) {
        cube.rotation.x += 0.01
        cube.rotation.y += 0.01
    }
    renderer.render(scene, camera)
}

animate()
</script>

<template>
    <div></div>
</template>

<style scoped></style>
