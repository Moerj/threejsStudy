<!-- 加载模型 -->
<script setup>
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { onMounted, onBeforeUnmount, ref } from 'vue'

const container = ref(null)
onMounted(() => {
    // 使用 ref 引用获取当前组件的 div 元素
    container.value.appendChild(renderer.domElement);
})
onBeforeUnmount(() => {
    location.reload()
}) 


const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 3);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 0, -5);
scene.add(directionalLight);

const renderer = new THREE.WebGLRenderer({
    antialias: true
})
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// 创建几何球
const textureLoader = new THREE.TextureLoader();
const atmos = textureLoader.load('/img/public_images_earth_atmos_2048.jpg');
const outline = textureLoader.load('/img/public_images_earth_outline.jpg'); //边缘辉光
const points = textureLoader.load('/img/public_images_earth_points.jpg'); //地球上的点位光斑
const specular = textureLoader.load('/img/public_images_earth_specular_2048.jpg');

// 主地球
const geometry = new THREE.SphereGeometry(1, 32, 32)
const material = new THREE.MeshStandardMaterial({
    map: atmos,            // 基础颜色贴图
    emissiveMap: points,   // 点位光斑效果
    emissive: 0xffffff,    // 自发光颜色
    emissiveIntensity: 0.4,// 自发光强度
    roughness: 1,          // 粗糙度
    metalness: 0           // 金属度
});
const sphere = new THREE.Mesh(geometry, material);

// 发光边缘层
const glowGeometry = new THREE.SphereGeometry(1.001, 32, 32);
const glowMaterial = new THREE.MeshStandardMaterial({
    map: outline,          // 使用outline作为基础贴图
    emissiveMap: outline,  // 使用outline作为发光贴图
    emissive: 0x6699ff,   // 发光颜色（淡蓝色）
    emissiveIntensity: 0.5,  // 发光强度
    transparent: true,     // 启用透明
    opacity: 0.8,         // 设置透明度
    blending: THREE.AdditiveBlending  // 使用添加混合模式
});
const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);

scene.add(sphere);
scene.add(glowSphere);

const axesHelper = new THREE.AxesHelper(2);
scene.add(axesHelper);
// 新建控制器
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true //旋转阻尼

// renderer.render(scene, camera);

let animationFrameId
function animate() {
    animationFrameId = requestAnimationFrame(animate);
    // sphere.rotation.x += 0.005
    // sphere.rotation.y += 0.005
    renderer.render(scene, camera)
}
animate()
</script>

<template>
    <div ref="container">
    </div>
</template>