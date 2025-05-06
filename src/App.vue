<script setup>
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { onMounted, onBeforeUnmount } from 'vue'
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"


let animationFrameId

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 3);

const renderer = new THREE.WebGLRenderer({
    antialias: true
})

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.querySelector("#app").appendChild(renderer.domElement);

// 图片纹理
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('/shuye.jpg');

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 0, 5);
scene.add(directionalLight);

// 几何体
const geometry = new THREE.BoxGeometry()

// 材质
const material = new THREE.MeshStandardMaterial({
    map: texture
});

// 立方体
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 坐标辅助器
const axesHelper = new THREE.AxesHelper(2);
scene.add(axesHelper);

// 新建控制器
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true //旋转阻尼

function animate() {
    animationFrameId = requestAnimationFrame(animate);
    cube.rotation.x += 0.01
    cube.rotation.y += 0.01
    renderer.render(scene, camera)
}

animate()


// 保存代码时,刷新three
onBeforeUnmount(() => {
    // 停止动画循环
    cancelAnimationFrame(animationFrameId)

    // 清除几何体和材质
    geometry.dispose()
    material.dispose()
    texture.dispose()

    // 清除渲染器
    renderer.dispose()

    // 移除渲染器的 DOM 元素
    renderer.domElement.remove()
})

// GUI调试器
let screenHandler ={
    FullScreen: function (){
        document.body.requestFullscreen()
    },
    ExitFullScreen: function(){
        document.exitFullscreen()
    }
}

const gui = new GUI()
gui.add(screenHandler, "FullScreen").name("全屏")
gui.add(screenHandler, "ExitFullScreen").name("退出全屏")

// 控制立方体位置
let folder = gui.addFolder("位置")
folder.add(cube.position, "x").min(-5).max(10).name("x坐标")
folder.add(cube.position, "y").min(-5).max(10).name("y坐标")
folder.add(cube.position, "z").min(-5).max(10).name("z坐标")

</script>

<template>
    <div></div>
</template>

<style scoped></style>
