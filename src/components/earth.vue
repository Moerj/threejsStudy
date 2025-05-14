<!-- 加载模型 -->
<script setup>
import * as THREE from "three";
// import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { disposeAll } from "@/assets/disposeAll.js";
// import  * as TWEEN  from "three/examples/jsm/libs/tween.module.js";

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
    normalMap: outline,    // 使用轮廓图作为法线贴图
    roughnessMap: specular,// 使用高光贴图作为粗糙度贴图
    roughness: 0.8,       // 基础粗糙度
    metalness: 0.1,       // 金属度
    emissiveMap: outline, // 使用轮廓图作为发光贴图
    emissive: 0x3366ff,  // 发光颜色（蓝色）
    emissiveIntensity: 0.3, // 发光强度
});
const sphere = new THREE.Mesh(geometry, material);

// 发光边缘层
const glowGeometry = new THREE.SphereGeometry(1.001, geometrySize, geometrySize);
const glowMaterial = new THREE.MeshStandardMaterial({
    map: points,
    emissiveMap: points,  // 使用outline作为发光贴图
    emissive: 0xffffff,   // 发光颜色（淡蓝色）
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

const markers = []

// 创建一个点位
class CreateMarker {
    index 
    latitude
    longitude
    constructor(latitude, longitude) {
        this.latitude = latitude
        this.longitude = longitude
        this.index = markers.length; // 保存当前marker的索引
        const marker = new THREE.Mesh(markerGeometry, markerMaterial.clone());
        const ring = new THREE.Mesh(ringGeometry, ringMaterial.clone());

        marker.name = "marker";
        marker._index = this.index

        ring.name = "ring";
        ring._index = this.index

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

//飞线发射点
markers[0] = new CreateMarker(52.2, -1.8)
markers[0].get().getObjectByName('ring').material.color.setHex(0xfb5108)

// 飞线终点
markers[1] = new CreateMarker(61, -32)
markers[2] = new CreateMarker(32.24, 0)
markers[3] = new CreateMarker(50, 25)

markers.forEach(marker => {
    earth.add(marker.get())
});

// 创建抛物线
class CreateParabola {
    constructor(startPosition, endPosition) {
        // 将经纬度转换为三维坐标
        const startPoint = new THREE.Vector3();
        startPoint.setFromSphericalCoords(
            1.005,
            THREE.MathUtils.degToRad(90 - startPosition.latitude),
            THREE.MathUtils.degToRad(startPosition.longitude)
        );

        const endPoint = new THREE.Vector3();
        endPoint.setFromSphericalCoords(
            1.005,
            THREE.MathUtils.degToRad(90 - endPosition.latitude),
            THREE.MathUtils.degToRad(endPosition.longitude)
        );

        // 计算中点并向外偏移作为控制点
        const midPoint = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);
        midPoint.normalize().multiplyScalar(1.2); // 控制抛物线的高度

        // 创建曲线
        const curve = new THREE.QuadraticBezierCurve3(
            startPoint,
            midPoint,
            endPoint
        );

        // 创建曲线的点
        const points = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        // 创建渐变色顶点颜色
        const colors = new Float32Array(points.length * 3);
        for (let i = 0; i < points.length; i++) {
            const alpha = i / points.length;
            // 从橙色渐变到青色
            colors[i * 3] = 1 - alpha; // R
            colors[i * 3 + 1] = 0.3 + alpha * 0.4; // G
            colors[i * 3 + 2] = alpha; // B
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // 创建材质
        const material = new THREE.LineBasicMaterial({
            vertexColors: true, // 启用顶点颜色
            transparent: true,
            opacity: 0.8,
            linewidth: 2,
        });

        // 创建线条
        this.line = new THREE.Line(geometry, material);
        
        return this.line;
    }
}

// 添加创建抛物线的示例代码
const parabolas = [];
for (let i = 1; i < markers.length; i++) {
    const parabola = new CreateParabola(
        { latitude: markers[0].latitude, longitude: markers[0].longitude },//飞线起点
        { latitude: markers[i].latitude, longitude: markers[i].longitude } //飞线终点
    );
    parabolas.push(parabola);
    earth.add(parabola);
}

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

    // TWEEN.update() //刷新补间动画

    // 地球自转动画
    // if (isMouseDown == false) {
    //     earth.rotation.y += 0.005;
    // }

    // 点位圆环动画
    markers.forEach(marker => {
        const ring = marker.get().getObjectByName('ring');
        // 如果没有缩放方向属性，初始化为1（放大）
        if (ring.scaleDirection === undefined) {
            ring.scaleDirection = 1;
        }
        
        // 根据方向进行缩放
        if (ring.scaleDirection === 1) {
            ring.scale.x += 0.01;
            ring.scale.y += 0.01;
            if (ring.scale.x >= 1.5) {
                ring.scaleDirection = -1;
            }
        } else {
            ring.scale.x -= 0.01;
            ring.scale.y -= 0.01;
            if (ring.scale.x <= 0.5) {
                ring.scaleDirection = 1;
            }
        }
    });

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
    
    // 销毁tween补间动画
    TWEEN.removeAll();

    // 清理事件监听
    window.removeEventListener('mousedown', handleMouseDown);
    window.removeEventListener('mouseup', handleMouseUp);
})
</script>

<template>
    <div ref="container">
    </div>
</template>