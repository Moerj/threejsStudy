<template>
  <div class="box">
    <div class="routeButton" @click="$router.push({ path: '/spheres' })">
      球体控制
    </div>
    <div class="routeButton" @click="$router.push({ path: '/earth' })">
      地球模型
    </div>
    <div class="routeButton" @click="$router.push({ path: '/line' })">
      飞线
    </div>
  </div>
</template>

<style scoped>
.box {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.routeButton {
  width: 300px;
  font-size: 20px;
  text-align: center;
  padding: 10px;
  cursor: pointer;
  border: 1px #ddd solid;
  margin: 0 auto;
  margin-bottom: 5px;
}
.routeButton:hover {
  color: cornflowerblue;
}
</style>