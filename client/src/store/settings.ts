import { getFirestoreError } from "@/plugins/errorHandler";
import {
  PermissionGroups,
  type SettingsSite,
  type SettingsSitePrivate
} from "@/types";
import { ref, type Ref } from "@vue/composition-api";
import type { FirestoreError } from "firebase/firestore/lite";
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
          calID: "",
          calView: PermissionGroups.UNSET,
          calURL: "",
          controlledAuth: true,
          defaultPage: "",
          email: PermissionGroups.UNSET,
          footerTxt: "",
          mailURL: "",
          useCalendar: false,
          useEmail: false
        };
      }
    } catch (error) {
      siteSettings.value = {
        calEdit: PermissionGroups.UNSET,
        calID: "",
        calView: PermissionGroups.UNSET,
        calURL: "",
        controlledAuth: true,
        defaultPage: "",
        email: PermissionGroups.UNSET,
        footerTxt: "",
        mailURL: "",
        useCalendar: false,
        useEmail: false
      };
      throw getFirestoreError(error as FirestoreError);
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
          useMeeting: false,
          meetLink: ""
        };
      }
    } catch (error) {
      sitePrivateSettings.value = {
        addresses: [],
        consoleURL: "",
        useMeeting: false,
        meetLink: ""
      };
      throw getFirestoreError(error as FirestoreError);
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
