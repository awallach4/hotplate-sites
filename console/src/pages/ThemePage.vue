<template>
  <div class="theme-editor">
    <v-row>
      <v-col cols="12">
        <v-expansion-panels>
          <v-expansion-panel>
            <v-expansion-panel-header class="cardtext--text text-h6"
              >Theme Guidelines - Please Read</v-expansion-panel-header
            >
            <v-expansion-panel-content class="cardtext--text text-body-2">
              This page allows you to customize the appearance of your site. You
              can change the following theme colors and the color of the text
              when each color is applied:
              <ul>
                <li>Background: Anything that is directly on the page.</li>
                <li>
                  Primary: The color of the app bar, headings, and calendar
                  buttons.
                </li>
                <li>
                  Secondary: The color of buttons, form elements, and the
                  selected page in the navigation drawer.
                </li>
                <li>
                  Card: The color of all cards (elevated boxes) on the page.
                  This color is also used to derive the footer color and the
                  color for table headings and the rich text editor toolbar.
                </li>
                <li>Link: The color of any hyperlinks on the page.</li>
                <li>Success: The color of any success alert messages.</li>
                <li>Info: The color of any info alert messages.</li>
                <li>Warning: The color of any warning alert messages.</li>
                <li>
                  Error: The color of any error alert messages and any dangerous
                  action buttons.
                </li>
              </ul>
              When choosing your colors, keep in mind the following
              accessibility guidelines:
              <ul>
                <li>
                  The contrast ratio for small text should be at least 4.5:1.
                </li>
                <li>
                  The contrast ratio for large text should be at least 3:1.
                </li>
                <li>
                  Dark mode should be dark! A dark background must be used and
                  minimal color should be used in dark mode, and any color
                  should be easily visible on a dark background.
                </li>
                <li>
                  Light mode should be light, but neon colors should be avoided.
                </li>
                <li>
                  Links should be easily differentiable from regular text.
                </li>
                <li>Buttons should be easily visible.</li>
                <li>
                  Use either pure black or pure white for text colors unless you
                  have a good reason.
                </li>
              </ul>
              <strong
                >The Short Version? Your site should be easy on the eyes and be
                easily readable! If you're having trouble with this, you can
                always restore the default light and dark themes.</strong
              >
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title class="cardtext--text">Theme Colors</v-card-title>
          <v-card-text class="cardtext--text">
            <v-select
              v-model="mode"
              :items="modes"
              filled
              label="Mode"
              color="secondary"
              item-color="secondary"
            >
              <template #append-outer>
                <v-tooltip bottom>
                  <template #activator="{ on, attrs }">
                    <v-btn
                      v-bind="attrs"
                      :aria-label="`Restore Default ${mode
                        .slice(0, 1)
                        .toUpperCase()}${mode.slice(1)} Theme`"
                      icon
                      v-on="on"
                      @click="setDefault(mode)"
                    >
                      <v-icon>mdi-restore</v-icon>
                    </v-btn>
                  </template>
                  Restore Default
                  {{ `${mode.slice(0, 1).toUpperCase()}${mode.slice(1)}` }}
                  Theme
                </v-tooltip>
              </template>
            </v-select>
            <v-select
              v-model="selected"
              :items="items"
              filled
              label="Theme Color"
              color="secondary"
              item-color="secondary"
            />
            <v-dialog
              v-model="previewing"
              fullscreen
              hide-overlay
              transition="dialog-bottom-transition"
            >
              <template #activator="{ on, attrs }">
                <v-btn
                  v-bind="attrs"
                  color="secondary"
                  class="sectext--text"
                  block
                  v-on="on"
                >
                  Preview Changes
                </v-btn>
              </template>
              <v-card
                :color="themes[isDark].background"
                :style="{ color: themes[isDark].bgtext }"
                tile
              >
                <v-toolbar :color="themes[isDark].primary">
                  <v-btn
                    aria-label="Close Preview"
                    icon
                    :color="themes[isDark].pritext"
                    @click="previewing = false"
                  >
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                  <v-toolbar-title :style="{ color: themes[isDark].pritext }"
                    >Theme Preview</v-toolbar-title
                  >
                  <v-spacer />
                  <v-tooltip bottom>
                    <template #activator="{ on }">
                      <v-btn
                        icon
                        :color="themes[isDark].pritext"
                        aria-label="Preview Dark Mode"
                        v-on="on"
                        @click="previewDark = !previewDark"
                      >
                        <v-icon>mdi-invert-colors</v-icon>
                      </v-btn>
                    </template>
                    {{ previewDark ? "Light Mode" : "Dark Mode" }}
                  </v-tooltip>
                </v-toolbar>
                <v-container class="pa-6">
                  <v-card
                    class="pa-5 mb-5 header"
                    :color="themes[isDark].primary"
                    style="height: calc(50vh - 94px)"
                  >
                    <v-overlay absolute z-index="1" opacity="0.6">
                      <v-row justify="center" align="center" class="ma-0">
                        <v-col class="text-center" cols="12">
                          <h1 class="display-2 font-weight-thin mb-4">
                            A Heading
                          </h1>
                          <h2 class="subheading">A Subheading</h2>
                        </v-col>
                      </v-row>
                    </v-overlay>
                  </v-card>
                  <v-alert
                    type="success"
                    :style="{ color: themes[isDark].suctext }"
                  >
                    <template #prepend>
                      <v-icon class="mr-3" :color="themes[isDark].suctext"
                        >mdi-check-circle-outline</v-icon
                      >
                    </template>
                    I'm a success message!
                  </v-alert>
                  <v-alert
                    type="info"
                    :style="{ color: themes[isDark].infotext }"
                  >
                    <template #prepend>
                      <v-icon class="mr-3" :color="themes[isDark].infotext"
                        >mdi-information-outline</v-icon
                      >
                    </template>
                    I'm an info message!
                  </v-alert>
                  <v-alert
                    type="warning"
                    :style="{ color: themes[isDark].warntext }"
                  >
                    <template #prepend>
                      <v-icon class="mr-3" :color="themes[isDark].warntext"
                        >mdi-alert-outline</v-icon
                      >
                    </template>
                    I'm a warning message!
                  </v-alert>
                  <v-alert
                    type="error"
                    :style="{ color: themes[isDark].errtext }"
                  >
                    <template #prepend>
                      <v-icon class="mr-3" :color="themes[isDark].errtext"
                        >mdi-alert-octagon-outline</v-icon
                      >
                    </template>
                    I'm an error message!
                  </v-alert>
                  <v-row>
                    <v-col cols="12" sm="6">
                      <v-card :color="themes[isDark].card">
                        <v-card-title
                          :style="{ color: themes[isDark].cardtext }"
                          >Lorem ipsum dolor sit amet.</v-card-title
                        >
                        <v-card-text :style="{ color: themes[isDark].cardtext }"
                          >Lorem ipsum dolor sit amet, consectetur adipiscing
                          elit. In ut vestibulum justo. Donec placerat congue
                          lobortis. Donec in sem ut diam aliquam bibendum vel in
                          tortor. Nullam in mauris eget odio ornare euismod quis
                          ac sem. Mauris pulvinar vitae turpis vitae tincidunt.
                          Etiam et odio vitae sapien aliquet hendrerit sit amet
                          vitae quam. Donec viverra, dui non ullamcorper tempus,
                          lorem erat vulputate mi, nec consequat dui nibh quis
                          odio. Sed vitae metus id nunc pellentesque fermentum.
                          Donec cursus molestie diam, nec mollis eros maximus
                          eget. Donec mauris augue, dictum eget justo a, laoreet
                          tempus quam. Curabitur molestie, lectus sit amet
                          scelerisque iaculis, enim nulla tincidunt erat, sed
                          rutrum magna felis ac mi. Nam pharetra risus a dui
                          dignissim, et placerat nulla tempus. Aliquam lobortis
                          lacinia commodo. Proin pulvinar faucibus libero. Donec
                          pulvinar, lectus tempus efficitur vestibulum, nulla
                          arcu accumsan est, in cursus mauris ante volutpat
                          libero. Proin accumsan mattis enim, eu lobortis mi
                          eleifend at.</v-card-text
                        >
                        <v-card-actions>
                          <v-btn
                            block
                            :color="themes[isDark].secondary"
                            :style="{ color: themes[isDark].sectext }"
                            >Button</v-btn
                          >
                        </v-card-actions>
                      </v-card>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-card flat :color="themes[isDark].background">
                        <v-card-title :style="{ color: themes[isDark].bgtext }"
                          >Lorem ipsum dolor sit amet.</v-card-title
                        >
                        <v-card-text :style="{ color: themes[isDark].bgtext }">
                          Lorem ipsum dolor sit amet, consectetur adipiscing
                          elit. In ut vestibulum justo. Donec placerat congue
                          lobortis. Donec in sem ut diam aliquam bibendum vel in
                          tortor. Nullam in mauris eget odio ornare euismod quis
                          ac sem. Mauris pulvinar vitae turpis vitae tincidunt.
                          Etiam et odio vitae sapien aliquet hendrerit sit amet
                          vitae quam. Donec viverra, dui non ullamcorper tempus,
                          lorem erat
                          <a
                            href="https://google.com"
                            target="_blank"
                            rel="noreferrer noopener nofollow"
                            :style="{ color: linkColor }"
                            >vulputate</a
                          >
                          mi, nec consequat dui nibh quis odio. Sed vitae metus
                          id nunc pellentesque fermentum. Donec cursus molestie
                          diam, nec mollis eros maximus eget. Donec mauris
                          augue, dictum eget justo a, laoreet tempus quam.
                          Curabitur molestie, lectus sit amet scelerisque
                          iaculis, enim nulla tincidunt erat, sed rutrum magna
                          felis ac mi. Nam pharetra risus a dui dignissim, et
                          placerat nulla tempus. Aliquam lobortis lacinia
                          commodo. Proin pulvinar faucibus libero. Donec
                          pulvinar, lectus tempus efficitur vestibulum, nulla
                          arcu accumsan est, in cursus mauris ante volutpat
                          libero. Proin accumsan mattis enim, eu lobortis mi
                          eleifend at.
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card>
            </v-dialog>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4" sm="6">
        <v-card>
          <v-card-title class="cardtext--text"
            >{{ editorTitle }} Color</v-card-title
          >
          <v-card-text class="cardtext--text">
            <v-color-picker
              v-if="themes[mode]"
              v-model="themes[mode][selected]"
              flat
              hide-mode-switch
              :show-swatches="selected !== null"
              :disabled="!selected"
              mode="hexa"
              width="230"
              class="mx-auto"
            />
          </v-card-text>
          <v-card-actions class="cardtext--text">
            <v-btn
              v-if="themes[mode]"
              block
              color="secondary"
              class="sectext--text"
              @click="setSingleDefault(mode, selected)"
              >Use Default</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col cols="12" md="4" sm="6">
        <v-card>
          <v-card-title class="cardtext--text"
            >{{ editorTitle }} Text Color</v-card-title
          >
          <v-card-text class="cardtext--text">
            <v-color-picker
              v-if="themes[mode]"
              v-model="themes[mode][textColors]"
              flat
              hide-mode-switch
              :show-swatches="selected !== null"
              :disabled="!textColors"
              mode="hexa"
              width="230"
              class="mx-auto"
            />
          </v-card-text>
          <v-card-actions class="cardtext--text">
            <v-btn
              v-if="themes[mode]"
              :disabled="!textColors"
              block
              color="secondary"
              class="sectext--text"
              @click="setSingleDefault(mode, textColors)"
              >Use Default</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
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
import { computed, ref, watch } from "vue";
import type { FirestoreError } from "firebase/firestore/lite";
import { displayPageAlert, getFirestoreError } from "@/plugins/errorHandler";
import { useVuetify } from "@/plugins/contextInject";

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
const defaultLight = () => {
  return {
    error: "#FF5252",
    errtext: "#000000",
    card: "#FFFFFF",
    cardtext: "#000000",
    warning: "#FB8C00",
    warntext: "#000000",
    primary: "#3949AB",
    pritext: "#FFFFFF",
    secondary: "#1976D2",
    sectext: "#FFFFFF",
    info: "#2196F3",
    infotext: "#000000",
    background: "#FFFFFF",
    bgtext: "#000000",
    anchor: "#0D47A1",
    success: "#4CAF50",
    suctext: "#000000",
    accent: "#000000"
  } as VuetifyThemeVariant;
};

const defaultDark = () => {
  return {
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
    secondary: "#64B5F6",
    sectext: "#000000",
    primary: "#424242",
    pritext: "#FFFFFF",
    accent: "#FFFFFF"
  } as VuetifyThemeVariant;
};

const themes = ref({
  dark: {} as VuetifyThemeVariant,
  light: {} as VuetifyThemeVariant
});
const selected = ref(VThemeColors.BACKGROUND);
const mode = ref("light" as keyof VuetifyThemes);
const previewing = ref(false);
const vuetify = useVuetify();
const previewDark = ref(vuetify.theme.dark);

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
      return "";
  }
});

const isDark = computed(() => {
  if (previewDark.value) {
    return "dark";
  } else {
    return "light";
  }
});

const linkColor = computed(() => {
  return themes.value[isDark.value].anchor as string;
});

const editorTitle = computed(() => {
  switch (selected.value) {
    case "background":
      return "Background";
    case "primary":
      return "Primary";
    case "secondary":
      return "Secondary";
    case "card":
      return "Card";
    case "anchor":
      return "Link";
    case "success":
      return "Success Message";
    case "info":
      return "Info Message";
    case "warning":
      return "Warning Message";
    case "error":
      return "Error Message";
    default:
      return "";
  }
});

watch(previewing, (newValue) => {
  if (!newValue) {
    previewDark.value = vuetify.theme.dark;
  }
});

const save = async (
  callback: () => void,
  err = (e: FirestoreError) => {
    displayPageAlert(`An error occurred while saving: ${getFirestoreError(e)}`);
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
    themes.value.light = defaultLight();
  } else if (theme === "dark") {
    themes.value.dark = defaultDark();
  }
};

const setSingleDefault = (
  theme: keyof VuetifyThemes,
  color: keyof VuetifyThemeVariant
) => {
  if (theme === "light") {
    themes.value.light[color] = defaultLight()[color];
  } else if (theme === "dark") {
    themes.value.dark[color] = defaultDark()[color];
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
    displayPageAlert(
      `An error occurred while getting the themes: ${getFirestoreError(
        error as FirestoreError
      )}`
    );
  }
};

getThemes();
const SettingsModule = useSettings();
const PagesModule = usePages();
SettingsModule.canSave = true;
PagesModule.viewPage("/theme", "Site Theme", false);
</script>
