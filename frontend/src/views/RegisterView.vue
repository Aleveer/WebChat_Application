<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('');
const phoneNumber = ref('');
const password = ref('');
const confirmPassword = ref('');
const email = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const handleRegister = async () => {
  errorMessage.value = '';
  
  if (!username.value.trim() || !phoneNumber.value.trim() || !password.value.trim()) {
    errorMessage.value = 'Please fill in all fields';
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match';
    return;
  }

  if (password.value.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters';
    return;
  }

  isLoading.value = true;

  try {
    const requestBody: any = {
      username: username.value,
      phone: phoneNumber.value,
      password: password.value,
    };
    
    // Only include email if it has a value
    if (email.value && email.value.trim()) {
      requestBody.email = email.value;
    }
    
    const response = await fetch('http://localhost:3000/api/v1/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    // Registration successful, redirect to login
    alert('Registration successful! Please login.');
    router.push('/login');
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Registration failed. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const goToLogin = () => {
  router.push('/login');
};
</script>

<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <h1>💬 Chat App</h1>
          <p>Create your account</p>
        </div>

        <form @submit.prevent="handleRegister" class="register-form">
          <div class="form-group">
            <label for="username">Username</label>
            <input
              id="username"
              v-model="username"
              type="text"
              placeholder="Choose a username"
              :disabled="isLoading"
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <label for="phone">Phone Number</label>
            <input
              id="phone"
              v-model="phoneNumber"
              type="tel"
              placeholder="Enter your phone number"
              :disabled="isLoading"
              autocomplete="tel"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Create a password (min 6 characters)"
              :disabled="isLoading"
              autocomplete="new-password"
            />
          </div>

          <div class="form-group">
            <label for="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              v-model="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              :disabled="isLoading"
              autocomplete="new-password"
            />
          </div>

          <div class="form-group">
            <label for="email-address">Email (Optional)</label>
            <input
              id="email-address"
              v-model="email"
              type="email"
              placeholder="Enter your email address"
              :disabled="isLoading"
              autocomplete="email"
            />
          </div>
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <button type="submit" class="register-btn" :disabled="isLoading">
            <span v-if="!isLoading">Register</span>
            <span v-else>Creating account...</span>
          </button>
        </form>

        <div class="register-footer">
          <div class="login-prompt">
            Already have an account?
            <button @click="goToLogin" class="login-link">
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.register-container {
  width: 100%;
  max-width: 400px;
}

.register-card {
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

.register-header {
  text-align: center;
  margin-bottom: 1.25rem;
}

.register-header h1 {
  margin: 0;
  font-size: 1.75rem;
  color: #333;
  margin-bottom: 0.25rem;
}

.register-header p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.register-form {
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 0.875rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.35rem;
  color: #333;
  font-weight: 500;
  font-size: 0.875rem;
}

.form-group input {
  width: 100%;
  padding: 0.6rem 0.875rem;
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

.register-btn {
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
  margin-top: 0.25rem;
}

.register-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.register-btn:active:not(:disabled) {
  transform: translateY(0);
}

.register-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.register-footer {
  text-align: center;
}

.login-prompt {
  padding-top: 0.875rem;
  border-top: 1px solid #e5e7eb;
  color: #666;
  font-size: 0.85rem;
}

.login-link {
  background: none;
  border: none;
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  margin-left: 0.25rem;
  padding: 0;
}

.login-link:hover {
  text-decoration: underline;
}
</style>
