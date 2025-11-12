<script setup lang="ts">
import { computed, ref, watch } from 'vue';

interface PopulatedUser {
  _id: string;
  username?: string;
  full_name?: string;
  email?: string;
  photo?: string;
}

interface GroupMember {
  user_id: PopulatedUser | string;
  is_admin: boolean;
  removed_at?: string | null;
  joined_at?: string;
}

interface GroupDetails {
  _id: string;
  name: string;
  members: GroupMember[];
}

const props = defineProps<{
  group: GroupDetails;
  currentUserId: string;
  isAdmin: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  kick: [userId: string];
  toggleAdmin: [{ userId: string; isAdmin: boolean }];
  rename: [newName: string];
  delete: [];
}>();

const renameMode = ref(false);
const groupName = ref(props.group.name || '');

watch(
  () => props.group.name,
  (value) => {
    groupName.value = value ?? '';
  },
);

const normalizedMembers = computed(() =>
  props.group.members
    .map((member) => {
      const user =
        typeof member.user_id === 'string'
          ? { _id: member.user_id, username: 'Người dùng' }
          : member.user_id;
      return {
        id: user._id,
        username: user.username ?? user.full_name ?? 'Người dùng',
        fullName: user.full_name,
        isAdmin: member.is_admin,
        removedAt: member.removed_at,
        joinedAt: member.joined_at,
        isCurrent: user._id === props.currentUserId,
      };
    })
    .sort((a, b) => {
      if (a.isAdmin !== b.isAdmin) {
        return a.isAdmin ? -1 : 1;
      }
      return a.username.localeCompare(b.username || '');
    }),
);

const isSelf = (memberId: string) => memberId === props.currentUserId;

const confirmKick = (memberId: string) => {
  const ok = confirm('Bạn có chắc muốn xoá thành viên này khỏi nhóm?');
  if (!ok) return;
  emit('kick', memberId);
};

const confirmDeleteGroup = () => {
  const ok = confirm(
    'Bạn chắc chắn muốn xoá nhóm này? Tất cả tin nhắn sẽ bị xoá.',
  );
  if (!ok) return;
  emit('delete');
};

const submitRename = () => {
  const trimmed = groupName.value.trim();
  if (!trimmed || trimmed === props.group.name) {
    renameMode.value = false;
    groupName.value = props.group.name;
    return;
  }
  emit('rename', trimmed);
  renameMode.value = false;
};
</script>

<template>
  <aside class="members-panel">
    <header class="panel-header">
      <div class="header-info">
        <div v-if="!renameMode" class="title-row">
          <h3>{{ group.name }}</h3>
          <button
            v-if="isAdmin"
            class="icon-btn"
            :disabled="loading"
            title="Đổi tên nhóm"
            @click="renameMode = true"
          >
            ✏️
          </button>
        </div>
        <div v-else class="rename-form">
          <input
            v-model="groupName"
            type="text"
            maxlength="100"
            placeholder="Tên nhóm"
          />
          <div class="rename-actions">
            <button class="primary" :disabled="loading" @click="submitRename">
              Lưu
            </button>
            <button
              class="secondary"
              :disabled="loading"
              @click="
                () => {
                  renameMode = false;
                  groupName = group.name;
                }
              "
            >
              Hủy
            </button>
          </div>
        </div>
        <p class="member-count">
          {{ normalizedMembers.length }} thành viên
        </p>
      </div>
      <button
        v-if="isAdmin"
        class="danger-btn"
        :disabled="loading"
        @click="confirmDeleteGroup"
      >
        🗑 Xóa nhóm
      </button>
    </header>

    <div class="members-list" :class="{ loading }">
      <div v-if="loading" class="loading-overlay">
        <span>Đang xử lý...</span>
      </div>

      <div
        v-for="member in normalizedMembers"
        :key="member.id"
        class="member-item"
        :class="{
          self: isSelf(member.id),
          admin: member.isAdmin,
        }"
      >
        <div class="member-info">
          <div class="avatar">
            {{ member.username?.charAt(0)?.toUpperCase() ?? '?' }}
          </div>
          <div>
            <div class="name-line">
              <span class="username">{{ member.username }}</span>
              <span v-if="member.isAdmin" class="badge admin-badge">Admin</span>
            </div>
            <div class="meta">
              <span v-if="member.fullName" class="full-name">
                {{ member.fullName }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="isAdmin" class="member-actions">
          <template v-if="member.isAdmin">
            <span class="admin-note">
              {{ member.isCurrent ? 'Bạn là admin' : 'Admin' }}
            </span>
          </template>
          <template v-else>
            <button
              class="secondary"
              :disabled="loading"
              @click="
                () =>
                  emit('toggleAdmin', {
                    userId: member.id,
                    isAdmin: !member.isAdmin,
                  })
              "
            >
              ⬆️ Cấp admin
            </button>

            <button
              class="danger-btn"
              :disabled="loading"
              @click="confirmKick(member.id)"
            >
              ❌ Xóa
            </button>
          </template>
        </div>
      </div>

      <div v-if="normalizedMembers.length === 0" class="empty-state">
        Chưa có thành viên nào.
      </div>
    </div>
  </aside>
</template>

<style scoped>
.members-panel {
  width: 300px;
  background: white;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  gap: 0.5rem;
}

.header-info h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #111827;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.member-count {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: #6b7280;
}

.members-list {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  gap: 0.75rem;
}

.member-item.self {
  background: #eef2ff;
}

.member-info {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.name-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.username {
  font-weight: 600;
  color: #1f2937;
}

.badge {
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
  font-weight: 600;
}

.admin-badge {
  background: #dcfce7;
  color: #166534;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.member-actions {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.admin-note {
  color: #2563eb;
  font-weight: 600;
}

button {
  border: none;
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.2s, transform 0.2s;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary {
  background: #eef2ff;
  color: #3730a3;
}

.secondary:hover:not(:disabled) {
  background: #e0e7ff;
}

.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.primary:hover:not(:disabled) {
  transform: translateY(-1px);
}

.danger-btn {
  background: #fee2e2;
  color: #b91c1c;
}

.danger-btn:hover:not(:disabled) {
  background: #fecaca;
}

.icon-btn {
  background: #eef2ff;
  color: #3730a3;
  padding: 0.3rem 0.5rem;
}

.icon-btn:hover:not(:disabled) {
  background: #e0e7ff;
}

.rename-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rename-form input {
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 0.9rem;
}

.rename-form input:focus {
  outline: none;
  border-color: #6366f1;
}

.rename-actions {
  display: flex;
  gap: 0.5rem;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #4b5563;
  z-index: 2;
}

.members-list.loading {
  pointer-events: none;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: #9ca3af;
  font-size: 0.9rem;
}
</style>

