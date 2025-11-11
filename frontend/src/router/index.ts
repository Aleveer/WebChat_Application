import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import ChatView from "../views/ChatView.vue";
import ForgotPasswordView from "../views/ForgotPasswordView.vue";
import ResetPasswordView from "../views/ResetPasswordView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/login",
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
    },
    {
      path: "/register",
      name: "register",
      component: RegisterView,
    },
    {
      path: "/forgot-password",
      name: "forgot-password",
      component: ForgotPasswordView,
    },
    {
      path: "/reset-password",
      name: "reset-password",
      component: ResetPasswordView,
    },
    {
      path: "/chat",
      name: "chat",
      component: ChatView,
      meta: { requiresAuth: true },
    },
  ],
});

// Navigation guard to check authentication
// TEMPORARILY DISABLED FOR TESTING - Uncomment to enable authentication
// router.beforeEach((to, from, next) => {
//   const token = localStorage.getItem('access_token')
//
//   if (to.meta.requiresAuth && !token) {
//     next('/login')
//   } else if (to.path === '/login' && token) {
//     next('/chat')
//   } else {
//     next()
//   }
// })

export default router;
