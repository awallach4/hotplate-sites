import { getFirestoreError } from "@/plugins/errorHandler";
import type { PageConfig } from "@/types";
import { ref, type Ref } from "@vue/composition-api";
import type { FirestoreError } from "firebase/firestore/lite";
import { defineStore } from "pinia";
import { useSettings } from "./settings";

export const usePages = defineStore("pages", () => {
  const pageTitle = ref("Hotplate Console");
  const pages: Ref<PageConfig[]> = ref([]);

  const getPages = async () => {
    try {
      pages.value = [];
      const { firestore } = await import("@/plugins/firebase");
      const { collection, getDocs, orderBy, query } = await import(
        "firebase/firestore/lite"
      );
      const pageDocs = await getDocs(
        query(collection(firestore, "pages"), orderBy("index", "asc"))
      );
      pageDocs.forEach((page) => {
        const data = page.data() as PageConfig;
        pages.value.push(data);
      });
    } catch (error) {
      pages.value = [];
      throw getFirestoreError(error as FirestoreError);
    }
  };

  const viewPage = (path: string, name: string, notFound: boolean) => {
    const SettingsModule = useSettings();
    try {
      if (!notFound && name && path) {
        pageTitle.value = name;
      } else {
        pageTitle.value = "Error";
      }
      SettingsModule.applicationLoadingState = false;
    } catch (error) {
      SettingsModule.applicationLoadingState = false;
      throw getFirestoreError(error as FirestoreError);
    }
  };

  return {
    pageTitle,
    pages,
    getPages,
    viewPage
  };
});
