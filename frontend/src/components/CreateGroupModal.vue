<script setup lang="ts">
import { computed, ref, watch } from 'vue';

interface BasicUser {
  _id: string;
  username: string;
  full_name?: string;
  email?: string;
  photo?: string;
}

const props = defineProps<{
  visible: boolean;
  currentUserId: string;
  busy?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [{ name: string; memberIds: string[] }];
}>();

const name = ref('');
const users = ref<BasicUser[]>([]);
const search = ref('');
const selectedIds = ref<Set<string>>(new Set());
const loading = ref(false);
const error = ref('');

const authorizedFetch = async (input: RequestInfo, init: RequestInit = {}) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Không tìm thấy token đăng nhập');
  }
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(input, {
    ...init,
    headers,
  });
};

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await authorizedFetch('/api/users');
    const payload = await response.json();
    const data = payload?.data ?? payload;
    users.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Fetch users failed', err);
    error.value = 'Không tải được danh sách người dùng.';
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  name.value = '';
  search.value = '';
  selectedIds.value = new Set();
  error.value = '';
};

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      await fetchUsers();
      resetForm();
    }
  },
  { immediate: false },
);

const filteredUsers = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  return users.value
    .filter((user) => user._id !== props.currentUserId)
    .filter((user) => {
      if (!keyword) return true;
      return (
        user.username?.toLowerCase().includes(keyword) ||
        user.full_name?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword)
      );
    });
});

const toggleSelection = (userId: string) => {
  const next = new Set(selectedIds.value);
  if (next.has(userId)) {
    next.delete(userId);
  } else {
    if (next.size >= 99) {
      error.value = 'Nhóm tối đa 100 thành viên (bao gồm bạn).';
      return;
    }
    next.add(userId);
  }
  selectedIds.value = next;
  if (error.value) {
    error.value = '';
  }
};

const handleSubmit = () => {
  const trimmedName = name.value.trim();
  if (!trimmedName) {
    error.value = 'Vui lòng nhập tên nhóm.';
    return;
  }

  if (selectedIds.value.size < 2) {
    error.value = 'Chọn ít nhất 2 thành viên khác để đạt tối thiểu 3 người.';
    return;
  }

  emit('submit', {
    name: trimmedName,
    memberIds: Array.from(selectedIds.value),
  });
};
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-backdrop">
      <div class="modal">
        <header class="modal-header">
          <h2>Tạo nhóm trò chuyện</h2>
          <button class="close-btn" @click="emit('close')" :disabled="busy">
            ✕
          </button>
        </header>

        <div class="modal-body">
          <label class="field">
            <span class="label">Tên nhóm</span>
            <input
              v-model="name"
              type="text"
              maxlength="100"
              placeholder="Nhập tên nhóm (tối đa 100 ký tự)"
              :disabled="busy"
            />
          </label>

          <label class="field">
            <span class="label">Tìm kiếm thành viên</span>
            <input
              v-model="search"
              type="text"
              placeholder="Tìm kiếm theo tên, email..."
              :disabled="busy"
            />
          </label>

          <div class="members-container">
            <div v-if="loading" class="loading-state">Đang tải...</div>
            <div v-else class="member-list">
              <label
                v-for="user in filteredUsers"
                :key="user._id"
                class="member-item"
              >
                <input
                  type="checkbox"
                  :value="user._id"
                  :checked="selectedIds.has(user._id)"
                  :disabled="busy"
                  @change="toggleSelection(user._id)"
                />
                <div class="member-meta">
                  <span class="member-name">
                    {{ user.username || user.full_name || 'Người dùng' }}
                  </span>
                  <span v-if="user.full_name" class="member-sub">
                    {{ user.full_name }}
                  </span>
                  <span v-if="user.email" class="member-sub">
                    {{ user.email }}
                  </span>
                </div>
              </label>

              <div v-if="filteredUsers.length === 0" class="empty-state">
                Không có người dùng phù hợp.
              </div>
            </div>
          </div>

          <p class="helper-text">
            Cần tối thiểu 3 thành viên và tối đa 100 (bao gồm bạn).
          </p>
          <p v-if="error" class="error-text">{{ error }}</p>
        </div>

        <footer class="modal-footer">
          <button class="secondary" :disabled="busy" @click="emit('close')">
            Hủy
          </button>
          <button class="primary" :disabled="busy" @click="handleSubmit">
            {{ busy ? 'Đang tạo...' : 'Tạo nhóm' }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

.modal {
  width: 480px;
  max-height: 80vh;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(79, 70, 229, 0.25);
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.1rem;
  color: #111827;
}

.close-btn {
  border: none;
  background: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6b7280;
}

.close-btn:hover:not(:disabled) {
  color: #111827;
}

.modal-body {
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1rem;
}

.label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #374151;
}

input[type='text'] {
  padding: 0.55rem 0.75rem;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-size: 0.95rem;
}

input[type='text']:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.members-container {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.75rem;
  max-height: 240px;
  overflow: hidden;
}

.member-list {
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.member-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.2s;
}

.member-item:hover {
  background: #f3f4f6;
}

.member-meta {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.member-name {
  font-weight: 600;
  color: #111827;
}

.member-sub {
  font-size: 0.8rem;
  color: #6b7280;
}

.loading-state,
.empty-state {
  text-align: center;
  color: #6b7280;
  padding: 1rem;
}

.helper-text {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 0.75rem;
}

.error-text {
  font-size: 0.85rem;
  color: #dc2626;
  margin-top: 0.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

button {
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.25);
}

.primary:hover:not(:disabled) {
  transform: translateY(-1px);
}

.secondary {
  background: #f3f4f6;
  color: #374151;
}

.secondary:hover:not(:disabled) {
  background: #e5e7eb;
}
</style>

