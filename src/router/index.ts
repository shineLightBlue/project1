/**
 * 路由表与登录守卫：根布局为 index（侧栏+子路由 all/member/unclassified/recycle/settings），
 * 另有 /login、/payment/success、/home 及测试路由；beforeEach 未登录且非 /login 时重定向到 /login。
 */
import { createRouter, createWebHistory } from 'vue-router'
import index from '../views/index/index.vue'
import { useLoginStore } from '@/stores/login.ts'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'index',
      component: index,
      children: [
        {
          path: '',
          name: 'index2',
          component: () => import('../views/allFiles/index.vue'),
        },
        {
          path: 'member',
          name: 'member',
          component: () => import('../views/member/index.vue'),
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('../views/settings/index.vue'),
          redirect: { name: 'settingsProfile' },
          children: [
            {
              path: 'profile',
              name: 'settingsProfile',
              component: () => import('../views/settings/profile.vue'),
            },
            {
              path: 'account-security',
              name: 'settingsAccountSecurity',
              component: () => import('../views/settings/account-security.vue'),
            },
            {
              path: 'general',
              name: 'settingsGeneral',
              component: () => import('../views/settings/general.vue'),
            },
            {
              path: 'membership',
              name: 'settingsMembership',
              component: () => import('../views/settings/membership.vue'),
            },
            {
              path: 'help-feedback',
              name: 'settingsHelpFeedback',
              component: () => import('../views/settings/help-feedback.vue'),
            },
            {
              path: 'about',
              name: 'settingsAbout',
              component: () => import('../views/settings/about.vue'),
            },
          ],
        },
      ],
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/login/index.vue'),
    },
    /** 分享落地页（与后端 changfeng.share + /share/{id} 对齐，无需登录） */
    {
      path: '/share/:shareId',
      name: 'shareView',
      component: () => import('../views/share/index.vue'),
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('@/views/settings/ResetPassword.vue'), // 根据实际路径调整
    },
    {
      path: '/payment/success',
      name: 'paymentSuccess',
      component: () => import('../views/payment/success.vue'),
    },
    {
      path: '/payment/failure',
      name: 'paymentFailure',
      component: () => import('../views/payment/failure.vue'),
    },
    {
      path: '/oauth/callback',
      name: 'oauthCallback',
      component: () => import('../views/oauth/callback.vue'),
    },
    // 测试路由2
    {
      path: '/test2',
      name: 'test2',
      component: () => import('../views/test2/index.vue'),
    },
    // 测试路由3
    {
      path: '/test3',
      name: 'test3',
      component: () => import('../views/test3/index.vue'),
    },

    // 测试路由6
    {
      path: '/test6',
      name: 'test6',
      component: () => import('../views/test6/index.vue'),
    },
  ],
})

const whiteArr = ['login', 'oauthCallback', 'shareView']
// 登录守卫：无 token 且目标不是白名单路由时重定向到 /login
router.beforeEach((to, from) => {
  const loginStore = useLoginStore()
  if (!whiteArr.includes(String(to.name)) && !loginStore.loginData.token) {
    return '/login'
  }
})

export default router
