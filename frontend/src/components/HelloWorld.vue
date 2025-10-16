<script setup>
import { ref, onMounted } from 'vue'

defineProps({
  msg: String,
})

const count = ref(0)
const apiHello = ref('')
const ping = ref('')
const apiB = ref('')
const apiA = ref('')
const loading = ref(false)
const error = ref('')

async function callApi(path) {
  try {
    error.value = ''
    loading.value = true
    const res = await fetch(path)
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await res.json()
      return data
    }
    const text = await res.text()
    return text
  } catch (e) {
    error.value = 'Lỗi gọi API'
    return null
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const data = await callApi('/api/hello')
  apiHello.value = typeof data === 'string' ? data : (data?.message ?? JSON.stringify(data))
})

async function callPing() {
  const data = await callApi('/ping')
  ping.value = typeof data === 'string' ? data : JSON.stringify(data)
}

async function callB() {
  const data = await callApi('/api/b')
  apiB.value = typeof data === 'string' ? data : JSON.stringify(data)
}

async function callA() {
  const data = await callApi('/api/a')
  apiA.value = typeof data === 'string' ? data : JSON.stringify(data)
}
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
    <p>Phản hồi /api/hello: <strong>{{ apiHello }}</strong></p>
  </div>

  <div class="card">
    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
      <button type="button" @click="callPing" :disabled="loading">Gọi /ping</button>
      <button type="button" @click="callB" :disabled="loading">Gọi /api/b</button>
      <button type="button" @click="callA" :disabled="loading">Gọi /api/a</button>
    </div>
    <div v-if="error" style="color: #c00; margin-top: 8px;">{{ error }}</div>
    <div style="margin-top: 8px;">
      <div><strong>/ping:</strong> {{ ping }}</div>
      <div><strong>/api/b:</strong> {{ apiB }}</div>
      <div><strong>/api/a:</strong> {{ apiA }}</div>
    </div>
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
