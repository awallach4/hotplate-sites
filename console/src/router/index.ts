import VueRouter, { type RouteConfig } from "vue-router";
import { useSettings } from "@/store/settings";
import { usePages } from "@/store/pages";
import { useUser } from "@/store/user";
import { AuthLevels, AuthStates } from "@/types";

const router = new VueRouter({
  mode: "history",
  base: import.meta.env.BASE_URL,
  routes: <RouteConfig[]>[
    {
      path: "/spec/:index",
      name: "SpecialPage",
      component: () => import("@/pages/SpecialPage.vue"),
      meta: {
        needsAdmin: false
      }
    },
    {
      path: "/",
      name: "DocumentationPage",
      component: () => import("@/pages/DocumentationPage.vue"),
      meta: {
        needsAdmin: false
      }
    },
    {
      path: "/settings",
      name: "SettingsPage",
      component: () => import("@/pages/SiteSettings.vue"),
      meta: {
        needsAdmin: false
      }
    },
    {
      path: "/users",
      name: "UserManagementPage",
      component: () => import("@/pages/UserManagementPage.vue"),
      meta: {
        needsAdmin: true
      }
    },
    {
      path: "/theme",
      name: "ThemePage",
      component: () => import("@/pages/ThemePage.vue"),
      meta: {
        needsAdmin: false
      }
    },
    {
      path: "/login",
      name: "LoginPage",
      component: () => import("@/pages/LoginPage.vue"),
      meta: {
        needsAdmin: false
      }
    },
    {
      path: "/unauthorized",
      name: "UnauthorizedPage",
      component: () => import("@/pages/UnauthorizedPage.vue"),
      meta: {
        needsAdmin: false
      }
    },
    {
      path: "/*",
      name: "ErrorPage",
      component: () => import("@/pages/ErrorPage.vue"),
      meta: {
        needsAdmin: false
      }
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return {
        x: 0,
        y: 0
      };
    }
  }
});

router.beforeEach(async (to, from, next) => {
  const SettingsModule = useSettings();
  const PagesModule = usePages();
  const UserModule = useUser();
  SettingsModule.canSave = false;
  PagesModule.pageTitle = "Loading...";
  SettingsModule.applicationLoadingState = true;

  if (Object.keys(SettingsModule.siteSettings).length === 0) {
    await SettingsModule.getSettings();
  }
  if (PagesModule.specialPages.length === 0) {
    await PagesModule.getSpecialPages();
  }

  const goingToLogin = to.path === "/login";
  const goingToSettings = to.path === "/settings";
  const goingToUnauthorized = to.path === "/unauthorized";

  const user = await UserModule.getInitialUser();
  const authLevel = UserModule.authLevel;
  let isAuthorized = false;
  if (authLevel === AuthLevels.ADMIN) {
    isAuthorized = true;
  } else if (authLevel === AuthLevels.WEBMASTER) {
    isAuthorized = true;
  } else if (authLevel === AuthLevels.USER) {
    isAuthorized = true;
  } else {
    isAuthorized = false;
  }
  let isLoggedIn;
  if (UserModule.authState === AuthStates.LOGGED_IN) {
    isLoggedIn = true;
  } else {
    isLoggedIn = false;
  }
  if (user && isAuthorized) {
    if (Object.keys(SettingsModule.sitePrivateSettings).length === 0) {
      SettingsModule.getSitePrivateSettings();
    }
  }

  let isWebmaster;
  if (authLevel === AuthLevels.WEBMASTER) {
    isWebmaster = true;
  } else if (authLevel === AuthLevels.ADMIN) {
    isWebmaster = true;
  } else {
    isWebmaster = false;
  }
  let isAdmin = false;
  if (authLevel === AuthLevels.ADMIN) {
    isAdmin = true;
  } else {
    isAdmin = false;
  }

  if (to.meta && to.meta.needsAdmin) {
    if (isAdmin && isLoggedIn && isAuthorized) {
      next();
    } else if (!isLoggedIn) {
      next("/login");
    } else {
      next("/unauthorized");
    }
  } else if (goingToSettings) {
    if (isWebmaster && isLoggedIn && isAuthorized) {
      next();
    } else if (!isLoggedIn) {
      next("/login");
    } else {
      next("/unauthorized");
    }
  } else if (goingToUnauthorized) {
    if (!isLoggedIn) {
      next("/login");
    } else {
      next();
    }
  } else if (goingToLogin) {
    if (isLoggedIn) {
      next("/");
    } else {
      next();
    }
  } else {
    if (isWebmaster && isLoggedIn && isAuthorized) {
      next();
    } else if (!isWebmaster || (!isAuthorized && isLoggedIn)) {
      next("/unauthorized");
    } else if (!isLoggedIn) {
      next("/login");
    } else {
      next("/error");
    }
  }
});

export default router;
