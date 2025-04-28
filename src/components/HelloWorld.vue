
<template>
  <div>
    {{copy.count}}
  </div>
</template>

<script setup>
import { ref, reactive, readonly , watchEffect} from 'vue'

const original = reactive({ count: 0 })

const copy = readonly(original)

watchEffect(() => {
  // 用来做响应性追踪
  console.log(copy.count)
})

// 更改源属性会触发其依赖的侦听器
original.count++
original.count++
original.count++
setTimeout(() => {
  original.count++
  
}, 1000);

// 更改该只读副本将会失败，并会得到一个警告
// copy.count++ // warning!


</script>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
