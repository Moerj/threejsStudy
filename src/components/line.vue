<!-- 飞线学习 -->
 <script setup>
import * as THREE from "three";
// import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { disposeAll } from "@/assets/disposeAll.js";
const gui = new GUI();
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({
    antialias: true
})
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2, 2, 5);

const controls = new OrbitControls(camera, renderer.domElement)

const axesHelper = new THREE.AxesHelper(2);
scene.add(axesHelper);


// 画点
const startPoint = new THREE.Vector3(1,0,1);
const endPoint = new THREE.Vector3(3,0,1);
// 画2个线的中心点
const midPoint = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);

// 向y轴移动
midPoint.add(new THREE.Vector3(0, 1, 0).multiplyScalar(1));

// 创建单一的曲线实例
const curve = new THREE.QuadraticBezierCurve3(startPoint, midPoint, endPoint);
const points = curve.getPoints(50);
// 创建基础曲线
const baseGeometry = new THREE.BufferGeometry().setFromPoints(points);
const baseMaterial = new THREE.LineBasicMaterial({
    color: 'rgb(179, 207, 255)',
    transparent: true,
    opacity: 0.2
});
const baseLine = new THREE.Line(baseGeometry, baseMaterial);
scene.add(baseLine)

// 创建发光线段（使用同一条曲线的点）
const glowGeometry = new THREE.BufferGeometry();
const glowMaterial = new THREE.LineBasicMaterial({
    color: 'rgb(20, 251, 47)',
    transparent: true,
    opacity: 0.8
});
const glowLine = new THREE.Line(glowGeometry, glowMaterial);
// 初始化发光线段长度（设置为总点数的1/3）
const glowLineLength = Math.floor(points.length / 3);
glowLine.geometry.setFromPoints(points.slice(0, glowLineLength));
scene.add(glowLine);

// 存储动画所需的参数
glowLine.animate = {
    curve,                  // 存储曲线实例
    progress: 0,           // 动画进度（0-1之间）
    speed: 0.01,          // 动画速度
    glowLineLength,       // 发光部分要显示的点数
    direction: 1          // 添加方向控制: 1 表示正向, -1 表示反向
};

// 让点能够看见方便调试
function testPoint() {
    // 创建发光材质
    const pointMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
    });
    
    // 创建小球体几何体
    const pointGeometry = new THREE.SphereGeometry(0.05);
    
    // 给点创建三个点的网格
    const startPointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
    const endPointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
    const midPointMesh = new THREE.Mesh(pointGeometry, pointMaterial.clone());
    midPointMesh.material.color.setHex(0xf25454);
    
    // 设置位置
    startPointMesh.position.copy(startPoint);
    endPointMesh.position.copy(endPoint);
    midPointMesh.position.copy(midPoint);
    
    // 添加到场景
    scene.add(startPointMesh);
    scene.add(endPointMesh);
    scene.add(midPointMesh);
}
testPoint()

let animationFrameId
function animate() {
    animationFrameId = requestAnimationFrame(animate);

    // 更新动画进度，根据方向更新progress
    glowLine.animate.progress += glowLine.animate.speed * glowLine.animate.direction;

    // 在边界处改变方向
    if (glowLine.animate.progress >= 1) {
        glowLine.animate.direction = -1; // 达到终点，改为反向
    } else if (glowLine.animate.progress <= 0) {
        glowLine.animate.direction = 1;  // 达到起点，改为正向
    }

    // 计算当前需要显示的点
    const currentPoints = [];
    const segmentLength = glowLine.animate.glowLineLength;
    
    // 计算每一个点的位置
    for (let i = 0; i < segmentLength; i++) {
        const t = (glowLine.animate.progress + (i / 50));
        // 确保t值在0到1之间
        if (t >= 0 && t <= 1) {
            currentPoints.push(glowLine.animate.curve.getPoint(t));
        }
    }
    
    // 更新发光线段的几何体
    glowLine.geometry.setFromPoints(currentPoints);

    // 渲染场景
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
})
</script>

<template>
    <div ref="container">
    </div>
</template>