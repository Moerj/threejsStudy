<script setup>
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { onMounted, onBeforeUnmount } from 'vue'
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 6);

const renderer = new THREE.WebGLRenderer({
    antialias: true
})

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.querySelector("#app").appendChild(renderer.domElement);

// 图片纹理
const textureLoader = new THREE.TextureLoader();
const texture1 = textureLoader.load('/shuye.jpg');
const texture2 = textureLoader.load('/ayaka.jpg');

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 0, 5);
scene.add(directionalLight);

// 几何体
const geometry = new THREE.SphereGeometry(1, 32, 32)

// 材质
const material1 = new THREE.MeshStandardMaterial({
    map: texture1
});
const material2 = new THREE.MeshStandardMaterial({
    map: texture2
});

// 3个球
const spheres = [];
const positions = [-3, 0, 3];  // x轴位置

positions.forEach((x) => {
    const sphere = new THREE.Mesh(geometry, material1.clone());
    sphere.position.x = x;
    spheres.push(sphere);
    scene.add(sphere);
});

// 坐标辅助器
const axesHelper = new THREE.AxesHelper(2);
scene.add(axesHelper);

// 新建控制器
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true //旋转阻尼

let animationFrameId
function animate() {
    animationFrameId = requestAnimationFrame(animate);
    spheres.forEach(sphere => {
        sphere.rotation.x += 0.01;
        sphere.rotation.y += 0.01;
    });
    renderer.render(scene, camera);
}
animate()


// 射线
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

const cliclHandler = (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(spheres)

    if (intersects.length > 0) {
        // 先还原所有材质
        spheres.forEach(sphere => {
            sphere.material.dispose();
            sphere.material = material1.clone();
        });

        let obj = intersects[0].object;
        if (obj.isMesh) {
            obj.material.dispose();
            obj.material = material2.clone();
        }

        // 刷新所有球体
        spheres.forEach(sphere => {
            sphere.needsUpdate = true;
        });
    }

}
window.addEventListener("click", cliclHandler)

// 保存代码时,刷新three
onBeforeUnmount(() => {
    // 停止动画循环
    cancelAnimationFrame(animationFrameId)

    // 清除几何体和材质
    geometry.dispose()
    material1.dispose()
    material2.dispose()
    texture1.dispose()

    // 清除渲染器
    renderer.dispose()
    // 移除渲染器的 DOM 元素
    renderer.domElement.remove()

    controls.dispose()

    window.removeEventListener("click", cliclHandler)
})


</script>

<template>
    <div></div>
</template>

<style scoped></style>
