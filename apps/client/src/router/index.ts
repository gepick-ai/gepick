import { createRouter, createWebHistory } from "vue-router";

import type { RouteRecordRaw } from "vue-router";

export enum GepickRoute {
  Root = "Root",
  Login = "Login",
  Explore = "Explore",
  Divination = "Divination",
  Pricing = "Pricing",
}

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: GepickRoute.Root,
    redirect: { name: GepickRoute.Divination },
    component: () => import("@gepick/client/layout.vue"),
    props: {
      tabs: [
        { key: GepickRoute.Divination, title: '聊天' },
      ],
    },
    children: [
      {
        path: toLowerCase(GepickRoute.Divination),
        name: GepickRoute.Divination,
        component: () => import("@gepick/client/pages/divination/divination.vue"),
        redirect: '/divination/chat',
        props: {
          tabs: [
            { key: 'Chat', title: 'AI聊天' },
          ],
          hideWrapper: true,
        },
        children: [
          {
            path: 'chat',
            name: 'Chat',
            component: () => import("@gepick/client/pages/divination/divination/divination.vue"),
          },
        ],
      },
    ],
  },
  {
    path: toLowerCase(GepickRoute.Login, false),
    name: GepickRoute.Login,
    component: () => import("@gepick/client/pages/login/login.vue"),
  },
  {
    path: "/login/email",
    name: "EmailLogin",
    component: () => import("@gepick/client/pages/login/email-input.vue"),
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@gepick/client/pages/login/login.vue"),
  },

  {
    path: "/oauth/callback",
    name: "OAuthCallback",
    component: () => import("@gepick/client/pages/login/oauth-callback.vue"),
  },
  // ===========兜底逻辑==========
  {
    path: "/:catchAll(.*)",
    redirect: { name: GepickRoute.Root },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

export * from "./openTab";

function toLowerCase(str: string, hasParent: boolean = true): string {
  str = str.toLocaleLowerCase();
  return hasParent ? str : `/${str}`;
}
