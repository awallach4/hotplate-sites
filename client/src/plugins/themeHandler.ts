import type { FirestoreError } from "firebase/firestore/lite";
import { useVuetify } from "./contextInject";

/**
 * Gets Vuetify themes and mode from localStorage if they exist.
 * @function initializeLocalTheme
 * @returns Nothing.
 */
export const initializeLocalTheme = () => {
  const vuetify = useVuetify();
  const darkMode = localStorage.getItem("darkMode");
  if (darkMode) {
    vuetify.theme.dark = darkMode === "true";
  } else {
    matchMedia("(prefers-color-scheme: dark)").addEventListener(
      "change",
      (e) => {
        vuetify.theme.dark = e.matches;
      }
    );
  }

  const storedTheme = localStorage.getItem("hotplateTheme");
  if (storedTheme) {
    vuetify.theme.themes.light = JSON.parse(storedTheme).light;
    vuetify.theme.themes.dark = JSON.parse(storedTheme).dark;
  }
};

/**
 * Gets Vuetify themes from Firestore.
 * @async
 * @function getThemes
 * @returns Nothing.
 */
export const getThemes = async () => {
  try {
    const vuetify = useVuetify();
    const { firestore } = await import("@/plugins/firebase");
    const { doc, getDoc } = await import("firebase/firestore/lite");
    const themes = await getDoc(doc(firestore, "configuration/theme"));
    const data = themes.data();
    if (data) {
      localStorage.setItem("hotplateTheme", JSON.stringify(data));
      vuetify.theme.themes.light = data.light;
      vuetify.theme.themes.dark = data.dark;
    }
  } catch (error) {
    const rawError = error as FirestoreError;
    throw rawError.message;
  }
};
