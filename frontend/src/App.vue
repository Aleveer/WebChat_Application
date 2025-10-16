<template>
  <div class="container">
    <h1>WebChat Frontend (Vue 3 + Vite)</h1>
    <p>Nhấn nút để kiểm tra các API backend.</p>
    <div class="actions">
      <button
        v-for="ep in endpoints"
        :key="ep.path"
        @click="callApi(ep.path)"
        :disabled="loadingPath === ep.path"
      >
        {{ loadingPath === ep.path ? 'Đang gọi ' + ep.path + '...' : ep.label + ' (' + ep.path + ')' }}
      </button>
    </div>
    <div class="result" v-if="lastEndpoint || result">
      <div><strong>Endpoint:</strong> {{ lastEndpoint || '-' }}</div>
      <pre>{{ result || '' }}</pre>
    </div>
    <div class="error" v-if="error">
      <strong>Lỗi:</strong> {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const endpoints = [
  { label: 'Hello', path: '/api/hello' },
  { label: 'A', path: '/api/a' },
  { label: 'B', path: '/api/b' },
  { label: 'Ping', path: '/ping' },
]

const loadingPath = ref('')
const lastEndpoint = ref('')
const result = ref('')
const error = ref('')

const getApiBase = () => {
  const fromEnv = import.meta.env.VITE_API_BASE_URL
  if (fromEnv) return fromEnv
  return ''
}

async function callApi(path) {
  loadingPath.value = path
  error.value = ''
  result.value = ''
  lastEndpoint.value = path
  const base = getApiBase()
  const url = base ? `${base}${path}` : path
  try {
    const res = await fetch(url, { credentials: 'include' })
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await res.json()
      result.value = JSON.stringify(data, null, 2)
    } else {
      const text = await res.text()
      result.value = text
    }
  } catch (e) {
    error.value = e?.message || String(e)
  } finally {
    loadingPath.value = ''
  }
}
</script>

<style>
.container {
  max-width: 720px;
  margin: 40px auto;
  padding: 16px;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
}
.actions { margin: 12px 0; display: flex; flex-wrap: wrap; gap: 8px; }
button { padding: 8px 14px; cursor: pointer; }
.result, .error { margin-top: 16px; }
.error { color: #b00020; }
</style>