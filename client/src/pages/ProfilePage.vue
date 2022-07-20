<template>
  <div v-if="user" id="profile">
    <page-header head="My Account" />
    <v-spacer />
    <v-alert v-if="!user.emailVerified" type="info" class="infotext--text mb-6">
      <template #prepend>
        <v-icon class="mr-3" color="infotext">mdi-information-outline</v-icon>
      </template>
      Welcome to {{ companyName }}, {{ displayName || "New User" }}! Please
      click the button to sign out and verify your email address. You will not
      be able to view any private pages or edit your profile until your email is
      verified.
      <v-spacer />
      <v-btn outlined color="infotext" @click="verifyUserEmail"
        >Verify Email</v-btn
      >
    </v-alert>
    <v-alert
      v-if="!isAuthorized && user.emailVerified"
      type="error"
      class="errtext--text mb-6"
    >
      <template #prepend>
        <v-icon class="mr-3" color="errtext">mdi-alert-octagon-outline</v-icon>
      </template>
      We're sorry, but it looks like you are not an authorized user. Please
      delete your account and have the site administrator create a new one for
      you.
    </v-alert>
    <v-row>
      <v-col cols="12" sm="6">
        <v-card color="card">
          <v-card-title class="cardtext--text">My Profile</v-card-title>
          <v-card-text class="cardtext--text">
            <v-profile-photo
              class="ma-3 mt-0 float-right"
              :image-path="photoURL"
              :size="50"
            />
            <template v-if="!editingProfile">
              <p>Name: {{ displayName }}</p>
              <p>Email Address: {{ email }}</p>
              <v-btn
                type="button"
                block
                color="secondary"
                class="sectext--text"
                :disabled="!isAuthorized"
                @click="editProfile"
              >
                Edit Profile
              </v-btn>
            </template>
            <template v-else>
              <v-form
                id="editProfileForm"
                ref="editProfileForm"
                :disabled="submitting"
                @submit.prevent="updateProfile"
              >
                <v-text-field
                  v-model="displayName"
                  label="Name"
                  outlined
                  dense
                  color="secondary"
                  :rules="[fieldRequired]"
                  validate-on-blur
                />
                <v-text-field
                  v-model="email"
                  type="email"
                  label="Email Address"
                  outlined
                  dense
                  color="secondary"
                  :rules="[fieldRequired, validEmail]"
                  validate-on-blur
                />
                <v-text-field
                  v-if="emailChange"
                  v-model="emailChangePassword"
                  type="password"
                  label="Password"
                  outlined
                  dense
                  color="secondary"
                  persistent-hint
                  hint="Your password is required to change your email."
                  :rules="[fieldRequired]"
                  validate-on-blur
                />
                <v-file-input
                  v-model="fileInput"
                  prepend-icon=""
                  prepend-inner-icon="mdi-image"
                  append-outer-icon="mdi-delete"
                  accept="image/png, image/jpg"
                  outlined
                  dense
                  color="secondary"
                  label="Upload Profile Photo"
                  @click:append-outer="deleteProfilePhoto"
                />
              </v-form>
            </template>
          </v-card-text>
          <v-card-actions v-if="editingProfile">
            <v-btn
              type="button"
              color="error"
              class="errtext--text ml-auto"
              :disabled="submitting"
              @click="cancelProfileUpdate"
            >
              Cancel
            </v-btn>
            <v-btn
              type="submit"
              form="editProfileForm"
              color="secondary"
              class="sectext--text"
              :disabled="submitting"
            >
              Save
            </v-btn>
          </v-card-actions>
          <v-divider />
          <v-expansion-panels>
            <v-expansion-panel class="card">
              <v-expansion-panel-header class="cardtext--text">
                <h3>Delete Account</h3>
              </v-expansion-panel-header>
              <v-expansion-panel-content class="cardtext--text" align="center">
                <v-alert type="error" class="errtext--text mb-6">
                  <template #prepend>
                    <v-icon class="mr-3" color="errtext"
                      >mdi-alert-octagon-outline</v-icon
                    >
                  </template>
                  WARNING! THIS CANNOT BE UNDONE!
                </v-alert>
                <v-text-field
                  v-model="deleteAccountPassword"
                  outlined
                  dense
                  type="password"
                  color="error"
                  label="Password"
                  :disabled="submitting"
                />
                <v-btn
                  type="button"
                  block
                  color="error"
                  class="errtext--text"
                  :disabled="deleteAccountPassword.length < 8 || submitting"
                  @click="deleteAccount"
                >
                  Delete Account
                </v-btn>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6">
        <v-card color="card">
          <v-card-title class="cardtext--text">Account Security</v-card-title>
          <v-card-text class="cardtext--text">
            <p>
              Keeping your account secure is important! Change your password
              below whenever you suspect any unauthorized activity.
            </p>
            <v-form
              ref="changePasswordForm"
              :disabled="!isAuthorized || submitting"
              @submit.prevent="changePassword"
            >
              <v-text-field
                v-model="oldPassword"
                outlined
                dense
                type="password"
                color="secondary"
                :rules="[fieldRequired]"
                label="Old Password"
                validate-on-blur
              />
              <v-text-field
                v-model="newPassword"
                outlined
                dense
                type="password"
                color="secondary"
                :rules="[
                  fieldRequired,
                  minLength(
                    newPassword,
                    8,
                    'Your password must be at least 8 characters long.'
                  ),
                  includes
                ]"
                label="New Password"
                validate-on-blur
                autocomplete="new-password"
              />
              <v-text-field
                v-model="confirmNewPassword"
                outlined
                dense
                type="password"
                color="secondary"
                :rules="[
                  fieldRequired,
                  matchStrings(confirmNewPassword, newPassword)
                ]"
                label="Confirm Password"
                validate-on-blur
                autocomplete="new-password"
              />
              <v-btn
                block
                color="secondary"
                class="sectext--text"
                type="submit"
                :disabled="
                  !oldPassword ||
                  !newPassword ||
                  !confirmNewPassword ||
                  submitting
                "
              >
                Change Password
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts" setup>
import { AuthLevels, type UserData, type VFormOptions } from "@/types";
import { useUser } from "@/store/user";
import { usePages } from "@/store/pages";
import { computed, ref, type Ref } from "@vue/composition-api";
import { authLevel, user, isAuthorized } from "@/plugins/authHandler";
import {
  fieldRequired,
  validEmail,
  minLength,
  matchStrings,
  includes
} from "@/plugins/formRules";
import {
  displayPageAlert,
  getAuthError,
  getFirestoreError
} from "@/plugins/errorHandler";
import { deleteFile, uploadFile } from "@/plugins/firebaseStorage";
import { pushRouter } from "@/plugins/routerStoreHelpers";
import type { AuthError } from "firebase/auth";
import { companyName } from "@/CLIENT_CONFIG";
import type { FirestoreError } from "firebase/firestore/lite";

const PagesModule = usePages();
const displayName = ref("");
const email = ref("");
const photoURL = ref("");
const oldPassword = ref("");
const newPassword = ref("");
const confirmNewPassword = ref("");
const emailChangePassword = ref("");
const deleteAccountPassword = ref("");
const fileInput: Ref<File | null> = ref(null);
const editingProfile = ref(false);
const submitting = ref(false);
const changePasswordForm = ref({} as VFormOptions);
const editProfileForm = ref({} as VFormOptions);

const emailChange = computed(() => {
  return user.value.email !== email.value;
});

const getUser = () => {
  if (user.value.displayName) {
    displayName.value = user.value.displayName;
  }
  if (user.value.email) {
    email.value = user.value.email;
  }
  if (user.value.photoURL) {
    photoURL.value = user.value.photoURL;
  }
};

const changePassword = async () => {
  const isValid = changePasswordForm.value.validate();
  if (!user.value.emailVerified) {
    displayPageAlert(
      "Please verify your email address before changing your password."
    );
    return;
  }
  if (isValid && user.value.email) {
    submitting.value = true;
    try {
      const UserModule = useUser();
      await UserModule.changePassword(
        user.value.email,
        oldPassword.value,
        newPassword.value
      );
      changePasswordForm.value.reset();
      submitting.value = false;
      displayPageAlert("Password change successful.");
    } catch (error) {
      displayPageAlert(getAuthError(error as AuthError));
      submitting.value = false;
    }
  }
};

const deleteAccount = async () => {
  if (authLevel.value === AuthLevels.ADMIN) {
    displayPageAlert(
      "In order to protect this site, administrators cannot delete their own accounts."
    );
    deleteAccountPassword.value = "";
    return;
  }
  if (user.value.email) {
    if (
      confirm("You are about to delete your account.  Do you wish to proceed?")
    ) {
      submitting.value = true;
      try {
        const UserModule = useUser();
        await UserModule.deleteCurrentUser(
          email.value,
          deleteAccountPassword.value
        );
        displayPageAlert("Your account has been deleted.");
        submitting.value = false;
        pushRouter("/");
      } catch (error) {
        displayPageAlert(getAuthError(error as AuthError));
        submitting.value = false;
      }
    } else {
      displayPageAlert("Your account has not been deleted.");
      deleteAccountPassword.value = "";
      submitting.value = false;
    }
  }
};

const editProfile = () => {
  if (!user.value.emailVerified) {
    displayPageAlert(
      "Please verify your email address before editing your profile."
    );
    return;
  }
  editingProfile.value = true;
  emailChangePassword.value = "";
  fileInput.value = null;
};

const deleteProfilePhoto = async () => {
  if (photoURL.value) {
    if (confirm("Are you sure you want to delete this image?")) {
      try {
        await deleteFile(photoURL.value);
      } catch (error) {
        displayPageAlert(
          `An error occurred while deleting the image: ${error}`
        );
      }
      try {
        photoURL.value = "";
        const newData = {} as UserData;
        newData.photoURL = "";
        const UserModule = useUser();
        await UserModule.editProfile(newData);
      } catch (error) {
        const authError = getAuthError(error as AuthError);
        const firestoreError = getFirestoreError(error as FirestoreError);
        if (authError.includes("/")) {
          displayPageAlert(
            `An error occurred while deleting the image: ${firestoreError}`
          );
        } else {
          displayPageAlert(
            `An error occurred while deleting the image: ${authError}`
          );
        }
      }
    }
  } else {
    displayPageAlert("No image is uploaded.");
  }
};

const cancelProfileUpdate = () => {
  getUser();
  editingProfile.value = false;
};

const updateProfile = async () => {
  const isValid = editProfileForm.value.validate();
  if (!isValid) {
    return;
  }
  if (!user.value.emailVerified) {
    displayPageAlert(
      "Please verify your email address before editing your profile."
    );
    return;
  }
  submitting.value = true;
  if (user.value.email) {
    if (emailChange.value) {
      try {
        const UserModule = useUser();
        await UserModule.changeEmail(
          user.value.email,
          emailChangePassword.value,
          email.value
        );
      } catch (error) {
        const authError = getAuthError(error as AuthError);
        const firestoreError = getFirestoreError(error as FirestoreError);
        if (authError.includes("/")) {
          displayPageAlert(
            `An error occurred while changing your email address: ${firestoreError}`
          );
        } else {
          displayPageAlert(
            `An error occurred while changing your email address: ${authError}`
          );
        }
        submitting.value = false;
        return;
      }
    }
    if (fileInput.value) {
      try {
        photoURL.value = await uploadFile(
          `profile-photos/${user.value.uid}`,
          fileInput.value
        );
      } catch (error) {
        displayPageAlert(error as string);
      }
    }
    try {
      const newData = {} as UserData;

      if (displayName.value !== undefined) {
        newData.displayName = displayName.value;
      }

      if (photoURL.value !== undefined) {
        newData.photoURL = photoURL.value;
      }

      const UserModule = useUser();
      await UserModule.editProfile(newData);
      submitting.value = false;
      editingProfile.value = false;
    } catch (error) {
      const authError = getAuthError(error as AuthError);
      const firestoreError = getFirestoreError(error as FirestoreError);
      if (authError.includes("/")) {
        displayPageAlert(
          `An error occurred while updating your profile: ${firestoreError}`
        );
      } else {
        displayPageAlert(
          `An error occurred while updating your profile: ${authError}`
        );
      }
      submitting.value = false;
    }
  }
};

const verifyUserEmail = async () => {
  try {
    const UserModule = useUser();
    await UserModule.verifyEmail();
    alert(
      "Please follow the instructions that were sent to your email.  Once your email is verified, sign back in."
    );
    pushRouter("/");
  } catch (error) {
    displayPageAlert(
      `An error occurred while sending the verification email: ${getAuthError(
        error as AuthError
      )}`
    );
  }
};

getUser();
PagesModule.viewPage("/profile", "My Account", false);
</script>

<style lang="scss" scoped>
.spacer {
  height: 24px;
}

.v-expansion-panel::before {
  box-shadow: none;
}
</style>
