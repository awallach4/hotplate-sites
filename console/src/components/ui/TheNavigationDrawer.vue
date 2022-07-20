<template>
  <div id="nav">
    <v-navigation-drawer
      v-if="isWebmaster"
      v-model="drawer"
      color="card lighten-1"
      app
    >
      <v-list nav>
        <v-list-group v-if="user" color="secondary">
          <template #activator>
            <v-list-item-avatar>
              <img
                v-if="user.photoURL"
                :src="user.photoURL"
                alt="User Avatar"
              />
              <img v-else src="/profile.png" alt="User Avatar" />
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>
                {{ user.displayName || "New User" }}
              </v-list-item-title>
            </v-list-item-content>
          </template>
          <v-list-item @click="logout">
            <v-list-item-title>Log Out</v-list-item-title>
          </v-list-item>
        </v-list-group>
        <v-divider />
        <v-list-item-group color="secondary">
          <v-subheader>Site Management</v-subheader>
          <v-list-item to="/">
            <v-list-item-title>Documentation</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="isAdmin" to="/users">
            <v-list-item-title>User Management</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="isAdmin" to="/settings">
            <v-list-item-title>Site Settings</v-list-item-title>
          </v-list-item>
          <v-list-item to="/theme">
            <v-list-item-title>Site Theme</v-list-item-title>
          </v-list-item>
          <v-list-group color="secondary">
            <template #activator>
              <v-list-item-title>Page Settings</v-list-item-title>
            </template>
            <v-text-field
              v-model="settings.footerTxt"
              filled
              dense
              label="Footer Text"
              color="secondary"
            >
              <template #append>
                <v-tooltip bottom>
                  <template #activator="{ on }">
                    <v-btn
                      aria-label="Add Copyright Symbol"
                      icon
                      v-on="on"
                      @click="addCopy"
                    >
                      <v-icon>mdi-copyright</v-icon>
                    </v-btn>
                  </template>
                  Add Copyright Symbol
                </v-tooltip>
              </template>
            </v-text-field>
            <v-select
              v-model="settings.defaultPage"
              :items="publicPages"
              filled
              dense
              label="Default Page"
              color="secondary"
              item-color="secondary"
            />
            <v-btn
              color="secondary"
              class="sectext--text mb-2"
              block
              @click="savePageSettings"
            >
              <v-icon left>mdi-check</v-icon> Save Page Settings
            </v-btn>
          </v-list-group>
          <v-divider />
          <v-subheader>Pages</v-subheader>
          <draggable
            v-model="pages"
            :disabled="pages.length < 2 || $route.name === 'BasePage'"
            ghost-class="elevation-10"
            style="width: 100%"
            handle=".handle"
            group="pages"
            :animation="200"
            @end="savePageOrder"
          >
            <v-list-item
              v-for="(page, index) in pages"
              :key="page.dbPath"
              :to="`/pages/${index}`"
            >
              <v-list-item-icon
                v-if="pages.length > 1 && $route.name !== 'BasePage'"
                class="handle"
              >
                <v-icon>mdi-drag-vertical</v-icon>
              </v-list-item-icon>
              <v-list-item-title>{{ page.name }}</v-list-item-title>
            </v-list-item>
          </draggable>
          <v-dialog v-model="modal" max-width="400px">
            <template #activator="{ on }">
              <v-btn
                color="secondary"
                class="sectext--text mt-2"
                block
                v-on="on"
              >
                <v-icon left>mdi-plus</v-icon> Add Page
              </v-btn>
            </template>
            <v-card color="card">
              <v-card-title class="cardtext--text">New Page</v-card-title>
              <v-card-text class="cardtext--text">
                <v-form
                  id="pageCreatorForm"
                  ref="pageCreatorForm"
                  @submit.prevent="createPage"
                >
                  <v-text-field
                    v-model="newPageName"
                    hint="The page name is also the URL of the page.  Once the page is created, it cannot be changed.  Ex. /home would come from 'Home'."
                    label="Page Name"
                    :rules="[
                      fieldRequired,
                      minLength(newPageName, 3, 'Min 3 characters.'),
                      maxLength(newPageName, 20, 'Max 20 characters.'),
                      notIncludes,
                      noSpace,
                      noTrail
                    ]"
                    filled
                    color="secondary"
                    validate-on-blur
                  />
                  <v-select
                    v-model="newPagePermissions"
                    label="Page Visibility"
                    :items="permissions"
                    hint="Only the users that meet these criteria will be able to view this page.  Other users will not be able to access the page or its data."
                    persistent-hint
                    filled
                    color="secondary"
                    item-color="secondary"
                    :rules="[fieldRequired]"
                  />
                </v-form>
              </v-card-text>
              <v-card-actions>
                <v-btn
                  text
                  class="cardtext--text ml-auto"
                  @click="modal = false"
                >
                  Cancel
                </v-btn>
                <v-btn
                  type="submit"
                  form="pageCreatorForm"
                  color="secondary"
                  class="sectext--text ml-2"
                >
                  Create Page
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app color="primary" elevate-on-scroll>
      <v-app-bar-nav-icon
        v-if="isWebmaster"
        color="pritext"
        @click.stop="drawer = !drawer"
      />
      <v-toolbar-title class="pritext--text">{{ pageTitle }}</v-toolbar-title>
      <v-progress-linear
        v-if="loading"
        color="secondary"
        indeterminate
        absolute
        bottom
      />
      <v-spacer />
      <v-tooltip v-if="isWebmaster && canSave" bottom>
        <template #activator="{ on }">
          <v-btn
            fab
            small
            color="secondary"
            aria-label="Save"
            class="ma-2 sectext--text"
            v-on="on"
            @click="emit('save')"
          >
            <v-icon>mdi-check</v-icon>
          </v-btn>
        </template>
        Save
      </v-tooltip>
      <v-tooltip bottom>
        <template #activator="{ on }">
          <v-btn
            icon
            class="pritext--text"
            aria-label="Toggle Dark Mode"
            v-on="on"
            @click="toggleDarkMode"
          >
            <v-icon>mdi-invert-colors</v-icon>
          </v-btn>
        </template>
        {{ $vuetify.theme.dark ? "Light Mode" : "Dark Mode" }}
      </v-tooltip>
    </v-app-bar>
  </div>
</template>

<script lang="ts" setup>
import draggable from "vuedraggable";
import { usePages } from "@/store/pages";
import { useUser } from "@/store/user";
import {
  PermissionGroups,
  type PageConfig,
  type VFormOptions,
  type VSelectValues
} from "@/types";
import { computed, ref, watch } from "@vue/composition-api";
import {
  fieldRequired,
  minLength,
  maxLength,
  notIncludes,
  noSpace,
  noTrail
} from "@/plugins/formRules";
import type { FirestoreError } from "firebase/firestore/lite";
import { isWebmaster, isAdmin, user, permissions } from "@/plugins/authHandler";
import {
  pages,
  settings,
  pageTitle,
  loading,
  pushRouter,
  canSave
} from "@/plugins/routerStoreHelpers";
import {
  displayPageAlert,
  getAuthError,
  getFirestoreError
} from "@/plugins/errorHandler";
import { useVuetify } from "@/plugins/contextInject";
import type { AuthError } from "firebase/auth";

interface Emits {
  (e: "save"): void;
}

const emit = defineEmits<Emits>();

const drawer = ref(false);
const modal = ref(false);
const newPageName = ref("");
const newPagePermissions = ref(PermissionGroups.USERS);
const pageCreatorForm = ref({} as VFormOptions);
const UserModule = useUser();
const vuetify = useVuetify();

const newDbPath = computed(() => {
  const lc = newPageName.value.toLowerCase();
  const path = `/${lc.replace(/ /g, "-")}`;
  return path;
});

watch(modal, (newValue) => {
  if (!newValue) {
    newPageName.value = "";
    newPagePermissions.value = PermissionGroups.USERS;
    pageCreatorForm.value.resetValidation();
  }
});

const publicPages = computed(() => {
  const options: VSelectValues[] = [];
  pages.value.forEach((page) => {
    if (page.permissions === PermissionGroups.PUBLIC) {
      const route: VSelectValues = {
        text: page.name,
        value: page.dbPath
      };
      options.push(route);
    }
  });
  options.push({
    text: "Log In",
    value: "/login"
  });
  return options;
});

const addCopy = () => {
  settings.value.footerTxt = `${settings.value.footerTxt}\u00A9`;
};

const savePageSettings = async () => {
  try {
    const { firestore } = await import("@/plugins/firebase");
    const { doc, setDoc } = await import("firebase/firestore/lite");
    await setDoc(
      doc(firestore, "configuration/settings"),
      {
        defaultPage: settings.value.defaultPage,
        footerTxt: settings.value.footerTxt
      },
      {
        merge: true
      }
    );

    displayPageAlert("The page settings have been saved.");
  } catch (error) {
    displayPageAlert(
      `An error occurred while saving the site settings: ${getFirestoreError(
        error as FirestoreError
      )}`
    );
  }
};

const savePageOrder = async () => {
  const { firestore } = await import("@/plugins/firebase");
  const { doc, setDoc } = await import("firebase/firestore/lite");
  pages.value.forEach((page) => {
    page.index = pages.value.indexOf(page);
    setDoc(doc(firestore, `pages${page.dbPath}`), page, { merge: true });
  });
  displayPageAlert("The new page order has been saved.");
};

const toggleDarkMode = () => {
  vuetify.theme.dark = !vuetify.theme.dark;
  localStorage.setItem("darkMode", `${vuetify.theme.dark}`);
};

const logout = async () => {
  try {
    await UserModule.logout();
  } catch (error) {
    displayPageAlert(getAuthError(error as AuthError));
  }
  pushRouter("/login");
};

const createPage = async () => {
  const isValid = pageCreatorForm.value.validate();
  if (!isValid) {
    return;
  }
  const { generateString } = await import("@/plugins/stringGenerator");
  const page: PageConfig = {
    name: newPageName.value,
    permissions: newPagePermissions.value,
    dbPath: newDbPath.value,
    index: pages.value.length,
    id: generateString(20)
  };

  try {
    const { firestore } = await import("@/plugins/firebase");
    const { collection, doc, getDocs, query, where, setDoc } = await import(
      "firebase/firestore/lite"
    );
    const existingPages = await getDocs(
      query(
        collection(firestore, "pages"),
        where("dbPath", "==", newDbPath.value)
      )
    );
    if (
      existingPages.size > 0 ||
      newDbPath.value === "/login" ||
      newDbPath.value === "/log-in" ||
      newDbPath.value === "/register" ||
      newDbPath.value === "/profile" ||
      newDbPath.value === "/error" ||
      newDbPath.value === "login" ||
      newDbPath.value === "log-in" ||
      newDbPath.value === "register" ||
      newDbPath.value === "profile" ||
      newDbPath.value === "error"
    ) {
      displayPageAlert("The page name is already taken!");
      return;
    }
    const PagesModule = usePages();
    pages.value.push(page);
    PagesModule.pages = pages.value;
    await setDoc(doc(firestore, `pages${newDbPath.value}`), page);
    modal.value = false;
  } catch (error) {
    displayPageAlert(
      `An error occurred while creating the page: ${getFirestoreError(
        error as FirestoreError
      )}`
    );
  }
};
</script>
