<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface User {
  _id: string;
  username?: string;
  email?: string;
  phone?: string;
  photo?: string;
  full_name?: string;
}

interface Props {
  currentUserId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

// User profile data
const userProfile = ref<User | null>(null);
const isLoading = ref(false);
const isSaving = ref(false);

// Profile form data
const profileForm = ref({
  username: '',
  email: '',
  phone: '',
  photo: '',
  full_name: '',
});

// Password form data
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
});

// UI states
const activeTab = ref<'profile' | 'password'>('profile');
const profileError = ref('');
const profileSuccess = ref('');
const passwordError = ref('');
const passwordSuccess = ref('');
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);

// Validation
const isValidEmail = (email: string) => {
  if (!email) return true; // Email is optional but if provided must be valid
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (phone: string) => {
  if (!phone) return true; // Phone is optional but if provided must be valid
  return /^\+[1-9]\d{1,14}$/.test(phone);
};

const isValidUsername = (username: string) => {
  if (!username) return false; // Username is required
  return /^[a-zA-Z0-9_]+$/.test(username) && username.length <= 50;
};

const isValidPhotoUrl = (url: string) => {
  if (!url) return true; // Photo is optional
  return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);
};

const profileFormValid = computed(() => {
  // Username is required
  if (!profileForm.value.username || !isValidUsername(profileForm.value.username)) {
    return false;
  }
  
  // At least one of email or phone must be provided
  const hasEmail = profileForm.value.email && profileForm.value.email.trim().length > 0;
  const hasPhone = profileForm.value.phone && profileForm.value.phone.trim().length > 0;
  
  if (!hasEmail && !hasPhone) {
    return false;
  }

  // If email provided, must be valid
  if (hasEmail && !isValidEmail(profileForm.value.email)) {
    return false;
  }

  // If phone provided, must be valid
  if (hasPhone && !isValidPhone(profileForm.value.phone)) {
    return false;
  }

  // If photo provided, must be valid URL
  if (profileForm.value.photo && !isValidPhotoUrl(profileForm.value.photo)) {
    return false;
  }

  return true;
});

const passwordFormValid = computed(() => {
  return (
    passwordForm.value.currentPassword.length > 0 &&
    passwordForm.value.newPassword.length >= 8
  );
});

const userInitials = computed(() => {
  if (profileForm.value.username) {
    return profileForm.value.username.charAt(0).toUpperCase();
  }
  return '?';
});

// Fetch user profile
const fetchUserProfile = async () => {
  isLoading.value = true;
  profileError.value = '';

  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch('http://localhost:3000/api/v1/users/me/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const result = await response.json();
      userProfile.value = result.data;
      // Auto-fill form with current data
      profileForm.value.username = userProfile.value?.username || '';
      profileForm.value.email = userProfile.value?.email || '';
      profileForm.value.phone = userProfile.value?.phone || '';
      profileForm.value.photo = userProfile.value?.photo || '';
      profileForm.value.full_name = userProfile.value?.full_name || '';
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to load profile:', errorData);
      profileError.value = errorData.message || 'Failed to load profile';
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    profileError.value = 'Network error. Please check your connection.';
  } finally {
    isLoading.value = false;
  }
};

// Update profile
const updateProfile = async () => {
  if (!profileFormValid.value) {
    profileError.value = 'Please fill in all required fields correctly';
    return;
  }

  isSaving.value = true;
  profileError.value = '';
  profileSuccess.value = '';

  try {
    const token = localStorage.getItem('access_token');
    
    // Build complete update data with all fields
    const updateData: any = {};
    
    // Always send all fields so backend knows what to update/clear
    updateData.username = profileForm.value.username?.trim() || userProfile.value?.username;
    updateData.email = profileForm.value.email?.trim() || null;
    updateData.phone = profileForm.value.phone?.trim() || null;
    updateData.photo = profileForm.value.photo?.trim() || null;
    updateData.full_name = profileForm.value.full_name?.trim() || null;
    
    // Check for changes
    const hasChanges = 
      updateData.username !== userProfile.value?.username ||
      updateData.email !== userProfile.value?.email ||
      updateData.phone !== userProfile.value?.phone ||
      updateData.photo !== userProfile.value?.photo ||
      updateData.full_name !== userProfile.value?.full_name;

    console.log('Sending update data:', updateData);

    // Check if there are any changes to send
    if (!hasChanges) {
      profileSuccess.value = 'No changes to save';
      setTimeout(() => {
        profileSuccess.value = '';
      }, 2000);
      isSaving.value = false;
      return;
    }

    const response = await fetch('http://localhost:3000/api/v1/users/me/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (response.ok) {
      const result = await response.json();
      userProfile.value = result.data;
      
      // Re-fetch profile to ensure we have the latest data from server
      await fetchUserProfile();
      
      profileSuccess.value = 'Profile updated successfully';
      
      // Update username in localStorage if changed
      if (updateData.username) {
        localStorage.setItem('username', updateData.username);
      }
      
      setTimeout(() => {
        profileSuccess.value = '';
      }, 3000);
    } else {
      const error = await response.json();
      console.error('Update profile error:', error);
      // Handle validation errors
      if (error.message && Array.isArray(error.message)) {
        profileError.value = error.message.map((e: any) => e.message || e).join(', ');
      } else {
        profileError.value = error.message || 'Failed to update profile';
      }
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    profileError.value = 'Network error';
  } finally {
    isSaving.value = false;
  }
};

// Change password
const changePassword = async () => {
  if (!passwordFormValid.value) {
    passwordError.value = 'Please fill in all password fields correctly';
    return;
  }

  isSaving.value = true;
  passwordError.value = '';
  passwordSuccess.value = '';

  try {
    const token = localStorage.getItem('access_token');

    const passwordData = {
      currentPassword: String(passwordForm.value.currentPassword || '').trim(),
      newPassword: String(passwordForm.value.newPassword || '').trim(),
    };
    
    const response = await fetch('http://localhost:3000/api/v1/users/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(passwordData),
    });

    if (response.ok) {
      passwordSuccess.value = 'Password changed successfully';
      
      // Clear password form
      passwordForm.value = {
        currentPassword: '',
        newPassword: '',
      };

      setTimeout(() => {
        passwordSuccess.value = '';
      }, 3000);
    } else {
      const error = await response.json();
      passwordError.value = error.message || 'Failed to change password';
    }
  } catch (error) {
    console.error('Error changing password:', error);
    passwordError.value = 'Network error';
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  console.log('ProfileSettings mounted, fetching user profile...');
  fetchUserProfile();
});
</script>

<template>
  <div class="profile-settings-overlay" @click.self="emit('close')">
    <div class="profile-settings-modal">
      <!-- Header -->
      <div class="modal-header">
        <h2>⚙️ Profile Settings</h2>
        <button @click="emit('close')" class="close-btn" title="Close">✕</button>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          :class="['tab', { active: activeTab === 'profile' }]"
          @click="activeTab = 'profile'"
        >
          👤 Profile
        </button>
        <button
          :class="['tab', { active: activeTab === 'password' }]"
          @click="activeTab = 'password'"
        >
          🔒 Password
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading profile...</p>
      </div>

      <!-- Profile Tab -->
      <div v-else-if="activeTab === 'profile'" class="tab-content">
        <form @submit.prevent="updateProfile" class="profile-form">
          <!-- Profile Picture -->
          <div class="profile-picture-section">
            <div class="avatar-preview">
              <img
                v-if="profileForm.photo"
                :src="profileForm.photo"
                :alt="profileForm.username"
                @error="profileForm.photo = ''"
              />
              <div v-else class="avatar-placeholder">{{ userInitials }}</div>
            </div>
          </div>

          <!-- Profile Photo URL -->
          <div class="form-group">
            <label for="photo">Profile Picture URL</label>
            <input
              id="photo"
              v-model="profileForm.photo"
              type="text"
              placeholder="https://example.com/photo.jpg"
              :disabled="isLoading"
              :class="{ 'input-error': profileForm.photo && !isValidPhotoUrl(profileForm.photo) }"
            />
            <span v-if="profileForm.photo && !isValidPhotoUrl(profileForm.photo)" class="error-text">
              Must be a valid image URL (jpg, jpeg, png, gif, webp)
            </span>
          </div>

          <!-- Full Name -->
          <div class="form-group">
            <label for="full_name">Full Name</label>
            <input
              id="full_name"
              v-model="profileForm.full_name"
              type="text"
              placeholder="Enter your full name"
              :disabled="isLoading"
            />
          </div>

          <!-- Username (Required) -->
          <div class="form-group">
            <label for="username">
              Username <span class="required">*</span>
            </label>
            <input
              id="username"
              v-model="profileForm.username"
              type="text"
              placeholder="Enter username"
              required
              :disabled="isLoading"
              :class="{ 'input-error': profileForm.username && !isValidUsername(profileForm.username) }"
            />
            <span v-if="profileForm.username && !isValidUsername(profileForm.username)" class="error-text">
              Username must be alphanumeric with underscores (max 50 chars)
            </span>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="email">
              Email
              <span class="hint">(At least one: Email or Phone)</span>
            </label>
            <input
              id="email"
              v-model="profileForm.email"
              type="email"
              placeholder="email@example.com"
              :disabled="isLoading"
              :class="{ 'input-error': profileForm.email && !isValidEmail(profileForm.email) }"
            />
            <span v-if="profileForm.email && !isValidEmail(profileForm.email)" class="error-text">
              Must be a valid email address
            </span>
          </div>

          <!-- Phone -->
          <div class="form-group">
            <label for="phone">
              Phone Number
              <span class="hint">(At least one: Email or Phone)</span>
            </label>
            <input
              id="phone"
              v-model="profileForm.phone"
              type="tel"
              placeholder="+84901234567"
              :disabled="isLoading"
              :class="{ 'input-error': profileForm.phone && !isValidPhone(profileForm.phone) }"
            />
            <span v-if="profileForm.phone && !isValidPhone(profileForm.phone)" class="error-text">
              Must be in international format (e.g., +84901234567)
            </span>
            <span v-if="!profileForm.phone && !isLoading" class="info-text">
              📱 No phone number set. Add one here if needed.
            </span>
          </div>

          <!-- Error/Success Messages -->
          <div v-if="profileError" class="alert alert-error">{{ profileError }}</div>
          <div v-if="profileSuccess" class="alert alert-success">{{ profileSuccess }}</div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn-primary"
            :disabled="!profileFormValid || isSaving"
          >
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
        </form>
      </div>

      <!-- Password Tab -->
      <div v-else-if="activeTab === 'password'" class="tab-content">
        <form @submit.prevent="changePassword" class="password-form">
          <!-- Current Password -->
          <div class="form-group">
            <label for="currentPassword">
              Current Password <span class="required">*</span>
            </label>
            <div class="password-input-wrapper">
              <input
                id="currentPassword"
                v-model="passwordForm.currentPassword"
                :type="showCurrentPassword ? 'text' : 'password'"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                class="toggle-password"
                @click="showCurrentPassword = !showCurrentPassword"
              >
                {{ showCurrentPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
          </div>

          <!-- New Password -->
          <div class="form-group">
            <label for="newPassword">
              New Password <span class="required">*</span>
            </label>
            <div class="password-input-wrapper">
              <input
                id="newPassword"
                v-model="passwordForm.newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                placeholder="Enter new password (min 8 characters)"
                required
                :class="{ 'input-error': passwordForm.newPassword && passwordForm.newPassword.length < 8 }"
              />
              <button
                type="button"
                class="toggle-password"
                @click="showNewPassword = !showNewPassword"
              >
                {{ showNewPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
            <span v-if="passwordForm.newPassword && passwordForm.newPassword.length < 8" class="error-text">
              Password must be at least 8 characters
            </span>
          </div>

          <!-- Error/Success Messages -->
          <div v-if="passwordError" class="alert alert-error">{{ passwordError }}</div>
          <div v-if="passwordSuccess" class="alert alert-success">{{ passwordSuccess }}</div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn-primary"
            :disabled="!passwordFormValid || isSaving"
          >
            {{ isSaving ? 'Changing...' : 'Change Password' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.profile-settings-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
  border-radius: 16px 16px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.tab {
  flex: 1;
  padding: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: #6b7280;
  font-weight: 500;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.tab:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.tab.active {
  color: #667eea;
  border-bottom-color: #667eea;
  background: white;
}

.tab-content {
  padding: 1.5rem;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 1rem;
  border: 4px solid #e5e7eb;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.profile-picture-section {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.avatar-preview {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #e5e7eb;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 600;
  color: white;
}

.profile-form,
.password-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.required {
  color: #ef4444;
}

.hint {
  font-weight: 400;
  color: #6b7280;
  font-size: 0.85rem;
}

.form-group input {
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input.input-error {
  border-color: #ef4444;
}

.form-group input.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-group input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.6;
}

.error-text {
  color: #ef4444;
  font-size: 0.85rem;
}

.info-text {
  color: #6b7280;
  font-size: 0.85rem;
  font-style: italic;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper input {
  flex: 1;
  padding-right: 3rem;
}

.toggle-password {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.25rem;
  transition: opacity 0.2s;
}

.toggle-password:hover {
  opacity: 0.7;
}

.alert {
  padding: 0.875rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
}

.alert-error {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.alert-success {
  background: #d1fae5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.btn-primary {
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Scrollbar styling */
.profile-settings-modal::-webkit-scrollbar {
  width: 8px;
}

.profile-settings-modal::-webkit-scrollbar-track {
  background: #f3f4f6;
}

.profile-settings-modal::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.profile-settings-modal::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>

