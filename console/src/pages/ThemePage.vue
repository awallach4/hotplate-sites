<template>
  <div class="theme-editor">
    <v-card>
      <v-card-title class="cardtext--text">Site Theme Editor</v-card-title>
      <v-card-text class="cardtext--text">
        <v-row>
          <v-col>
            <v-btn
              color="secondary"
              class="sectext--text"
              block
              @click="setDefault('light')"
            >
              Default Light Theme
            </v-btn>
          </v-col>
          <v-col>
            <v-btn
              color="secondary"
              class="sectext--text"
              block
              @click="setDefault('dark')"
            >
              Default Dark Theme
            </v-btn>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-select
              v-model="selected"
              :items="items"
              filled
              label="Theme Color"
              color="secondary"
              item-color="secondary"
            />
          </v-col>
          <v-col>
            <v-select
              v-model="mode"
              :items="modes"
              filled
              width="100%"
              label="Mode"
              color="secondary"
              item-color="secondary"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <strong>Theme Color</strong>
            <v-color-picker
              v-if="themes[mode]"
              v-model="themes[mode][selected]"
              flat
              hide-mode-switch
              :show-swatches="selected !== null"
              :disabled="!selected"
              :width="$vuetify.breakpoint.name === 'xs' ? '280' : '450'"
              mode="hexa"
              class="mt-4"
            />
          </v-col>
          <v-col>
            <strong>Text Color</strong>
            <v-radio-group
              v-if="themes[mode]"
              v-model="themes[mode][textColors]"
              :disabled="!textColors"
            >
              <v-radio label="Black" value="#000000" color="secondary" />
              <v-radio label="White" value="#FFFFFF" color="secondary" />
            </v-radio-group>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { type VSelectValues, VThemeColors } from "@/types";
import { useSettings } from "@/store/settings";
import { usePages } from "@/store/pages";
import type {
  VuetifyThemes,
  VuetifyThemeVariant
} from "vuetify/types/services/theme";
import { computed, ref } from "@vue/composition-api";
import type { FirestoreError } from "firebase/firestore/lite";
import { displayPageAlert } from "@/plugins/errorHandler";

const items: VSelectValues[] = [
  {
    text: "Background Color",
    value: VThemeColors.BACKGROUND
  },
  {
    text: "Primary Color",
    value: VThemeColors.PRIMARY
  },
  {
    text: "Secondary Color",
    value: VThemeColors.SECONDARY
  },
  {
    text: "Card Color",
    value: VThemeColors.CARD
  },
  {
    text: "Link Color",
    value: VThemeColors.ANCHOR
  },
  {
    text: "Success Message Color",
    value: VThemeColors.SUCCESS
  },
  {
    text: "Info Message Color",
    value: VThemeColors.INFO
  },
  {
    text: "Warning Message Color",
    value: VThemeColors.WARNING
  },
  {
    text: "Error Message Color",
    value: VThemeColors.ERROR
  }
];
const modes = [
  {
    text: "Light",
    value: "light" as keyof VuetifyThemes
  },
  {
    text: "Dark",
    value: "dark" as keyof VuetifyThemes
  }
];

const themes = ref({
  dark: {} as VuetifyThemeVariant,
  light: {} as VuetifyThemeVariant
});
const selected = ref(VThemeColors.BACKGROUND);
const mode = ref("light" as keyof VuetifyThemes);

const textColors = computed(() => {
  const color = selected.value;
  switch (color) {
    case VThemeColors.ERROR:
      return VThemeColors.ERROR_TEXT;
    case VThemeColors.CARD:
      return VThemeColors.CARD_TEXT;
    case VThemeColors.WARNING:
      return VThemeColors.WARNING_TEXT;
    case VThemeColors.PRIMARY:
      return VThemeColors.PRIMARY_TEXT;
    case VThemeColors.SECONDARY:
      return VThemeColors.SECONDARY_TEXT;
    case VThemeColors.INFO:
      return VThemeColors.INFO_TEXT;
    case VThemeColors.BACKGROUND:
      return VThemeColors.BACKGROUND_TEXT;
    case VThemeColors.SUCCESS:
      return VThemeColors.SUCCESS_TEXT;
    default:
      return VThemeColors.BACKGROUND_TEXT;
  }
});

const save = async (
  callback: () => void,
  err = (e: FirestoreError) => {
    displayPageAlert(`An error occurred while saving: ${e.message}`);
  }
) => {
  try {
    const { firestore } = await import("@/plugins/firebase");
    const { doc, setDoc } = await import("firebase/firestore/lite");
    await setDoc(doc(firestore, "configuration/theme"), themes.value);
    callback();
  } catch (error) {
    err(error as FirestoreError);
  }
};

defineExpose({
  save
});

const setDefault = (theme: keyof VuetifyThemes) => {
  if (theme === "light") {
    themes.value.light = {
      error: "#FF5252",
      errtext: "#000000",
      card: "#FFFFFF",
      cardtext: "#000000",
      warning: "#FB8C00",
      warntext: "#000000",
      primary: "#66BB6A",
      pritext: "#000000",
      secondary: "#1976D2",
      sectext: "#FFFFFF",
      info: "#2196F3",
      infotext: "#000000",
      background: "#FFFFFF",
      bgtext: "#000000",
      anchor: "#1976D2",
      success: "#4CAF50",
      suctext: "#000000",
      accent: "#000000"
    } as VuetifyThemeVariant;
  } else if (theme === "dark") {
    themes.value.dark = {
      background: "#121212",
      bgtext: "#FFFFFF",
      error: "#FF5252",
      errtext: "#000000",
      warning: "#FB8C00",
      warntext: "#000000",
      info: "#2196F3",
      infotext: "#000000",
      anchor: "#42A5F5",
      success: "#4CAF50",
      suctext: "#000000",
      card: "#1E1E1E",
      cardtext: "#FFFFFF",
      secondary: "#FFCA28",
      sectext: "#000000",
      primary: "#1565C0",
      pritext: "#FFFFFF",
      accent: "#FFFFFF"
    } as VuetifyThemeVariant;
  }
};

const getThemes = async () => {
  try {
    const { firestore } = await import("@/plugins/firebase");
    const { doc, getDoc } = await import("firebase/firestore/lite");
    const themeDoc = await getDoc(doc(firestore, "configuration/theme"));
    const data = themeDoc.data();
    if (data) {
      themes.value.light = data.light;
      themes.value.dark = data.dark;
    } else {
      themes.value.light = {} as VuetifyThemeVariant;
      themes.value.dark = {} as VuetifyThemeVariant;
    }
  } catch (error) {
    const rawError = error as FirestoreError;
    displayPageAlert(
      `An error occurred while getting the themes: ${rawError.message}`
    );
  }
};

getThemes();
const SettingsModule = useSettings();
const PagesModule = usePages();
SettingsModule.canSave = true;
PagesModule.viewPage("/theme", "Customize Site Theme", false);
</script>
