<script setup>
import * as THREE from "three"
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { disposeAll } from "@/assets/disposeAll.js"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
// 引入高级线段函数
import { Line2 } from "three/examples/jsm/lines/Line2.js"
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js"
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js"

const gui = new GUI()

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 0, 2)

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

const renderer = new THREE.WebGLRenderer({
    antialias: true
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)


// 在 gui 声明后添加全局变量
// const gltfLoader = new GLTFLoader();
// let waterDropModel = null;

// // 加载水滴模型
// gltfLoader.load('/model/waterDrop.glb', (gltf) => {
//     waterDropModel = gltf.scene.children[0];
// });

// 创建几何球
const textureLoader = new THREE.TextureLoader()
const atmos = textureLoader.load('/img/public_images_earth_atmos_2048.jpg')
const outline = textureLoader.load('/img/public_images_earth_outline.jpg') //边缘辉光
const points = textureLoader.load('/img/public_images_earth_points.jpg') //地球上的点位光斑
const specular = textureLoader.load('/img/public_images_earth_specular_2048.jpg')

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
})
const sphere = new THREE.Mesh(geometry, material)

// 发光边缘层
const glowGeometry = new THREE.SphereGeometry(1.001, geometrySize, geometrySize)
const glowMaterial = new THREE.MeshStandardMaterial({
    map: points,
    emissiveMap: points,  // 使用outline作为发光贴图
    emissive: 0xffffff,   // 发光颜色（淡蓝色）
    emissiveIntensity: 0.8,  // 发光强度
    transparent: true,     // 启用透明
    opacity: 0.3,         // 设置透明度
    blending: THREE.AdditiveBlending,  // 使用添加混合模式
})
const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial)

// 将所有球体整合成一个组
const earth = new THREE.Group()
earth.add(sphere)
earth.add(glowSphere)
earth.rotation.x = THREE.MathUtils.degToRad(30) // 设置整体倾斜角度（30度）
scene.add(earth)

const markers = []

// 创建一个点位
class Marker {
    index
    latitude
    longitude
    animation

    // 创建贴合球面的标记点
    markerGeometry = new THREE.CircleGeometry(0.005, 32);
    markerMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
    });
    // 点位外圈
    ringGeometry = new THREE.RingGeometry(0.008, 0.01, 32);
    ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
    });

    marker = new THREE.Mesh(this.markerGeometry, this.markerMaterial);
    ring = new THREE.Mesh(this.ringGeometry, this.ringMaterial);
    group = new THREE.Group().add(this.marker).add(this.ring)

    destroy() {
        // 1. 释放 Three.js 资源
        cancelAnimationFrame(this.animation)
        this.markerGeometry.dispose()
        this.markerMaterial.dispose()
        this.ringGeometry.dispose()
        this.ringMaterial.dispose()

        // 2. 清空引用，帮助垃圾回收
        this.markerGeometry = null
        this.ringGeometry = null
        this.markerMaterial = null
        this.ringMaterial = null
        this.group = null
    }
    constructor(latitude, longitude, ringColor) {
        this.latitude = latitude
        this.longitude = longitude
        this.index = markers.length // 保存当前marker的索引

        // 圆环颜色
        if (ringColor) this.ringMaterial.color.setHex(ringColor)

        // 设置点位坐标
        this.setPosition(latitude, longitude)

        // 圆环动画
        const ringAnimation = () => {
            this.animation = requestAnimationFrame(ringAnimation)

            const ring = this.ring

            // 如果没有缩放方向属性，初始化为1（放大）
            if (ring.scaleDirection === undefined) {
                ring.scaleDirection = 1
            }

            if (ring.scaleDirection === 1) {
                // 圆环扩大
                ring.scale.x += 0.01
                ring.scale.y += 0.01
                if (ring.scale.x >= 1.5) { //扩大到1.5倍后开始缩小
                    ring.scaleDirection = -1
                }
            } else {
                //圆环缩小
                ring.scale.x -= 0.01
                ring.scale.y -= 0.01
                if (ring.scale.x <= 0.5) { //缩小到0.5倍后开始扩大
                    ring.scaleDirection = 1
                }
            }
        }
        ringAnimation()
    }
    setPosition(latitude, longitude) {

        // 设置点位在地球表面上的坐标 (从球坐标中的radius、phi和theta设置该向量。)
        this.group.position.setFromSphericalCoords(
            1.005, //radius弧面高度
            THREE.MathUtils.degToRad(90 - latitude), //phi,与 y (up) 轴的极角 （以弧度为单位）
            THREE.MathUtils.degToRad(longitude) //theta,绕 y (up) 轴的赤道角(方位角)（以弧度为单位）。 
        )
        this.group.lookAt(0, 0, 0) //调整点位的方向
    }
}

//飞线发射点
markers[0] = new Marker(52.2, -1.8, 0xfb5108)

// 飞线终点
markers[1] = new Marker(61, -32)
markers[2] = new Marker(32.24, 0)
markers[3] = new Marker(50, 25)

markers.forEach(marker => {
    earth.add(marker.group)
})

// 创建抛物线
class Parabola {
    animation = null

    // 基础曲线材质
    baseGeometry = new THREE.BufferGeometry()
    baseMaterial = new THREE.LineBasicMaterial({
        color: 'rgb(179, 207, 255)',
        transparent: true,
        opacity: 0.2
    });

    // 发光线段材质
    glowGeometry = new LineGeometry();
    glowMaterial = new LineMaterial({
        color: 0x14fb2f,
        linewidth: 4, // in pixels
        vertexColors: false,
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),// 设置分辨率
        dashed: false,
        opacity: 0.8,
        transparent: true
    })

    //基础曲线(代表整个飞线的运动轨迹)
    baseLine = new THREE.Line(this.baseGeometry, this.baseMaterial) 

    //发光的飞线
    glowLine = new Line2(this.glowGeometry, this.glowMaterial) 

    lineGroup = new THREE.Group().add(this.baseLine).add(this.glowLine)

    destroy() {
        this.animation && cancelAnimationFrame(this.animation)

        this.baseGeometry.dispose()
        this.baseGeometry = null

        this.baseMaterial.dispose()
        this.baseMaterial = null

        this.glowGeometry.dispose()
        this.glowGeometry = null

        this.glowMaterial.dispose()
        this.glowMaterial = null
    }
    constructor(startPosition, endPosition) {
        // 将经纬度转换为三维坐标
        const startPoint = new THREE.Vector3()
        startPoint.setFromSphericalCoords(
            1.005,
            THREE.MathUtils.degToRad(90 - startPosition.latitude),// 纬度角度转弧度
            THREE.MathUtils.degToRad(startPosition.longitude)// 经度角度转弧度
        )

        const endPoint = new THREE.Vector3()
        endPoint.setFromSphericalCoords(
            1.005,
            THREE.MathUtils.degToRad(90 - endPosition.latitude),
            THREE.MathUtils.degToRad(endPosition.longitude)
        )

        // 中间点
        const midPoint = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5)
        /*想象一下：
        如果两点在地球表面
        它们的中点会在地球内部
        normalize() 会把这个中点拉到地球表面
        multiplyScalar(1.2) 会继续往外拉伸20%
        这样就形成了一个向外凸起的控制点，使得飞线呈现弧形
        */
        midPoint.normalize().multiplyScalar(1.2) //将中间点抬高,形成弧线


        // 创建一条平滑的三维 二次贝塞尔曲线， 由起点、终点和一个控制点所定义。
        const curve = new THREE.QuadraticBezierCurve3(startPoint, midPoint, endPoint)

        //采样点,少了会出现虚线
        const points = curve.getPoints(300)
        const totalPoints = points.length

        // 根据采样点绘制基础线
        this.baseGeometry.setFromPoints(points)

        // 定义发光线段的长度
        const lengthPercentage = 0.5 //这里定义为基础线长的一半
        const glowLineTotalPoint = Math.floor(totalPoints * lengthPercentage)

        // 发光飞线动画
        let progress = -lengthPercentage //发光线动画的动画进度, -0.5 ~ 1 ,从startPoint往地球内部延长50%
        const speed = 0.005
        const animate = () => {

            this.animation = requestAnimationFrame(animate)

            progress += speed
            if (progress >= 1) {
                progress = -lengthPercentage
            }

            const currentPoints = []
            // 计算当前应该显示的点的数量
            for (let i = 0; i < glowLineTotalPoint; i++) {
                //当前t在 [-0.5, 1]之间,t=-0.5 曲线起点方向延伸50%,t = 0: 起点 (startPoint),t = 1: 终点 (endPoint)
                const t = (progress + (i / totalPoints))
                if (t <= 1) {
                    currentPoints.push(curve.getPoint(t))
                }
            }

            // 更新发光飞线的动画位置
            if (currentPoints.length > 0) {
                this.glowLine.geometry.setFromPoints(currentPoints)
            }
        }

        animate()
    }
}

// 添加创建抛物线的示例代码
const parabolas = []
for (let i = 1; i < markers.length; i++) {
    const parabola = new Parabola(
        { latitude: markers[0].latitude, longitude: markers[0].longitude },//飞线起点
        { latitude: markers[i].latitude, longitude: markers[i].longitude } //飞线终点
    )
    parabolas.push(parabola)
    earth.add(parabola.lineGroup)
}

// gui调试marker
// const markerPosition = {
//     latitude: 0,   // 纬度 (-90 到 90)
//     longitude: 0,  // 经度 (-180 到 180)
// };
// gui.add(markerPosition, 'latitude', -90, 90).onChange(() => {
//     markers[0].setPosition(markerPosition.latitude, markerPosition.longitude)
// });
// gui.add(markerPosition, 'longitude', -180, 180).onChange(() => {
//     markers[0].setPosition(markerPosition.latitude, markerPosition.longitude)
// })

const axesHelper = new THREE.AxesHelper(2)
scene.add(axesHelper)
// 新建控制器
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true //旋转阻尼
controls.enableRotate = false // 禁用旋转
// controls.enableZoom = false;   // 禁用缩放
// controls.enablePan = false;    // 禁用平移


// 鼠标控制地球旋转
class earthRotateControl {
    static outData = {
        camera: null,
        sphere: null,
        earth: null
    }

    // 添加两个变量来存储起始点和结束点
    #mouseDownPoint = new THREE.Vector3()
    #mouseUpPoint = new THREE.Vector3()

    // 射线
    #raycaster = new THREE.Raycaster()
    #mouse = new THREE.Vector2()

    // 添加一个变量来存储当前的动画ID
    controlAnimation = null
    rotateSelfAnimation = null

    #isControlAnimating = false

    isMouseDown = false //当前鼠标按下状态

    #handleMouseDown = (e) => {
        this.isMouseDown = true
        const point = this.getMouseOnEarthPoint(e)
        if (point) {
            //鼠标按下时对应地球表面的三位向量点
            this.#mouseDownPoint.copy(point)
        }
    }
    #handleMouseUp = (e) => {
        this.isMouseDown = false
        const point = this.getMouseOnEarthPoint(e)
        if (point) {
            //鼠标抬起时对应地球表面的三位向量点
            this.#mouseUpPoint.copy(point)
            // 计算旋转
            this.rotateEarth(this.#mouseDownPoint, this.#mouseUpPoint)
        }
    }

    constructor(data) {
        earthRotateControl.outData.camera = data.camera
        earthRotateControl.outData.sphere = data.sphere
        earthRotateControl.outData.earth = data.earth

        window.addEventListener('mousedown', this.#handleMouseDown)
        window.addEventListener('mouseup', this.#handleMouseUp)

        // 地球开始自转
        const rotateSelf = () => {
            // 地球自转动画
            if (!this.isMouseDown && !this.#isControlAnimating) {
                earth.rotation.y += 0.002
            }

            this.rotateSelfAnimation = requestAnimationFrame(rotateSelf)
        }
        // rotateSelf()
    }
    destroy() {
        window.removeEventListener('mousedown', this.#handleMouseDown)
        window.removeEventListener('mouseup', this.#handleMouseUp)

        // 停止动画
        this.controlAnimation && cancelAnimationFrame(this.controlAnimation)
        this.rotateSelfAnimation && cancelAnimationFrame(this.rotateSelfAnimation)
    }
    getMouseOnEarthPoint = (e) => {
        this.#mouse.x = (e.clientX / window.innerWidth) * 2 - 1
        this.#mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
        // 使用一个新的原点和方向来更新射线。
        this.#raycaster.setFromCamera(this.#mouse, earthRotateControl.outData.camera)
        // 只检测主地球球体,不检测其他对象
        const intersects = this.#raycaster.intersectObject(earthRotateControl.outData.sphere)
        if (intersects.length > 0) {
            // 获取交点
            const point = intersects[0].point
            // 返回标准化的点(因为地球半径为1)
            return point.normalize()
        }
        return null
    }
    rotateEarth = (start, end) => {

        const earth = earthRotateControl.outData.earth

        // 如果存在正在进行的动画，立即取消
        if (this.controlAnimation) {
            cancelAnimationFrame(this.controlAnimation)
            this.controlAnimation = null
        }
        // 获取世界坐标系中的方向
        const worldStart = start.clone()
        const worldEnd = end.clone()

        /*NOTE 
        世界坐标到局部坐标的转换
            1.获取地球的世界变换矩阵
            2.求逆矩阵
            3.将世界坐标点转换为地球局部坐标系中的点
            就像把一个"全球GPS坐标"转换成"相对于地球中心的坐标"。

        实际用处
            在进行对象自身旋转时，使用局部坐标更直观
            在处理父子关系的对象时，子对象的位置和旋转都是相对于父对象的
            进行碰撞检测时，常常需要将世界坐标转换到物体的局部坐标进行计算
        */
        const earthMatrix = earth.matrixWorld.clone().invert()
        const earthSurfacePointStart = worldStart.applyMatrix4(earthMatrix)
        const earthSurfacePointEnd = worldEnd.applyMatrix4(earthMatrix)

        const rotationAxis = new THREE.Vector3()
            .crossVectors(earthSurfacePointStart, earthSurfacePointEnd)
            .normalize()
        const angle = Math.acos(earthSurfacePointStart.dot(earthSurfacePointEnd))

        // 如果角度太小，不执行旋转
        if (Math.abs(angle) < 0.01) return

        let speed = 5 // 初始速度
        let deceleration = 0.97 // 减速因子(每帧减速3%)
        let lastTime = performance.now()//使用 performance.now() 来计算时间差，使动画更流畅

        const animate = () => {
            const currentTime = performance.now()
            const deltaTime = (currentTime - lastTime) / 1000
            lastTime = currentTime

            // 应用减速
            speed *= deceleration

            // 当速度足够小时停止动画
            if (speed < 0.01) {
                this.controlAnimation = null
                this.#isControlAnimating = false
                return
            }

            earth.rotateOnAxis(rotationAxis, angle * speed * deltaTime)

            this.#isControlAnimating = true
            this.controlAnimation = requestAnimationFrame(animate)
        }

        animate()// 开始新的动画
    }
}
const earthRotate = new earthRotateControl({ camera, sphere, earth })


// 路网线路
class RouteLine {
    animation = null

    glowGeometry = new LineGeometry();
    glowMaterial = new LineMaterial({
        color: 0xf8a413,
        linewidth: 1, // 增加线宽
        vertexColors: false, resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
        dashed: false,
        opacity: 1.0,
        transparent: true,
    })

    // 添加基础弧线材质和几何体
    baseGeometry = new THREE.BufferGeometry()
    baseMaterial = new THREE.LineBasicMaterial({
        color: 0x666666,
        transparent: true,
        opacity: 0.2
    });

    baseLine = new THREE.Line(this.baseGeometry, this.baseMaterial)
    glowLine = new Line2(this.glowGeometry, this.glowMaterial)
    group = new THREE.Group().add(this.baseLine).add(this.glowLine)

    destroy() {
        cancelAnimationFrame(this.animation)
        this.glowGeometry.dispose()
        this.glowMaterial.dispose()
        this.baseGeometry.dispose()
        this.baseMaterial.dispose()
    }
    constructor({ routePoints }) {
        const radius = 1.001
        // 将经纬度数组转换为三维坐标点,并稍微抬高
        const basePoints = routePoints.map(p => {
            let point = new THREE.Vector3()
            point.setFromSphericalCoords(
                radius, // 基础球面半径
                THREE.MathUtils.degToRad(90 - p.latitude),
                THREE.MathUtils.degToRad(p.longitude)
            )
            return point
        })

        // 创建完整的曲线路径
        const fullCurve = new THREE.CatmullRomCurve3(basePoints)

        // 增加采样点数以获得更平滑的效果
        const totalPoints = 500
        const points = fullCurve.getPoints(totalPoints)

        // 设置基础线路
        this.baseGeometry.setFromPoints(points)

        // 设置发光线段参数
        const lengthPercentage = 0.2 // 发光线段长度占总长度的比例
        const glowLineLength = Math.floor(totalPoints * lengthPercentage)
        let progress = 0
        const speed = 0.006

        const animate = () => {
            this.animation = requestAnimationFrame(animate)

            progress += speed
            if (progress >= 1.2) { // 给出额外0.2的时间让线段完全消失
                progress = -0.2 // 从-0.2开始，给出时间让线段逐渐出现
            }

            // 计算当前发光线段的点
            const currentPoints = []

            // 生成基础点
            for (let i = 0; i < glowLineLength; i++) {
                let t = progress + (i / totalPoints)

                // 只在有效范围内添加点
                if (t >= 0 && t <= 1) {
                    const point = fullCurve.getPoint(t)
                    currentPoints.push(point)
                }
            }

            // 更新发光线
            if (currentPoints.length > 0) {
                this.glowLine.geometry.setFromPoints(currentPoints)

                // 调整透明度
                if (progress > 0.8) {
                    // 接近终点,逐渐消失
                    this.glowMaterial.opacity = 1 - (progress - 0.8) / 0.2 //除以0.2,表示接近终点的20%线段渐隐
                } else if (progress < 0) {
                    // 从起点开始,逐渐显现
                    this.glowMaterial.opacity = (progress + 0.2) / 0.2 //除以0.2,表示接近起点的20%线段渐显
                } else {
                    this.glowMaterial.opacity = 1
                }
            }
        }

        animate()

    }
}

// 创建固定的路径点
const generateFixedPoints = () => {
    const points = []
    const count = 40 // 增加点的数量以获得更长的路径

    // 计算markers[1]和markers[2]的中心点
    const centerLat = (markers[1].latitude + markers[2].latitude) / 2
    const centerLng = (markers[1].longitude + markers[2].longitude) / 2
    const range = 8 // 增加运动范围

    for (let i = 0; i < count; i++) {
        // 生成螺旋形路径，同时添加正弦波动使路径更加曲折
        const angle = (i / count) * Math.PI * 3 // 增加到3π使路径更长
        const radius = (0.3 + (i / count) * 0.7) * range // 基础半径0.3，逐渐增大到最大范围
        const wave = Math.sin(angle * 2) * 2 // 添加正弦波动

        const longitude = centerLng + radius * Math.cos(angle)
        const latitude = centerLat + radius * Math.sin(angle) + wave
        points.push({ latitude, longitude })
    }
    return points
}

// 实例化路线，使用生成的固定点
const routeLine = new RouteLine({
    routePoints: generateFixedPoints()
})
earth.add(routeLine.group)

// 动画
let baseAnimateion
function animate() {
    baseAnimateion = requestAnimationFrame(animate)

    renderer.render(scene, camera)
}
animate()


const container = ref(null)
onMounted(() => {
    // 使用 ref 引用获取当前组件的 div 元素
    container.value.appendChild(renderer.domElement)
})


// 替换原有的 onBeforeUnmount
onBeforeUnmount(() => {
    cancelAnimationFrame(baseAnimateion)// 停止动画循环

    markers.forEach(marker => { marker.destroy() })
    parabolas.forEach(parabola => { parabola.destroy() })
    earthRotate.destroy()
    routeLine.destroy()

    // 释放所有资源
    disposeAll(scene)
    renderer.dispose()
    renderer.domElement.remove()
    controls.dispose()
    gui.destroy()
})
</script>

<template>
    <div ref="container">
    </div>
</template>