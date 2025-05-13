<!-- 加载模型 -->
<script setup>
import * as THREE from "three";
// import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const gui = new GUI();


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

// 创建贴合球面的标记点
const markerGeometry = new THREE.CircleGeometry(0.005, 32);
const markerMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide
});
const marker = new THREE.Mesh(markerGeometry, markerMaterial);

// 创建贴合球面的外圈
const ringGeometry = new THREE.RingGeometry(0.008, 0.01, 32);
const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6
});
const ring = new THREE.Mesh(ringGeometry, ringMaterial);

// 创建一个空组来包含标记点和外圈
const markerGroup = new THREE.Group();
markerGroup.add(marker);
markerGroup.add(ring);

// 将组放置在球面上
markerGroup.position.set(0, 0, 0);
markerGroup.lookAt(0, 0, 0);
// 稍微往外偏移以防止z-fighting
markerGroup.position.normalize().multiplyScalar(1.005);

//使用GUI控制markerGroup的位置
function setMarkerGroupPostion(latitude, longitude) {
    markerGroup.position.setFromSphericalCoords(
        1.005,
        THREE.MathUtils.degToRad(90 - latitude),
        THREE.MathUtils.degToRad(longitude)
    );
    markerGroup.lookAt(0, 0, 0);
}

// 设置初始位置
const markerPosition = {
    latitude: 52.2,   // 纬度 (-90 到 90)
    longitude: -1.8,  // 经度 (-180 到 180)
};
setMarkerGroupPostion(markerPosition.latitude, markerPosition.longitude)

gui.add(markerPosition, 'latitude', -90, 90).onChange(() => {
    setMarkerGroupPostion(markerPosition.latitude, markerPosition.longitude)
});
gui.add(markerPosition, 'longitude', -180, 180).onChange(() => {
    setMarkerGroupPostion(markerPosition.latitude, markerPosition.longitude)
});


earth.add(markerGroup);

scene.add(earth);

const axesHelper = new THREE.AxesHelper(2);
scene.add(axesHelper);
// 新建控制器
const controls = new OrbitControls(camera, renderer.domElement)
// controls.enableDamping = true //旋转阻尼


// 设置整体倾斜角度（30度）
earth.rotation.x = THREE.MathUtils.degToRad(30);

let animationFrameId
let scale = 1;
let scaleDirection = 1;

let isMouseDown = false

window.addEventListener('mousedown', (event) => {
    isMouseDown = true
})
window.addEventListener('mouseup', (event) => {
    isMouseDown = false
})

// 创建多条抛物线
function createParabolicCurve(startPoint, endPoint, height) {
    const points = [];
    const segments = 50;
    
    // 计算起点和终点之间的球面距离
    const startDir = startPoint.clone().normalize();
    const endDir = endPoint.clone().normalize();
    const angle = startDir.angleTo(endDir);
    
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        
        // 在球面上进行球面插值
        const sphericalPoint = new THREE.Vector3().lerpVectors(startDir, endDir, t).normalize();
        
        // 添加高度偏移
        const heightOffset = Math.sin(Math.PI * t) * height; // 使用正弦函数创建平滑的弧度
        const finalPoint = sphericalPoint.multiplyScalar(1 + heightOffset);
        
        points.push(finalPoint);
    }
    
    return new THREE.CatmullRomCurve3(points);
}

// 创建目标点数组
const targetPoints = [];
const radius = 1.0; // 目标点在球面上
for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const point = new THREE.Vector3(x, 0, z).normalize(); // 确保点在球面上
    targetPoints.push(point);
}

// 创建抛物线组
const curves = [];
const curveObjects = new THREE.Group();
earth.add(curveObjects);

targetPoints.forEach((target) => {
    const startPoint = markerGroup.position.clone().normalize(); // 确保起点在球面上
    const curve = createParabolicCurve(
        startPoint,
        target,
        0.15 // 统一的高度系数
    );
    
    // 创建渐变材质
    const gradientTexture = new THREE.CanvasTexture((() => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 256, 0);
        gradient.addColorStop(0, '#00ffff');
        gradient.addColorStop(1, '#ffffff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 1);
        return canvas;
    })());

    const geometry = new THREE.TubeGeometry(curve, 50, 0.001, 8, false);
    const material = new THREE.MeshBasicMaterial({
        map: gradientTexture,
        transparent: true,
        opacity: 0.5
    });
    
    const tube = new THREE.Mesh(geometry, material);
    curveObjects.add(tube);
    curves.push({
        curve: curve,
        mesh: tube
    });
});

// 添加光点动画
const lightPoint = new THREE.Mesh(
    new THREE.SphereGeometry(0.004, 16, 16),
    new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
    })
);
earth.add(lightPoint);

// 动画相关变量
let currentCurveIndex = 0;
let curveProgress = 0;

function animate() {
    animationFrameId = requestAnimationFrame(animate);
    
    // 地球自转动画
    if (isMouseDown == false) {
        earth.rotation.y += 0.005;
    }
    
    // 外圈缩放动画
    scale += 0.01 * scaleDirection;
    if (scale >= 1.3) scaleDirection = -1;
    if (scale <= 0.8) scaleDirection = 1;
    ring.scale.set(scale, scale, 1);
    
    // 光点沿曲线运动
    curveProgress += 0.01;
    if (curveProgress >= 1) {
        curveProgress = 0;
        currentCurveIndex = (currentCurveIndex + 1) % curves.length;
    }
    
    const currentCurve = curves[currentCurveIndex].curve;
    const point = currentCurve.getPoint(curveProgress);
    lightPoint.position.copy(point);
    
    renderer.render(scene, camera);
}
animate()
</script>

<template>
    <div ref="container">
    </div>
</template>