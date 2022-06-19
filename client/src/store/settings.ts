import {
  PermissionGroups,
  type SettingsSite,
  type SettingsSitePrivate
} from "@/types";
import { ref, type Ref } from "@vue/composition-api";
import { defineStore } from "pinia";

export const useSettings = defineStore("settings", () => {
  const applicationLoadingState = ref(false);
  const siteSettings: Ref<SettingsSite> = ref({} as SettingsSite);
  const sitePrivateSettings: Ref<SettingsSitePrivate> = ref(
    {} as SettingsSitePrivate
  );

  const getSettings = async () => {
    try {
      const { firestore } = await import("@/plugins/firebase");
      const { doc, getDoc } = await import("firebase/firestore/lite");
      const settings = await getDoc(doc(firestore, "configuration/settings"));
      if (settings.exists()) {
        const data = settings.data() as SettingsSite;
        siteSettings.value = data;
      } else {
        siteSettings.value = {
          calEdit: PermissionGroups.UNSET,
          calView: PermissionGroups.UNSET,
          calURL: "",
          defaultPage: "",
          email: PermissionGroups.UNSET,
          footerTxt: "",
          mailURL: ""
        };
      }
    } catch (error) {
      siteSettings.value = {
        calEdit: PermissionGroups.UNSET,
        calView: PermissionGroups.UNSET,
        calURL: "",
        defaultPage: "",
        email: PermissionGroups.UNSET,
        footerTxt: "",
        mailURL: ""
      };
      throw error;
    }
  };

  const getSitePrivateSettings = async () => {
    try {
      const { firestore } = await import("@/plugins/firebase");
      const { doc, getDoc } = await import("firebase/firestore/lite");
      const settings = await getDoc(
        doc(firestore, "configuration/priv-settings")
      );
      if (settings.exists()) {
        const data = settings.data() as SettingsSitePrivate;
        sitePrivateSettings.value = data;
      } else {
        sitePrivateSettings.value = {
          addresses: [],
          consoleURL: "",
          linkHidden: false,
          meetLink: ""
        };
      }
    } catch (error) {
      sitePrivateSettings.value = {
        addresses: [],
        consoleURL: "",
        linkHidden: false,
        meetLink: ""
      };
      throw error;
    }
  };

  return {
    applicationLoadingState,
    siteSettings,
    sitePrivateSettings,
    getSettings,
    getSitePrivateSettings
  };
});
