<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const password = ref('');
const confirmPassword = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const token = ref('');

onMounted(() => {
  // Get token from URL query parameter
  token.value = route.query.token as string || '';
  
  if (!token.value) {
    errorMessage.value = 'Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.';
  }
});

const handleResetPassword = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  
  if (!token.value) {
    errorMessage.value = 'Token không hợp lệ';
    return;
  }

  if (!password.value.trim() || !confirmPassword.value.trim()) {
    errorMessage.value = 'Vui lòng nhập đầy đủ thông tin';
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Mật khẩu xác nhận không khớp';
    return;
  }

  if (password.value.length < 8) {
    errorMessage.value = 'Mật khẩu phải có ít nhất 8 ký tự';
    return;
  }

  // Validate password format (alphanumeric and special characters)
  const passwordRegex = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/;
  if (!passwordRegex.test(password.value)) {
    errorMessage.value = 'Mật khẩu chỉ được chứa chữ cái, số và ký tự đặc biệt';
    return;
  }

  isLoading.value = true;

  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token.value,
        password: password.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific error messages from backend
      if (data.message) {
        throw new Error(data.message);
      } else if (data.feedback) {
        // If backend returns validation feedback
        throw new Error(data.feedback.join(', '));
      } else {
        throw new Error('Không thể đặt lại mật khẩu');
      }
    }

    // Show success message
    successMessage.value = 'Mật khẩu đã được đặt lại thành công! Đang chuyển đến trang đăng nhập...';
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Đã xảy ra lỗi. Vui lòng thử lại.';
  } finally {
    isLoading.value = false;
  }
};

const goToForgotPassword = () => {
  router.push('/forgot-password');
};
</script>

<template>
  <div class="reset-password-page">
    <div class="reset-password-container">
      <div class="reset-password-card">
        <div class="reset-password-header">
          <h1>🔑 Đặt Lại Mật Khẩu</h1>
          <p>Nhập mật khẩu mới của bạn</p>
        </div>

        <form @submit.prevent="handleResetPassword" class="reset-password-form">
          <div class="form-group">
            <label for="password">Mật Khẩu Mới</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
              :disabled="isLoading || !token"
              autocomplete="new-password"
            />
          </div>

          <div class="form-group">
            <label for="confirm-password">Xác Nhận Mật Khẩu</label>
            <input
              id="confirm-password"
              v-model="confirmPassword"
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              :disabled="isLoading || !token"
              autocomplete="new-password"
            />
          </div>

          <div class="password-requirements">
            <p>Yêu cầu mật khẩu:</p>
            <ul>
              <li :class="{ valid: password.length >= 8 }">Tối thiểu 8 ký tự</li>
              <li :class="{ valid: password === confirmPassword && password.length > 0 }">Mật khẩu khớp nhau</li>
            </ul>
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <div v-if="successMessage" class="success-message">
            {{ successMessage }}
          </div>

          <button type="submit" class="submit-btn" :disabled="isLoading || !token">
            <span v-if="!isLoading">Đặt Lại Mật Khẩu</span>
            <span v-else>Đang xử lý...</span>
          </button>
        </form>

        <div class="reset-password-footer">
          <button @click="goToForgotPassword" class="back-link">
            Gửi lại đường link đặt lại mật khẩu
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reset-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.reset-password-container {
  width: 100%;
  max-width: 400px;
}

.reset-password-card {
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

.reset-password-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.reset-password-header h1 {
  margin: 0;
  font-size: 1.75rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.reset-password-header p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.reset-password-form {
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

.password-requirements {
  background: #f3f4f6;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.85rem;
}

.password-requirements p {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-weight: 500;
}

.password-requirements ul {
  margin: 0;
  padding-left: 1.25rem;
  color: #666;
}

.password-requirements li {
  margin-bottom: 0.25rem;
  transition: color 0.2s;
}

.password-requirements li.valid {
  color: #059669;
  font-weight: 500;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 0.6rem;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 0.875rem;
  text-align: center;
  line-height: 1.4;
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

.reset-password-footer {
  text-align: center;
  padding-top: 0.875rem;
  border-top: 1px solid #e5e7eb;
}

.back-link {
  background: none;
  border: none;
  color: #667eea;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: none;
  padding: 0;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}
</style>

