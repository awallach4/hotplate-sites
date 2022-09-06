<template>
  <div id="register-page">
    <v-card
      color="card"
      class="mx-auto my-6"
      max-width="400px"
      :loading="submitting ? 'secondary' : false"
    >
      <v-card-title class="cardtext--text">Create Account</v-card-title>
      <v-card-text class="cardtext--text">
        <v-alert
          v-if="settings.controlledAuth"
          type="warning"
          class="warntext--text mb-6"
        >
          <template #prepend>
            <v-icon class="mr-3" color="warntext">mdi-alert-outline</v-icon>
          </template>
          Only users who have been invited by an administrator will be able to
          create an account here.</v-alert
        >
        <v-form
          ref="newAccountForm"
          :disabled="submitting"
          @submit.prevent="register"
        >
          <v-text-field
            v-model="displayName"
            color="secondary"
            :rules="[fieldRequired]"
            validate-on-blur
            dense
            label="Username"
            outlined
            autocomplete="username"
          />
          <v-text-field
            v-model="email"
            color="secondary"
            :rules="[fieldRequired, validEmail]"
            validate-on-blur
            dense
            label="Email Address"
            outlined
            type="email"
            autocomplete="email"
          />
          <v-file-input
            v-model="fileInput"
            prepend-icon=""
            prepend-inner-icon="mdi-image"
            accept="image/png, image/jpg"
            outlined
            dense
            color="secondary"
            label="Upload Profile Photo (optional)"
          />
          <v-text-field
            v-model="password"
            color="secondary"
            :rules="[
              fieldRequired,
              minLength(
                password,
                8,
                'Your password must be at least 8 characters long.'
              ),
              includes
            ]"
            dense
            validate-on-blur
            label="Password"
            outlined
            type="password"
            autocomplete="new-password"
          />
          <v-text-field
            v-model="confirmPassword"
            color="secondary"
            :rules="[fieldRequired, matchStrings(confirmPassword, password)]"
            dense
            validate-on-blur
            label="Confirm Password"
            outlined
            type="password"
            autocomplete="new-password"
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
            Register
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
import {
  fieldRequired,
  includes,
  matchStrings,
  minLength,
  validEmail
} from "@/plugins/formRules";
import { ref, type Ref } from "vue";
import {
  displayPageAlert,
  getAuthError,
  getFirestoreError,
  getStorageError
} from "@/plugins/errorHandler";
import { pushRouter, settings } from "@/plugins/routerStoreHelpers";
import type { AuthError } from "firebase/auth";
import type { FirestoreError } from "firebase/firestore/lite";
import type { StorageError } from "firebase/storage";

const PagesModule = usePages();
const displayName = ref("");
const email = ref("");
const fileInput: Ref<File | null> = ref(null);
const password = ref("");
const confirmPassword = ref("");
const remember = ref(false);
const submitting = ref(false);
const newAccountForm = ref({} as VFormOptions);

const register = async () => {
  submitting.value = true;
  const isValid = newAccountForm.value.validate();
  if (!isValid) {
    submitting.value = false;
    return;
  }
  try {
    const UserModule = useUser();
    await UserModule.createAccount(
      displayName.value,
      email.value,
      password.value,
      remember.value,
      fileInput.value
    );
    pushRouter("/profile");
  } catch (error) {
    const authError = getAuthError(error as AuthError);
    const firestoreError = getFirestoreError(error as FirestoreError);
    const storageError = getStorageError(error as StorageError);
    if (authError.includes("/") && storageError.includes("/")) {
      displayPageAlert(
        `An error occurred while creating your account: ${firestoreError}`
      );
    } else if (authError.includes("/") && !storageError.includes("/")) {
      displayPageAlert(
        `An error occurred while creating your account: ${storageError}`
      );
    } else {
      displayPageAlert(
        `An error occurred while creating your account: ${authError}`
      );
    }
    submitting.value = false;
  }
};

PagesModule.viewPage("/register", "Register", false);
</script>
