<template>
  <div id="login-page">
    <v-card
      color="card"
      class="mx-auto my-6"
      max-width="400px"
      :loading="submitting ? 'secondary' : false"
    >
      <v-card-title class="cardtext--text">Log In</v-card-title>
      <v-card-text class="cardtext--text">
        <v-form ref="loginForm" :disabled="submitting" @submit.prevent="login">
          <v-text-field
            v-model="email"
            color="secondary"
            :rules="[fieldRequired, validEmail]"
            validate-on-blur
            dense
            label="Email Address"
            outlined
            type="email"
          />
          <v-text-field
            v-model="password"
            color="secondary"
            :rules="[fieldRequired]"
            dense
            validate-on-blur
            label="Password"
            outlined
            type="password"
          />
          <v-checkbox
            v-model="remember"
            color="secondary"
            class="mt-0"
            label="Remember Me"
          />
          <v-btn
            block
            color="secondary"
            class="sectext--text"
            type="submit"
            :disabled="submitting"
          >
            Log In
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { usePages } from "@/store/pages";
import { useUser } from "@/store/user";
import type { VFormOptions } from "@/types";
import { ref } from "@vue/composition-api";
import { fieldRequired, validEmail } from "@/plugins/formRules";
import { displayPageAlert } from "@/plugins/errorHandler";
import { pushRouter } from "@/plugins/routerStoreHelpers";
import type { AuthError } from "firebase/auth";

const PagesModule = usePages();
const email = ref("");
const password = ref("");
const remember = ref(false);
const submitting = ref(false);
const loginForm = ref({} as VFormOptions);

const login = async () => {
  submitting.value = true;
  const isValid = loginForm.value.validate();
  if (!isValid) {
    submitting.value = false;
    return;
  }
  try {
    const UserModule = useUser();
    await UserModule.loginWithEmail(
      email.value,
      password.value,
      remember.value
    );
    pushRouter("/");
  } catch (error) {
    const rawError = error as AuthError;
    if (rawError.code === "auth/wrong-password") {
      displayPageAlert("Your password is incorrect.");
    } else if (
      rawError.code === "auth/invalid-email" ||
      rawError.code === "auth/user-not-found"
    ) {
      displayPageAlert(
        "Your email address is invalid or your account was not found."
      );
    } else {
      displayPageAlert(rawError.message);
    }
    submitting.value = false;
    return;
  }
};

PagesModule.viewPage("/login", "Log In", false);
</script>
