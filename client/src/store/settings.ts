import { getFirestoreError } from "@/plugins/errorHandler";
import {
  PermissionGroups,
  type SettingsSite,
  type SettingsSitePrivate
} from "@/types";
import { ref, type Ref } from "vue";
import type { FirestoreError } from "firebase/firestore/lite";
import { defineStore } from "pinia";

export const useSettings = defineStore("settings", () => {
  const applicationLoadingState = ref(false);
  const siteSettings: Ref<SettingsSite> = ref({
    calEdit: PermissionGroups.UNSET,
    calID: "",
    calView: PermissionGroups.UNSET,
    calURL: "",
    controlledAuth: false,
    defaultPage: "/login",
    email: PermissionGroups.UNSET,
    footerTxt: "",
    mailURL: "",
    useCalendar: false,
    useEmail: false
  });
  const sitePrivateSettings: Ref<SettingsSitePrivate> = ref({
    addresses: [],
    consoleURL: "",
    useMeeting: false,
    meetLink: ""
  });
  const hasFetched = ref(false);

  const getSettings = async () => {
    try {
      const { firestore } = await import("@/plugins/firebase");
      const { doc, getDoc } = await import("firebase/firestore/lite");
      const settings = await getDoc(doc(firestore, "configuration/settings"));
      if (settings.exists()) {
        const data = settings.data() as SettingsSite;
        siteSettings.value = Object.assign({}, siteSettings.value, data);
      }
      hasFetched.value = true;
    } catch (error) {
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
        sitePrivateSettings.value = Object.assign(
          {},
          sitePrivateSettings.value,
          data
        );
      }
    } catch (error) {
      throw getFirestoreError(error as FirestoreError);
    }
  };

  return {
    applicationLoadingState,
    siteSettings,
    sitePrivateSettings,
    hasFetched,
    getSettings,
    getSitePrivateSettings
  };
});
