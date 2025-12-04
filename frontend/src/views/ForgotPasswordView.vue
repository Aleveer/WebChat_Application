<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const email = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);

const handleForgotPassword = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  
  if (!email.value.trim()) {
    errorMessage.value = 'Vui lòng nhập địa chỉ email';
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    errorMessage.value = 'Email không hợp lệ';
    return;
  }

  isLoading.value = true;

  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value.trim().toLowerCase(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Không thể gửi email khôi phục mật khẩu');
    }

    // Show success message
    successMessage.value = data.message || 'Nếu tài khoản tồn tại, một đường link đặt lại mật khẩu đã được gửi đến email của bạn.';
    email.value = ''; // Clear email field
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Đã xảy ra lỗi. Vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};

const goToLogin = () => {
  router.push('/login');
};
</script>

<template>
  <div class="forgot-password-page">
    <div class="forgot-password-container">
      <div class="forgot-password-card">
        <div class="forgot-password-header">
          <h1>🔐 Quên Mật Khẩu</h1>
          <p>Nhập email của bạn để nhận đường link đặt lại mật khẩu</p>
        </div>

        <form @submit.prevent="handleForgotPassword" class="forgot-password-form">
          <div class="form-group">
            <label for="email">Địa chỉ Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="Nhập email của bạn"
              :disabled="isLoading"
              autocomplete="email"
            />
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <div v-if="successMessage" class="success-message">
            {{ successMessage }}
          </div>

          <button type="submit" class="submit-btn" :disabled="isLoading">
            <span v-if="!isLoading">Gửi Đường Link Đặt Lại</span>
            <span v-else>Đang gửi...</span>
          </button>
        </form>

        <div class="forgot-password-footer">
          <button @click="goToLogin" class="back-to-login-link">
            ← Quay lại Đăng Nhập
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.forgot-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.forgot-password-container {
  width: 100%;
  max-width: 400px;
}

.forgot-password-card {
  background: white;
  border-radius: 12px;
  padding: 1.75rem 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.4s ease-out;
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

.forgot-password-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.forgot-password-header h1 {
  margin: 0;
  font-size: 1.75rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.forgot-password-header p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.forgot-password-form {
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.4rem;
  color: #333;
  font-weight: 500;
  font-size: 0.875rem;
}

.form-group input {
  width: 100%;
  padding: 0.65rem 0.875rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input:disabled {
  background: #f9fafb;
  cursor: not-allowed;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 0.6rem;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 0.875rem;
  text-align: center;
}

.success-message {
  background: #d1fae5;
  color: #065f46;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 0.875rem;
  text-align: center;
  line-height: 1.5;
}

.submit-btn {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.forgot-password-footer {
  text-align: center;
  padding-top: 0.875rem;
  border-top: 1px solid #e5e7eb;
}

.back-to-login-link {
  background: none;
  border: none;
  color: #667eea;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: none;
  padding: 0;
  font-weight: 500;
}

.back-to-login-link:hover {
  text-decoration: underline;
}
</style>

