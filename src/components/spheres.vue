<script setup>
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
import { disposeAll } from "@/assets/disposeAll.js";

const container = ref(null)
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 6);

const renderer = new THREE.WebGLRenderer({
    antialias: true
})

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// 图片纹理
const textureLoader = new THREE.TextureLoader();
const texture1 = textureLoader.load('/img/shuye.jpg');
const texture2 = textureLoader.load('/img/ayaka.jpg');

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

// 1.直接改变大小
// 修改第二个球大小
spheres[1].scale.set(1.5, 1.5, 1.5); // 将第二个球缩放为1.5倍

// 2.修改顶点来改变大小
// 克隆第二个球的几何体并修改顶点
// const secondSphereGeometry = geometry.clone();
// const vertices = secondSphereGeometry.attributes.position;
// for (let i = 0; i < vertices.count; i++) {
//     vertices.setXYZ(
//         i,
//         vertices.getX(i) * 1.5,
//         vertices.getY(i) * 1.5,
//         vertices.getZ(i) * 1.5
//     );
// }
// spheres[1].geometry = secondSphereGeometry;


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
    // 使用一个新的原点和方向来更新射线。
    raycaster.setFromCamera(mouse, camera)

    // 射线监听哪些物体
    const intersects = raycaster.intersectObjects(spheres)

    if (intersects.length > 0) {
        // 先还原所有材质
        spheres.forEach(sphere => {
            sphere.material.dispose();
            sphere.material = material1.clone();
        });

        // 点击到的物体
        let obj = intersects[0].object;
        if (obj.isMesh) {
            obj.material.dispose();
            obj.material = material2.clone();
            console.log(obj);
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

    disposeAll(scene)

    renderer.dispose()
    renderer.domElement.remove()

    controls.dispose()

    window.removeEventListener("click", cliclHandler)
})

onMounted(() => {
    // 使用 ref 引用获取当前组件的 div 元素
    container.value.appendChild(renderer.domElement);
})

</script>

<template> 
    <div ref="container">
    </div> 
</template>