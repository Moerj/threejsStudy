<script>
// https://开发者文档three.js.org/en/v120/browsers/quickstart#quickstart
import * as THREE from "three";
import img_ayaka from './assets/ayaka.jpg' // 使用 Vite 的资源导入
import img_shuye from './assets/shuye.jpg' // 使用 Vite 的资源导入

// 初始化场景、相机和 renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    45, //视角大小
    window.innerWidth / window.innerHeight, //宽高比
    0.1, //近平面
    1000 //远平面
);
const renderer = new THREE.WebGLRenderer({
    antialias: true
});

// 设置 renderer 的目标元素
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.querySelector("#app").appendChild(renderer.domElement);

// 创建纹理加载器
const textureLoader = new THREE.TextureLoader();
// 加载纹理
const texture = textureLoader.load(img_shuye);

// 添加环境光
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// 添加平行光
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 0, 5);
scene.add(directionalLight);

// 形状
const geometry = new THREE.BoxGeometry(1, 1, 1);

// 环境贴图
const cubeTextureLoader = new THREE.CubeTextureLoader();
const envMap = cubeTextureLoader.load([
    img_shuye, img_shuye,
    img_shuye, img_shuye,
    img_shuye, img_shuye
]);

// 材质 - 使用 MeshStandardMaterial 替代 MeshBasicMaterial
const material = new THREE.MeshStandardMaterial({
    map: texture,
    // metalness: 0.5, //金属
    // roughness: 0.5, //粗糙
    // envMap: envMap
});

// Mesh（网格）
const cube = new THREE.Mesh(geometry, material);

scene.add(cube);

// 坐标辅助
// const axesHelper = new THREE.AxesHelper(2)
// scene.add(axesHelper)

// 最后设置相机位置
camera.position.set(2, 2, 5);
camera.lookAt(0, 0, 0);

function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}

animate();
</script>

<template>
<div>

</div>
</template>

<style scoped>

</style>
