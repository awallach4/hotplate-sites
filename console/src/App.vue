<template>
  <v-app id="app">
    <the-navigation-drawer @save="save" />
    <v-main>
      <v-container class="pa-6">
        <v-fade-transition mode="out-in">
          <router-view ref="currentPage" :key="$route.fullPath" />
        </v-fade-transition>
      </v-container>
    </v-main>
    <the-footer />
    <v-page-alert v-model="pageAlertState" :message="pageAlertMessage" />
  </v-app>
</template>

<script lang="ts" setup>
import {
  onBeforeUnmount,
  onMounted,
  ref,
  type Ref
} from "@vue/composition-api";
import { useUser } from "./store/user";
import {
  pageAlertState,
  pageAlertMessage,
  displayPageAlert
} from "./plugins/errorHandler";
import { initializeLocalTheme, getThemes } from "./plugins/themeHandler";
import { canSave } from "./plugins/routerStoreHelpers";

const currentPage: Ref<{ save: (callback: () => void) => void }> = ref(
  {} as { save: (callback: () => void) => void }
);

const save = () => {
  currentPage.value.save(() => {
    displayPageAlert("The new content has been saved.");
  });
};

onMounted(() => {
  document.addEventListener("keydown", (event) => {
    if (
      canSave.value &&
      (event.ctrlKey || event.metaKey) &&
      event.key === "s"
    ) {
      event.preventDefault();
      save();
    } else if ((event.ctrlKey || event.metaKey) && event.key === "s") {
      event.preventDefault();
    }
  });
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", (event) => {
    if (
      canSave.value &&
      (event.ctrlKey || event.metaKey) &&
      event.key === "s"
    ) {
      event.preventDefault();
      save();
    } else if ((event.ctrlKey || event.metaKey) && event.key === "s") {
      event.preventDefault();
    }
  });
});

try {
  const UserModule = useUser();
  UserModule.createAuthListener();
  initializeLocalTheme();
  getThemes();
} catch (error) {
  displayPageAlert(error as string);
}
</script>

<style lang="scss">
#app {
  overflow-x: hidden;
  .v-card__title,
  .v-card__text {
    word-break: break-word !important;
    -ms-word-break: break-word !important;
    overflow-wrap: anywhere;
  }
  .v-card,
  .v-sheet:not(.v-list, .v-snack__wrapper) {
    background-color: var(--v-card-base);
  }
  .v-main {
    background-color: var(--v-background-base);
  }

  .spacer {
    height: 24px;
  }

  .row {
    margin: 0 -12px;
  }

  .v-snack {
    height: unset;
  }

  .v-snack__wrapper {
    min-width: 300px;
  }

  .v-navigation-drawer {
    height: 100% !important;
  }

  .handle {
    cursor: grab;
  }

  .sortable-chosen .handle {
    cursor: grabbing !important;
  }

  li p {
    margin: 0;
  }

  mark {
    background-color: #ffee58;
  }

  .theme--light .tiptap th {
    background-color: var(--v-card-darken1);
  }

  .theme--dark .tiptap th {
    background-color: var(--v-card-lighten1);
  }

  table.tiptap {
    border-collapse: collapse;
    table-layout: fixed;
    overflow: hidden;
    width: 100%;
    margin: 0;
  }

  .tiptap {
    td,
    th {
      border: solid 2px var(--v-cardtext-base);
      padding: 3px 5px;
      vertical-align: top;
      box-sizing: border-box;
      position: relative;
      min-width: 1em;

      > * {
        margin-bottom: 0 !important;
      }
    }

    th {
      font-weight: bold;
      text-align: left;
    }

    .selectedCell:after {
      z-index: 2;
      position: absolute;
      content: "";
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      background-color: rgba(51, 144, 255, 0.4);
      pointer-events: none;
    }
  }

  .theme--dark blockquote {
    margin: 1em 0 !important;
    border-left: 3px solid var(--v-card-lighten1);
    padding-left: 0.8rem;
  }

  .theme--light blockquote {
    margin: 1em 0 !important;
    border-left: 3px solid var(--v-card-darken1);
    padding-left: 0.8rem;
  }

  .theme--light hr:not(.v-divider) {
    border: none;
    height: 1px;
    background-color: var(--v-card-darken3);
  }

  .theme--dark hr:not(.v-divider) {
    border: none;
    height: 1px;
    background-color: var(--v-card-lighten3);
  }
}

body {
  background-color: var(--v-background-base);
}
</style>
