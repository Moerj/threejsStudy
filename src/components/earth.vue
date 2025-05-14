<!-- 加载模型 -->
<script setup>
import * as THREE from "three";
// import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { disposeAll } from "@/assets/disposeAll.js";

const gui = new GUI();

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 2);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 5, 5);
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

const geometrySize = 32
// 主地球
const geometry = new THREE.SphereGeometry(1, geometrySize, geometrySize)
const material = new THREE.MeshStandardMaterial({
    map: atmos,            // 基础颜色贴图
    emissiveMap: points,   // 点位光斑效果
    emissive: 0xfaffdc,    // 自发光颜色
    emissiveIntensity: 0.5,// 自发光强度
    roughness: 1,          // 粗糙度
    metalness: 0,           // 金属度
});
const sphere = new THREE.Mesh(geometry, material);

// 发光边缘层
const glowGeometry = new THREE.SphereGeometry(1.001, geometrySize, geometrySize);
const glowMaterial = new THREE.MeshStandardMaterial({
    map: outline,          // 使用outline作为基础贴图
    emissiveMap: specular,  // 使用outline作为发光贴图
    emissive: 0x6699ff,   // 发光颜色（淡蓝色）
    emissiveIntensity: 0.8,  // 发光强度
    transparent: true,     // 启用透明
    opacity: 0.3,         // 设置透明度
    blending: THREE.AdditiveBlending,  // 使用添加混合模式
});
const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);

// 将所有球体整合成一个组
const earth = new THREE.Group();
earth.add(sphere);
earth.add(glowSphere);
earth.rotation.x = THREE.MathUtils.degToRad(30) // 设置整体倾斜角度（30度）
scene.add(earth);

// 创建贴合球面的标记点
const markerGeometry = new THREE.CircleGeometry(0.005, 32);
const markerMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide
});
// 点位外圈
const ringGeometry = new THREE.RingGeometry(0.008, 0.01, 32);
const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6
});

// 创建一个点位
class CreateMarker {
    constructor(latitude, longitude) {
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);

        this.markerGroup = new THREE.Group();
        this.markerGroup.add(marker);
        this.markerGroup.add(ring);

        this.markerGroup.lookAt(0, 0, 0);
        this.markerGroup.position.normalize().multiplyScalar(1.005);

        this.setPosition(latitude, longitude);

        return this
    }
    setPosition(latitude, longitude) {
        this.markerGroup.position.setFromSphericalCoords(
            1.005,
            THREE.MathUtils.degToRad(90 - latitude),
            THREE.MathUtils.degToRad(longitude)
        );
        this.markerGroup.lookAt(0, 0, 0);
    }
    get(){
        return this.markerGroup
    }
}

const markers = []
markers[0] = new CreateMarker(52.2, -1.8)

markers.forEach(marker => {
    earth.add(marker.get())
});

// gui调试marker
const markerPosition = {
    latitude: 0,   // 纬度 (-90 到 90)
    longitude: 0,  // 经度 (-180 到 180)
};
gui.add(markerPosition, 'latitude', -90, 90).onChange(() => {
    markers[0].setPosition(markerPosition.latitude, markerPosition.longitude)
});
gui.add(markerPosition, 'longitude', -180, 180).onChange(() => {
    markers[0].setPosition(markerPosition.latitude, markerPosition.longitude)
});

// const axesHelper = new THREE.AxesHelper(2);
// scene.add(axesHelper);
// 新建控制器
const controls = new OrbitControls(camera, renderer.domElement)
// controls.enableDamping = true //旋转阻尼

let isMouseDown = false

const handleMouseDown = () => isMouseDown = true;
const handleMouseUp = () => isMouseDown = false;

window.addEventListener('mousedown', handleMouseDown);
window.addEventListener('mouseup', handleMouseUp);

let animationFrameId
function animate() {
    animationFrameId = requestAnimationFrame(animate);

    // 地球自转动画
    // if (isMouseDown == false) {
    //     earth.rotation.y += 0.005;
    // }

    renderer.render(scene, camera);
}
animate()


const container = ref(null)
onMounted(() => {
    // 使用 ref 引用获取当前组件的 div 元素
    container.value.appendChild(renderer.domElement);
})


// 替换原有的 onBeforeUnmount
onBeforeUnmount(() => {
    cancelAnimationFrame(animationFrameId);// 停止动画循环
    
    // 释放所有资源
    disposeAll(scene);
    renderer.dispose();
    renderer.domElement.remove();
    controls.dispose();
    gui.destroy();

    // 清理事件监听
    window.removeEventListener('mousedown', handleMouseDown);
    window.removeEventListener('mouseup', handleMouseUp);
})
</script>

<template>
    <div ref="container">
    </div>
</template>