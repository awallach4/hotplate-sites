import VueRouter from "vue-router";
import { useSettings } from "@/store/settings";
import { usePages } from "@/store/pages";
import { useUser } from "@/store/user";
import {
  AuthLevels,
  AuthStates,
  PermissionGroups,
  type PagesSpecialPageConfig
} from "@/types";

const router = new VueRouter({
  mode: "history",
  base: import.meta.env.BASE_URL,
  routes: [
    {
      path: "/login",
      name: "LoginPage",
      component: () => import("@/pages/LoginPage.vue")
    },
    {
      path: "/profile",
      name: "ProfilePage",
      component: () => import("@/pages/ProfilePage.vue")
    },
    {
      path: "/error",
      name: "ErrorPage",
      component: () => import("@/pages/ErrorPage.vue")
    },
    {
      path: "/:SpecialPage",
      name: "SpecialPage",
      component: () => import("@/pages/SpecialPage.vue")
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
  PagesModule.pageTitle = "Loading...";
  SettingsModule.applicationLoadingState = true;
  if (Object.keys(SettingsModule.siteSettings).length === 0) {
    await SettingsModule.getSettings();
  }
  if (PagesModule.specialPages.length === 0) {
    await PagesModule.getSpecialPages();
  }

  const user = await UserModule.getInitialUser();
  const authLevel = UserModule.authLevel;
  let isAuthorized;
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

  if (to.name === "SpecialPage") {
    const pages: PagesSpecialPageConfig[] = PagesModule.specialPages;
    const thispage = pages.findIndex((item) => {
      return item.dbPath === `/${to.params.SpecialPage}`;
    });
    if (pages[thispage]) {
      const pagePerms = pages[thispage].permissions;
      switch (pagePerms) {
        case PermissionGroups.PUBLIC: {
          next();
          break;
        }
        case PermissionGroups.USERS: {
          if (isLoggedIn && isAuthorized) {
            next();
          } else if (isLoggedIn) {
            next("/error");
          } else {
            next("/login");
          }
          break;
        }
        case PermissionGroups.WEBMASTERS: {
          if (isLoggedIn && isAuthorized && isWebmaster) {
            next();
          } else if (isLoggedIn) {
            next("/error");
          } else {
            next("/login");
          }
          break;
        }
        default:
          next("/error");
      }
    } else {
      next("/error");
    }
  } else {
    if (to.path === "/login") {
      if (isLoggedIn) {
        next("/profile");
      } else {
        next();
      }
    } else if (to.path === "/profile") {
      if (!isLoggedIn) {
        next("/login");
      } else {
        next();
      }
    } else if (to.path === "/error") {
      next();
    } else if (to.path === "/") {
      if (SettingsModule.siteSettings.defaultPage) {
        if (SettingsModule.siteSettings.defaultPage === "/login") {
          if (isLoggedIn) {
            next("/profile");
          } else {
            next(SettingsModule.siteSettings.defaultPage);
          }
        } else {
          next(SettingsModule.siteSettings.defaultPage);
        }
      } else {
        if (isLoggedIn) {
          next("/profile");
        } else {
          next("/login");
        }
      }
    } else {
      next("/error");
    }
  }
});

export default router;
