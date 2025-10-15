<template>
  <main class="container">
    <h1>WebChat</h1>
    <section class="status">
      <p>
        API status:
        <strong :class="{ ok: health?.status === 'ok' }">{{
          health?.status || "..."
        }}</strong>
      </p>
      <button @click="refreshHealth">Refresh</button>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getHealth } from "./services/apiClient";

const health = ref<{ status: string } | null>(null);

async function refreshHealth() {
  try {
    health.value = await getHealth();
  } catch (err) {
    health.value = { status: "error" };
  }
}

onMounted(refreshHealth);
</script>

<style scoped>
.container {
  max-width: 720px;
  margin: 40px auto;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell,
    Noto Sans, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
}
.status {
  display: flex;
  gap: 12px;
  align-items: center;
}
.ok {
  color: #16a34a;
}
button {
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
button:hover {
  background: #f9fafb;
}
</style>
