<template>
  <div id="unauth-page">
    <v-alert type="error" class="errtext--text">
      <template #prepend>
        <v-icon color="errtext" class="mr-3">mdi-alert-octagon-outline</v-icon>
      </template>
      Oops! It looks like you are unauthorized to view this page. Please sign in
      with an authorized account.
    </v-alert>
    <v-btn color="secondary" class="sectext--text" @click="logout"
      >Log Out</v-btn
    >
  </div>
</template>

<script lang="ts" setup>
import { displayPageAlert, getAuthError } from "@/plugins/errorHandler";
import { pushRouter } from "@/plugins/routerStoreHelpers";
import { usePages } from "@/store/pages";
import { useUser } from "@/store/user";
import type { AuthError } from "firebase/auth";

const logout = async () => {
  try {
    const UserModule = useUser();
    await UserModule.logout();
  } catch (error) {
    displayPageAlert(getAuthError(error as AuthError));
  }
  pushRouter("/login");
};

const PagesModule = usePages();
PagesModule.viewPage("/unauthorized", "Unauthorized", false);
</script>
