<script setup>
import { ref, onMounted } from 'vue'

defineProps({
  msg: String,
})

const count = ref(0)
const apiMessage = ref('')

onMounted(async () => {
  try {
    const res = await fetch('/api/hello')
    const data = await res.json()
    apiMessage.value = data.message ?? JSON.stringify(data)
  } catch (e) {
    apiMessage.value = 'Lỗi gọi API'
  }
})
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

  <div class="card">
    <p>Phản hồi từ backend: <strong>{{ apiMessage }}</strong></p>
  </div>

  <p>
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank"
      >create-vue</a
    >, the official Vue + Vite starter
  </p>
  <p>
    Learn more about IDE Support for Vue in the
    <a
      href="https://vuejs.org/guide/scaling-up/tooling.html#ide-support"
      target="_blank"
      >Vue Docs Scaling up Guide</a
    >.
  </p>
  <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
