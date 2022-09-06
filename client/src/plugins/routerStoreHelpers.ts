import router from "@/router";
import { usePages } from "@/store/pages";
import { useSettings } from "@/store/settings";
import { computed } from "vue";

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

export const settings = computed(() => {
  const SettingsModule = useSettings();
  return SettingsModule.siteSettings;
});

export const privateSettings = computed(() => {
  const SettingsModule = useSettings();
  return SettingsModule.sitePrivateSettings;
});

export const pages = computed(() => {
  const PagesModule = usePages();
  return PagesModule.pages;
});

export const loading = computed(() => {
  const SettingsModule = useSettings();
  return SettingsModule.applicationLoadingState;
});

export const pageTitle = computed(() => {
  const PagesModule = usePages();
  return PagesModule.pageTitle;
});
