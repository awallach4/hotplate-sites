<template>
  <div v-if="!loading" id="users">
    <v-row class="align-start">
      <v-col cols="12" sm="6">
        <v-card color="card" :loading="creatingUser ? 'secondary' : false">
          <v-card-title class="cardtext--text">Add a User</v-card-title>
          <v-card-subtitle class="cardtext--text"
            >Only users created through this form who verify their email address
            will be authorized to view restricted content.</v-card-subtitle
          >
          <v-card-text class="cardtext--text">
            <v-form
              ref="newUserForm"
              :disabled="creatingUser"
              @submit.prevent="createUser"
            >
              <v-text-field
                v-model="newUserUsername"
                filled
                label="Username"
                :rules="[fieldRequired]"
                color="secondary"
                validate-on-blur
              />
              <v-text-field
                v-model="newUserEmail"
                filled
                label="Email Address"
                hint="The new user will use this email address to log in.  It must be valid."
                type="email"
                :rules="[fieldRequired, validEmail]"
                color="secondary"
                validate-on-blur
              />
              <v-btn
                color="secondary"
                class="sectext--text"
                block
                type="submit"
                :disabled="creatingUser"
                >Create User</v-btn
              >
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6">
        <v-card color="card" :loading="updating ? 'secondary' : false">
          <v-card-title class="cardtext--text">Manage Users</v-card-title>
          <v-card-subtitle class="cardtext--text"
            >Select users from the table below and manage them
            here.</v-card-subtitle
          >
          <v-card-text class="cardtext--text">
            <v-text-field
              v-model="newUsername"
              label="Username"
              filled
              :disabled="!isUserSelected || updating"
              color="secondary"
            />
            <v-btn
              color="secondary"
              class="sectext--text"
              block
              :disabled="!isUserSelected || updating"
              @click="updateUsername"
            >
              Update Username
            </v-btn>
            <v-spacer />
            <v-select
              v-model="newPermissions"
              label="User Permissions..."
              :items="permissions"
              :disabled="!isUserSelected || updating"
              hint="Users can view site content specified from this console.  Webmasters can edit all site content.  Administrators can manage users and have full site control."
              persistent-hint
              filled
              color="secondary"
              item-color="secondary"
            />
            <v-btn
              color="secondary"
              class="sectext--text"
              block
              :disabled="!isUserSelected || updating"
              @click="setPermissions"
              >Set Permissions</v-btn
            >
            <v-spacer />
            <strong>Disabled users cannot log into their accounts.</strong>
            <v-switch
              v-model="disabled"
              label="Disabled"
              :disabled="!isUserSelected || updating"
              color="secondary"
            />
            <v-btn
              color="secondary"
              class="sectext--text"
              block
              :disabled="!isUserSelected || updating"
              @click="toggleDisabled"
              >Update Disabled State</v-btn
            >
            <v-spacer />
            <v-btn
              color="secondary"
              class="sectext--text"
              block
              :disabled="!isUserSelected || updating"
              @click="signOutUser"
              >Sign Out User</v-btn
            >
            <v-spacer />
            <v-btn
              color="error"
              class="black--text"
              block
              :disabled="!isUserSelected || updating"
              @click="deleteUser"
              >Delete User</v-btn
            >
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-card
      color="card"
      class="mt-3"
      :loading="fetchingUsers ? 'secondary' : false"
    >
      <v-card-title class="cardtext--text flex-nowrap">
        Select Users
        <v-tooltip bottom>
          <template #activator="{ on }">
            <v-btn
              aria-label="Refresh Users List"
              icon
              class="ml-auto cardtext--text"
              :disabled="fetchingUsers"
              v-on="on"
              @click="getUsers"
            >
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
          </template>
          Refresh Users List
        </v-tooltip>
      </v-card-title>
      <v-card-text class="cardtext--text">
        <v-data-table
          v-model="selectedUsers"
          show-select
          single-select
          :headers="headers"
          :items="users"
        >
          <!-- eslint-disable-next-line vue/valid-v-slot -->
          <template #item.disabled="{ item }">
            <v-simple-checkbox v-model="item.disabled" disabled />
          </template>
          <div v-for="item in users" :key="item.id">
            {{ item.id }}
          </div>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import {
  AuthLevels,
  type VSelectValues,
  type EmailData,
  type UserManagementUser,
  type VFormOptions
} from "@/types";
import { computed, ref, watch, type Ref } from "@vue/composition-api";
import { fieldRequired, validEmail } from "@/plugins/formRules";
import { user } from "@/plugins/authHandler";
import type { FirestoreError } from "firebase/firestore/lite";
import { usePages } from "@/store/pages";
import type { HttpsCallableResult } from "firebase/functions";
import { displayPageAlert } from "@/plugins/errorHandler";
import { loading } from "@/plugins/routerStoreHelpers";

const headers: VSelectValues[] = [
  {
    text: "Email Address",
    value: "email"
  },
  {
    text: "Username",
    value: "displayName"
  },
  {
    text: "Permissions",
    value: "permissions"
  },
  {
    text: "Disabled",
    value: "disabled"
  }
];
const permissions = [
  {
    text: "User",
    value: AuthLevels.USER
  },
  {
    text: "Webmaster",
    value: AuthLevels.WEBMASTER
  },
  {
    text: "Admin",
    value: AuthLevels.ADMIN
  }
];

const newUserUsername = ref("");
const newUserEmail = ref("");
const users: Ref<UserManagementUser[]> = ref([]);
const selectedUsers: Ref<UserManagementUser[]> = ref([]);
const newPermissions = ref(AuthLevels.UNSET);
const disabled = ref(false);
const newUsername = ref("");
const updating = ref(false);
const newUserForm = ref({} as VFormOptions);
const fetchingUsers = ref(false);
const creatingUser = ref(false);

const isUserSelected = computed(() => {
  return selectedUsers.value.length > 0;
});

watch(selectedUsers, (newValue) => {
  if (newValue.length === 0) {
    newPermissions.value = AuthLevels.UNSET;
    newUsername.value = "";
    disabled.value = false;
  } else {
    disabled.value = newValue[0].disabled;
  }
});

const getUsers = async () => {
  try {
    fetchingUsers.value = true;
    const { firestore } = await import("@/plugins/firebase");
    const { collection, getDocs } = await import("firebase/firestore/lite");
    const docs = await getDocs(collection(firestore, "users"));
    users.value = [];
    docs.forEach((doc) => {
      const focusUser = doc.data() as UserManagementUser;
      focusUser.id = doc.id;
      if (user.value && user.value.uid === focusUser.id) {
        focusUser.isSelectable = false;
      } else {
        focusUser.isSelectable = true;
      }
      users.value.push(focusUser);
    });
    fetchingUsers.value = false;
  } catch (error) {
    fetchingUsers.value = false;
    const rawError = error as FirestoreError;
    displayPageAlert(
      `An error occurred while getting a list of users: ${rawError.message}`
    );
  }
};

const createUser = async () => {
  const isValid = newUserForm.value.validate();
  if (!isValid) {
    return;
  }

  try {
    creatingUser.value = true;
    const { functions } = await import("@/plugins/firebase");
    const { httpsCallable } = await import("firebase/functions");
    const createUserFunction = httpsCallable(functions, "createUser");
    const createNewUser = (await createUserFunction({
      name: newUserUsername.value,
      email: newUserEmail.value
    })) as HttpsCallableResult<{
      success: boolean;
      password: string;
      msg: string;
    }>;
    const userPassword = createNewUser.data.password;
    const postData: EmailData = {
      to: newUserEmail.value,
      subject: "Welcome to YOUR_COMPANY!",
      sender: "YOUR_COMPANY Accounts",
      body: `<p>Welcome to YOUR_COMPANY, ${newUserUsername.value}!  To log into your new account, please use the email address that you are currently reading this from.  Your password is: <strong>${userPassword}</strong>.  Please log into your account and click the link to verify your email address.  You will not be able to make any changes to your account until this address is verified.  Once your email is verified, please log back in and <strong> change your password IMMEDIATELY.</strong>  If you have any questions, please contact a site administrator for help.  Thank you!</p>`
    };

    const { sendEmail } = await import("@/plugins/mailService");
    await sendEmail(postData);
    displayPageAlert("Successfully created a new user.");
    creatingUser.value = false;
    newUserForm.value.reset();
  } catch (error) {
    displayPageAlert(`An error occurred: ${error}`);
    creatingUser.value = false;
  }

  getUsers();
};

const updateUsername = async () => {
  updating.value = true;
  const focusUser = selectedUsers.value[0];
  if (focusUser.id === user.value.uid) {
    displayPageAlert(
      "Change your username from the profile page in the client app."
    );
    updating.value = false;
    return;
  }
  try {
    const { functions } = await import("@/plugins/firebase");
    const { httpsCallable } = await import("firebase/functions");
    const setName = httpsCallable(functions, "updateUser");
    await setName({
      uid: focusUser.id,
      mode: "name",
      content: newUsername.value
    });
    selectedUsers.value = [];
    displayPageAlert("Successfully changed the user's username.");
    newUsername.value = "";
    updating.value = false;
  } catch (error) {
    displayPageAlert(
      `An error occurred while changing the user's username: ${error}`
    );
    updating.value = false;
  }

  getUsers();
};

const deleteUser = async () => {
  if (!isUserSelected.value) {
    displayPageAlert("Please select a user.");
    return;
  }

  if (user.value && user.value.uid === selectedUsers.value[0].id) {
    displayPageAlert("You cannot delete your own account.");
    return;
  }

  if (
    confirm("CONFIRM: You are about to delete a user.  Do you wish to proceed?")
  ) {
    try {
      updating.value = true;
      const { functions } = await import("@/plugins/firebase");
      const { httpsCallable } = await import("firebase/functions");
      const remove = httpsCallable(functions, "removeUser");
      await remove({ uid: selectedUsers.value[0].id });
      selectedUsers.value = [];
      displayPageAlert("Successfully removed user.");
      updating.value = false;
    } catch (error) {
      displayPageAlert(`An error occurred while deleting the user: ${error}`);
      updating.value = false;
    }
  }

  getUsers();
};

const toggleDisabled = async () => {
  const focusUser = selectedUsers.value[0];
  if (focusUser.id === user.value.uid) {
    displayPageAlert("You cannot disable/enable your account.");
    return;
  }
  if (focusUser.disabled === disabled.value) {
    displayPageAlert(
      `User account is already ${focusUser.disabled ? "disabled" : "enabled"}.`
    );
    return;
  }
  try {
    updating.value = true;
    const { functions } = await import("@/plugins/firebase");
    const { httpsCallable } = await import("firebase/functions");
    const toggle = httpsCallable(functions, "updateUser");
    await toggle({
      uid: focusUser.id,
      mode: "disable",
      content: disabled.value
    });
    selectedUsers.value = [];
    disabled.value = false;
    displayPageAlert("Successfully toggled disabled state.");
    updating.value = false;
  } catch (error) {
    displayPageAlert(
      `An error occurred while toggling the user's disabled state: ${error}`
    );
    updating.value = false;
  }

  getUsers();
};

const signOutUser = async () => {
  const focusUser = selectedUsers.value[0];
  if (focusUser.id === user.value.uid) {
    displayPageAlert("You cannot sign out of your account here.");
    return;
  }

  try {
    updating.value = true;
    const { functions } = await import("@/plugins/firebase");
    const { httpsCallable } = await import("firebase/functions");
    const signOut = httpsCallable(functions, "updateUser");
    await signOut({ uid: focusUser.id, mode: "signout" });
    selectedUsers.value = [];
    displayPageAlert("Successfully signed out the user.");
    updating.value = false;
  } catch (error) {
    displayPageAlert(`An error occurred while signing out the user: ${error}`);
    updating.value = false;
  }

  getUsers();
};

const setPermissions = async () => {
  try {
    const focusUser = selectedUsers.value[0];
    if (!focusUser) {
      displayPageAlert("Please select a user.");
      newPermissions.value = AuthLevels.UNSET;
      return;
    }
    if (focusUser.id === user.value.uid) {
      displayPageAlert("You cannot set permissions on your own account.");
      newPermissions.value = AuthLevels.UNSET;
      selectedUsers.value = [];
      return;
    }

    updating.value = true;
    const { firestore } = await import("@/plugins/firebase");
    const { doc, deleteDoc, getDoc, setDoc } = await import(
      "firebase/firestore/lite"
    );
    const isAdmin = (
      await getDoc(doc(firestore, `admin/${focusUser.id}`))
    ).exists();
    const isWebmaster = (
      await getDoc(doc(firestore, `webmasters/${focusUser.id}`))
    ).exists();

    if (isAdmin) {
      if (newPermissions.value === "User") {
        await deleteDoc(doc(firestore, `admin/${focusUser.id}`));
      } else if (newPermissions.value === "Webmaster") {
        await deleteDoc(doc(firestore, `admin/${focusUser.id}`));
        await setDoc(doc(firestore, `webmasters/${focusUser.id}`), {
          name: focusUser.displayName
        });
      } else {
        displayPageAlert("User is already an admin.");
        updating.value = false;
        return;
      }
    } else if (isWebmaster) {
      if (newPermissions.value === "User") {
        await deleteDoc(doc(firestore, `webmasters/${focusUser.id}`));
      } else if (newPermissions.value === "Admin") {
        await deleteDoc(doc(firestore, `webmasters/${focusUser.id}`));
        await setDoc(doc(firestore, `admin/${focusUser.id}`), {
          name: focusUser.displayName
        });
      } else {
        displayPageAlert("User is already a webmaster.");
        updating.value = false;
        return;
      }
    } else {
      if (newPermissions.value === "Webmaster") {
        await setDoc(doc(firestore, `webmasters/${focusUser.id}`), {
          name: focusUser.displayName
        });
      } else if (newPermissions.value === "Admin") {
        await setDoc(doc(firestore, `admin/${focusUser.id}`), {
          name: focusUser.displayName
        });
      } else {
        displayPageAlert("User is already a basic user.");
        updating.value = false;
        return;
      }
    }

    const { functions } = await import("@/plugins/firebase");
    const { httpsCallable } = await import("firebase/functions");
    const changePermissions = httpsCallable(functions, "setPermissions");
    await changePermissions({ uid: focusUser.id, perms: newPermissions.value });
    selectedUsers.value = [];
    newPermissions.value = AuthLevels.UNSET;
    displayPageAlert("Successfully set permissions.");
    updating.value = false;
  } catch (error) {
    displayPageAlert(
      `An error occurred while setting the user's permissions: ${error}`
    );
    updating.value = false;
  }

  getUsers();
};

getUsers();
const PagesModule = usePages();
PagesModule.viewPage("/users", "User Management", false);
</script>

<style lang="scss">
#users {
  .spacer {
    height: 24px;
  }
}
</style>
