<template>
    <div class="box">
        <div class="routeButton" @click="$router.push({ path: '/spheres' })">球体控制</div>
    </div>
</template>

<style scoped>
    .box{
        height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    .routeButton{
        width: 300px;
        font-size: 20px;
        text-align: center;
        padding: 10px;
        cursor: pointer;
        border: 1px #ddd solid;
        margin: 0 auto;
        &:hover{
            color:cornflowerblue;
        }
    }
</style>