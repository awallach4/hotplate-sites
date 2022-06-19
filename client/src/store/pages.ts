import type { PagesSpecialPageConfig } from "@/types";
import { ref, type Ref } from "@vue/composition-api";
import { defineStore } from "pinia";
import { useSettings } from "./settings";

export const usePages = defineStore("pages", () => {
  const pageTitle = ref("Hotplate Client");
  const specialPages: Ref<PagesSpecialPageConfig[]> = ref([]);

  const getSpecialPages = async () => {
    try {
      specialPages.value = [];
      const { firestore } = await import("@/plugins/firebase");
      const { collection, getDocs, orderBy, query } = await import(
        "firebase/firestore/lite"
      );
      const pages = await getDocs(
        query(collection(firestore, "pages"), orderBy("index", "asc"))
      );
      pages.forEach((page) => {
        const data = page.data() as PagesSpecialPageConfig;
        specialPages.value.push(data);
      });
    } catch (error) {
      specialPages.value = [];
      throw error;
    }
  };

  const viewPage = async (path: string, name: string, notFound: boolean) => {
    const SettingsModule = useSettings();
    const { analytics } = await import("@/plugins/firebase");
    const { logEvent } = await import("firebase/analytics");
    try {
      if (!notFound && name && path) {
        pageTitle.value = name;
        document.title = `${name} - Hotplate Client`;
        logEvent(analytics, "page_view", {
          page_location: location.href,
          page_path: path,
          page_title: name
        });
      } else {
        pageTitle.value = "Error";
        document.title = "Error - Hotplate Client";
        logEvent(analytics, "exception", {
          description: "Page not found.",
          fatal: false
        });
      }
      SettingsModule.applicationLoadingState = false;
    } catch (error) {
      SettingsModule.applicationLoadingState = false;
      throw error;
    }
  };

  return {
    pageTitle,
    specialPages,
    getSpecialPages,
    viewPage
  };
});
