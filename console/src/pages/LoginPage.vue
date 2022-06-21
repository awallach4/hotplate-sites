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
          <v-dialog v-model="resetPasswordDialog" persistent max-width="400px">
            <template #activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                block
                color="secondary"
                class="sectext--text"
                :disabled="submitting"
                v-on="on"
              >
                Forgot Password?
              </v-btn>
            </template>
            <v-card color="card">
              <v-card-title class="cardtext--text">Reset Password</v-card-title>
              <v-card-text class="cardtext--text">
                <v-form
                  ref="resetForm"
                  :disabled="submitting"
                  @submit.prevent="resetPassword"
                >
                  <p>
                    Enter the email address to send a password reset email to.
                    If an account with that address exists, a password reset
                    email will be sent.
                  </p>
                  <v-text-field
                    v-model="resetEmail"
                    color="secondary"
                    label="Email Address"
                    :rules="[fieldRequired, validEmail]"
                    validate-on-blur
                    outlined
                    dense
                    type="email"
                  />
                  <v-btn
                    block
                    color="error"
                    class="errtext--text"
                    :disabled="submitting"
                    @click="resetPasswordDialog = false"
                  >
                    Cancel
                  </v-btn>
                  <v-btn
                    type="submit"
                    block
                    color="secondary"
                    class="sectext--text mt-6"
                    :disabled="submitting"
                  >
                    Reset Password
                  </v-btn>
                </v-form>
              </v-card-text>
            </v-card>
          </v-dialog>
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
import { ref, watch } from "@vue/composition-api";
import { fieldRequired, validEmail } from "@/plugins/formRules";
import { displayPageAlert } from "@/plugins/errorHandler";
import { pushRouter } from "@/plugins/routerStoreHelpers";
import type { AuthError } from "firebase/auth";

const PagesModule = usePages();
const email = ref("");
const password = ref("");
const remember = ref(false);
const resetPasswordDialog = ref(false);
const resetEmail = ref("");
const submitting = ref(false);
const loginForm = ref({} as VFormOptions);
const resetForm = ref({} as VFormOptions);

watch(resetPasswordDialog, (newValue) => {
  if (!newValue) {
    resetForm.value.reset();
  }
});

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

const resetPassword = async () => {
  submitting.value = true;
  const isValid = resetForm.value.validate();
  if (!isValid) {
    submitting.value = false;
    return;
  }
  try {
    const UserModule = useUser();
    await UserModule.sendPasswordReset(resetEmail.value);
    submitting.value = false;
    resetPasswordDialog.value = false;
  } catch (error) {
    const rawError = error as AuthError;
    if (
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
  }
};

PagesModule.viewPage("/login", "Log In", false);
</script>
