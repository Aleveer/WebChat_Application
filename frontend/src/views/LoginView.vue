<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  errorMessage.value = '';
  
  if (!username.value.trim() || !password.value.trim()) {
    errorMessage.value = 'Please fill in all fields';
    return;
  }

  isLoading.value = true;

  try {
    const trimmedUsername = username.value.trim();
    

    // TODO: Replace with actual API call
    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const data = await response.json();
    
    // Handle both wrapped (data.data.access_token) and unwrapped (data.access_token) responses
    const token = data.data?.access_token || data.access_token;
    
    // Validate token exists
    if (!token) {
      throw new Error('No access token received from server');
    }
    
    // Store token in localStorage
    localStorage.setItem('access_token', token);
    localStorage.setItem('username', username.value);
    
    // Navigate to chat
    router.push('/chat');
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Login failed. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const goToRegister = () => {
  router.push('/register');
};

const goToForgotPassword = () => {
  router.push('/forgot-password');
};
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>💬 Chat App</h1>
          <p>Sign in to continue</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input
              id="username"
              v-model="username"
              type="text"
              placeholder="Enter your username"
              :disabled="isLoading"
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Enter your password"
              :disabled="isLoading"
              autocomplete="current-password"
            />
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <button type="submit" class="login-btn" :disabled="isLoading">
            <span v-if="!isLoading">Login</span>
            <span v-else>Logging in...</span>
          </button>
        </form>

        <div class="login-footer">
          <button @click="goToForgotPassword" class="forgot-password-link">
            Forgot Password?
          </button>
          
          <div class="register-prompt">
            Don't have an account?
            <button @click="goToRegister" class="register-link">
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-card {
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

.login-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.login-header h1 {
  margin: 0;
  font-size: 1.75rem;
  color: #333;
  margin-bottom: 0.25rem;
}

.login-header p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.login-form {
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

.login-btn {
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

.login-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-footer {
  text-align: center;
}

.forgot-password-link {
  background: none;
  border: none;
  color: #667eea;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: none;
  margin-bottom: 0.75rem;
  display: inline-block;
  padding: 0;
}

.forgot-password-link:hover {
  text-decoration: underline;
}

.register-prompt {
  margin-top: 0.875rem;
  padding-top: 0.875rem;
  border-top: 1px solid #e5e7eb;
  color: #666;
  font-size: 0.85rem;
}

.register-link {
  background: none;
  border: none;
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  margin-left: 0.25rem;
  padding: 0;
}

.register-link:hover {
  text-decoration: underline;
}
</style>
