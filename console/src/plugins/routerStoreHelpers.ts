import router from "@/router";
import { usePages } from "@/store/pages";
import { useSettings } from "@/store/settings";
import type {
  PagesSpecialPageConfig,
  SettingsSite,
  SettingsSitePrivate
} from "@/types";
import { computed } from "@vue/composition-api";

/**
 * Does the same thing as $router.push() but catches all navigation failure errors.
 * @function pushRouter
 * @param to The route path to navigate to.
 * @returns Nothing.
 */
export const pushRouter = (to: string) => {
  router.push(to).catch(async (error) => {
    const {
      default: { isNavigationFailure, NavigationFailureType }
    } = await import("vue-router");
    if (isNavigationFailure(error, NavigationFailureType.redirected)) {
      return;
    }
  });
};

export const settings = computed({
  get: () => {
    const SettingsModule = useSettings();
    return SettingsModule.siteSettings;
  },
  set: (settings: SettingsSite) => {
    const SettingsModule = useSettings();
    SettingsModule.siteSettings = settings;
  }
});

export const privateSettings = computed({
  get: () => {
    const SettingsModule = useSettings();
    return SettingsModule.sitePrivateSettings;
  },
  set: (settings: SettingsSitePrivate) => {
    const SettingsModule = useSettings();
    SettingsModule.sitePrivateSettings = settings;
  }
});

export const specialPages = computed({
  get: () => {
    const PagesModule = usePages();
    return PagesModule.specialPages;
  },
  set: (pages: PagesSpecialPageConfig[]) => {
    const PagesModule = usePages();
    PagesModule.specialPages = pages;
  }
});

export const loading = computed(() => {
  const SettingsModule = useSettings();
  return SettingsModule.applicationLoadingState;
});

export const pageTitle = computed(() => {
  const PagesModule = usePages();
  return PagesModule.pageTitle;
});

export const canSave = computed(() => {
  const SettingsModule = useSettings();
  return SettingsModule.canSave;
});
