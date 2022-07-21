<template>
  <div v-if="!loading" id="users">
    <v-card color="card" :loading="updating ? 'secondary' : false">
      <v-card-title class="cardtext--text flex-nowrap">
        Manage Users
        <v-tooltip bottom>
          <template #activator="{ on }">
            <v-btn
              :aria-label="
                settings.controlledAuth
                  ? 'Disable Invite-Only Authentication'
                  : 'Enable Invite-Only Authentication'
              "
              icon
              class="ml-auto"
              :disabled="updating"
              v-on="on"
              @click="toggleAuthMode"
            >
              <v-icon>{{
                settings.controlledAuth ? "mdi-lock" : "mdi-lock-open"
              }}</v-icon>
            </v-btn>
          </template>
          {{ settings.controlledAuth ? "Disable" : "Enable" }} Invite-Only
          Authentication
        </v-tooltip>
        <v-dialog v-model="userCreator" max-width="400px" persistent>
          <template #activator="{ on: dialog, attrs }">
            <v-tooltip bottom>
              <template #activator="{ on: tooltip }">
                <v-btn
                  v-bind="attrs"
                  aria-label="Create User"
                  icon
                  :disabled="updating"
                  v-on="{ ...tooltip, ...dialog }"
                >
                  <v-icon>mdi-account-plus</v-icon>
                </v-btn>
              </template>
              Create User
            </v-tooltip>
          </template>
          <v-card color="card" :loading="updating ? 'secondary' : false">
            <v-card-title class="cardtext--text">Create User</v-card-title>
            <v-card-text class="cardtext--text">
              <v-form
                id="newUserForm"
                ref="newUserForm"
                :disabled="updating"
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
                  type="email"
                  :rules="[fieldRequired, validEmail]"
                  color="secondary"
                  validate-on-blur
                />
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-btn
                text
                class="cardtext--text ml-auto"
                :disabled="updating"
                @click="userCreator = false"
                >Cancel</v-btn
              >
              <v-btn
                color="secondary"
                class="sectext--text ml-2"
                type="submit"
                form="newUserForm"
                :disabled="updating"
                >Create User
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-tooltip bottom>
          <template #activator="{ on }">
            <v-btn
              aria-label="Refresh Users List"
              icon
              :disabled="updating"
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
        This dashboard allows you to manage all of your site's users. Click the
        menu icon in the row of the user you'd like to make changes to for a
        complete list of options. You cannot make changes to your own account
        from this dashboard.
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          filled
          label="Search by Email Address or Username"
          class="mt-6"
          clearable
        />
        <v-data-table :headers="headers" :items="users" :search="search">
          <!-- eslint-disable-next-line vue/valid-v-slot -->
          <template #header.permissions="{ header }">
            <v-tooltip top max-width="300px">
              <template #activator="{ on }">
                {{ header.text }}
                <v-icon small v-on="on">mdi-help-circle-outline</v-icon>
              </template>
              Users can view restricted content. Webmasters can edit site
              content and view editor-restricted content. Admins have webmaster
              permissions and can also manage users and configure external
              services.
            </v-tooltip>
          </template>
          <!-- eslint-disable-next-line vue/valid-v-slot -->
          <template #header.disabled="{ header }">
            <v-tooltip top max-width="250px">
              <template #activator="{ on }">
                {{ header.text }}
                <v-icon small v-on="on">mdi-help-circle-outline</v-icon>
              </template>
              Disabled users cannot log into their accounts.
            </v-tooltip>
          </template>
          <!-- eslint-disable-next-line vue/valid-v-slot -->
          <template #item.disabled="{ item }">
            <v-simple-checkbox v-model="item.disabled" disabled />
          </template>
          <!-- eslint-disable-next-line vue/valid-v-slot -->
          <template #header.authorized="{ header }">
            <v-tooltip top max-width="250px">
              <template #activator="{ on }">
                {{ header.text }}
                <v-icon small v-on="on">mdi-help-circle-outline</v-icon>
              </template>
              Only authorized users can view restricted content when Invite-Only
              Authentication is enabled.
            </v-tooltip>
          </template>
          <!-- eslint-disable-next-line vue/valid-v-slot -->
          <template #item.authorized="{ item }">
            <v-simple-checkbox v-model="item.authorized" disabled />
          </template>
          <!-- eslint-disable-next-line vue/valid-v-slot -->
          <template #item.actions="{ item }">
            <v-menu
              v-if="item.isSelectable"
              offset-y
              left
              bottom
              transition="slide-x-reverse-transition"
            >
              <template #activator="{ on, attrs }">
                <v-btn v-bind="attrs" icon :disabled="updating" v-on="on">
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item @click="openEditor(item)">
                  <v-list-item-title>Edit User</v-list-item-title>
                </v-list-item>
                <v-list-item @click="signOutUser(item)">
                  <v-list-item-title>Sign Out User</v-list-item-title>
                </v-list-item>
                <v-list-item @click="toggleAuthorized(item)">
                  <v-list-item-title
                    >{{
                      item.authorized ? "Deauthorize" : "Authorize"
                    }}
                    User</v-list-item-title
                  >
                </v-list-item>
                <v-list-item @click="toggleDisabled(item)">
                  <v-list-item-title
                    >{{
                      item.disabled ? "Enable" : "Disable"
                    }}
                    User</v-list-item-title
                  >
                </v-list-item>
                <v-list-item @click="deleteUser(item)">
                  <v-list-item-title>Delete User</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
          <div v-for="item in users" :key="item.id">
            {{ item.id }}
          </div>
        </v-data-table>
      </v-card-text>
    </v-card>
    <v-dialog v-model="userEditor" max-width="400px" persistent>
      <v-card color="card" :loading="updating ? 'secondary' : false">
        <v-card-title class="cardtext--text">Edit User</v-card-title>
        <v-card-text class="cardtext--text">
          <v-form
            id="updateUserForm"
            ref="updateUserForm"
            :disabled="updating"
            @submit.prevent="updateUser"
          >
            <v-text-field
              v-model="newUsername"
              label="Username"
              filled
              :rules="[fieldRequired]"
              color="secondary"
              validate-on-blur
            />
            <v-select
              v-model="newPermissions"
              label="Permissions"
              :items="permissions"
              :rules="[fieldRequired]"
              filled
              color="secondary"
              item-color="secondary"
              validate-on-blur
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn
            text
            class="cardtext--text ml-auto"
            :disabled="updating"
            @click="userEditor = false"
            >Cancel</v-btn
          >
          <v-btn
            type="submit"
            form="updateUserForm"
            color="secondary"
            class="sectext--text ml-2"
            :disabled="updating"
            >Update User</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import {
  AuthLevels,
  type EmailData,
  type UserManagementUser,
  type VFormOptions
} from "@/types";
import { ref, watch, type Ref } from "vue";
import { fieldRequired, validEmail } from "@/plugins/formRules";
import { user } from "@/plugins/authHandler";
import type { FirestoreError } from "firebase/firestore/lite";
import { usePages } from "@/store/pages";
import type { FunctionsError, HttpsCallableResult } from "firebase/functions";
import { displayPageAlert, getFirestoreError } from "@/plugins/errorHandler";
import { loading, settings } from "@/plugins/routerStoreHelpers";
import { companyName } from "@/CONSOLE_CONFIG";
import { useSettings } from "@/store/settings";

const headers = [
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
    value: "permissions",
    filterable: false
  },
  {
    text: "Disabled",
    value: "disabled",
    filterable: false
  },
  {
    text: "Authorized",
    value: "authorized",
    filterable: false
  },
  {
    text: "",
    value: "actions",
    sortable: false,
    align: "end",
    filterable: false
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
const selectedUser: Ref<UserManagementUser | null> = ref(null);
const newPermissions = ref(AuthLevels.UNSET);
const newUsername = ref("");
const updating = ref(false);
const newUserForm = ref({} as VFormOptions);
const userEditor = ref(false);
const userCreator = ref(false);
const updateUserForm = ref({} as VFormOptions);
const search = ref("");

watch(userCreator, (newValue) => {
  if (!newValue) {
    newUserForm.value.reset();
  }
});

watch(userEditor, (newValue) => {
  if (!newValue) {
    updateUserForm.value.reset();
  }
});

const openEditor = (selection: UserManagementUser) => {
  selectedUser.value = selection;
  newPermissions.value = selection.permissions;
  newUsername.value = selection.displayName;
  userEditor.value = true;
};

const toggleAuthMode = async () => {
  try {
    const { firestore } = await import("@/plugins/firebase");
    const { doc, setDoc } = await import("firebase/firestore/lite");
    settings.value.controlledAuth = !settings.value.controlledAuth;
    await setDoc(
      doc(firestore, "configuration/settings"),
      { controlledAuth: settings.value.controlledAuth },
      {
        merge: true
      }
    );
    displayPageAlert(
      `Successfully ${
        settings.value.controlledAuth ? "enabled" : "disabled"
      } invite-only authentication.`
    );
  } catch (error) {
    displayPageAlert(
      `An error occurred while ${
        settings.value.controlledAuth ? "enabling" : "disabling"
      } invite-only authentication: ${getFirestoreError(
        error as FirestoreError
      )}`
    );
  }
};

const getUsers = async () => {
  try {
    updating.value = true;
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
    updating.value = false;
  } catch (error) {
    updating.value = false;
    displayPageAlert(
      `An error occurred while getting a list of users: ${getFirestoreError(
        error as FirestoreError
      )}`
    );
  }
};

const createUser = async () => {
  const isValid = newUserForm.value.validate();
  if (!isValid) {
    return;
  }

  try {
    updating.value = true;
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
      subject: `Welcome to ${companyName}!`,
      sender: `${companyName} Accounts`,
      body: `<p>Welcome to ${companyName}, ${newUserUsername.value}!  To log into your new account, please use the email address that you are currently reading this from.  Your password is: <strong>${userPassword}</strong>.  Please log into your account and click the link to verify your email address.  You will not be able to make any changes to your account until this address is verified.  Once your email is verified, please log back in and <strong> change your password IMMEDIATELY.</strong>  If you have any questions, please contact a site administrator for help.  Thank you!</p>`
    };

    const SettingsModule = useSettings();
    if (
      SettingsModule.siteSettings.mailURL &&
      SettingsModule.siteSettings.useEmail
    ) {
      const { sendEmail } = await import("@/plugins/mailService");
      await sendEmail(postData);
      displayPageAlert("Successfully created a new user.");
    } else {
      displayPageAlert(
        "Successfully created a new user.  The user must reset their password before logging in, as the email service is not set up."
      );
    }
    updating.value = false;
    userCreator.value = false;
  } catch (error) {
    const rawError = error as FunctionsError;
    displayPageAlert(
      `An error occurred while creating the user: ${rawError.message}`
    );
    updating.value = false;
  }

  getUsers();
};

const updateUsername = async (focusUser: UserManagementUser) => {
  const { functions } = await import("@/plugins/firebase");
  const { httpsCallable } = await import("firebase/functions");
  const setName = httpsCallable(functions, "updateUser");
  await setName({
    uid: focusUser.id,
    mode: "name",
    content: newUsername.value
  });
};

const setPermissions = async (focusUser: UserManagementUser) => {
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
      throw new Error("User is already an admin.");
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
      throw new Error("User is already a webmaster.");
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
      throw new Error("User is already a basic user.");
    }
  }

  const { functions } = await import("@/plugins/firebase");
  const { httpsCallable } = await import("firebase/functions");
  const changePermissions = httpsCallable(functions, "setPermissions");
  await changePermissions({
    uid: focusUser.id,
    perms: newPermissions.value
  });
};

const updateUser = async () => {
  const isValid = updateUserForm.value.validate();
  if (!isValid) {
    return;
  }
  if (!selectedUser.value) {
    displayPageAlert("Please select a user.");
    return;
  }
  try {
    updating.value = true;
    if (selectedUser.value.id === user.value.uid) {
      displayPageAlert(
        "You cannot update your own account from this dashboard."
      );
      updating.value = false;
      userEditor.value = false;
      return;
    }

    if (selectedUser.value.displayName !== newUsername.value) {
      await updateUsername(selectedUser.value);
    }

    if (selectedUser.value.permissions !== newPermissions.value) {
      await setPermissions(selectedUser.value);
    }

    if (
      selectedUser.value.permissions === newPermissions.value &&
      selectedUser.value.displayName === newUsername.value
    ) {
      displayPageAlert("You did not make any changes to the user!");
      updating.value = false;
      return;
    }

    displayPageAlert("Successfully updated the user!");
    updating.value = false;
    userEditor.value = false;
    getUsers();
  } catch (error) {
    const rawError = error as FunctionsError;
    displayPageAlert(
      `An error occurred while updating the user: ${rawError.message}`
    );
    updating.value = false;
  }
};

const deleteUser = async (focusUser: UserManagementUser) => {
  if (user.value.uid === focusUser.id) {
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
      await remove({ uid: focusUser.id });
      users.value.splice(users.value.indexOf(focusUser), 1);
      displayPageAlert("Successfully removed user.");
      updating.value = false;
    } catch (error) {
      const rawError = error as FunctionsError;
      displayPageAlert(
        `An error occurred while deleting the user: ${rawError.message}`
      );
      updating.value = false;
    }
  }
};

const toggleDisabled = async (focusUser: UserManagementUser) => {
  if (focusUser.id === user.value.uid) {
    displayPageAlert("You cannot disable/enable your account.");
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
      content: !focusUser.disabled
    });
    displayPageAlert(
      `Successfully ${focusUser.disabled ? "enabled" : "disabled"} the user.`
    );
    updating.value = false;
  } catch (error) {
    const rawError = error as FunctionsError;
    displayPageAlert(
      `An error occurred while ${
        focusUser.disabled ? "enabling" : "disabling"
      } the user: ${rawError.message}`
    );
    updating.value = false;
  }

  getUsers();
};

const toggleAuthorized = async (focusUser: UserManagementUser) => {
  if (focusUser.id === user.value.uid) {
    displayPageAlert("You cannot authorize/deauthorize your account.");
    return;
  }
  try {
    updating.value = true;
    const { functions } = await import("@/plugins/firebase");
    const { httpsCallable } = await import("firebase/functions");
    const toggle = httpsCallable(functions, "updateUser");
    await toggle({
      uid: focusUser.id,
      mode: "authorize",
      content: !focusUser.authorized
    });
    displayPageAlert(
      `Successfully ${
        focusUser.authorized ? "deauthorized" : "authorized"
      } the user.`
    );
    updating.value = false;
  } catch (error) {
    const rawError = error as FunctionsError;
    displayPageAlert(
      `An error occurred while ${
        focusUser.authorized ? "deauthorizing" : "authorizing"
      } the user: ${rawError.message}`
    );
    updating.value = false;
  }

  getUsers();
};

const signOutUser = async (focusUser: UserManagementUser) => {
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
    displayPageAlert("Successfully signed out the user.");
    updating.value = false;
  } catch (error) {
    const rawError = error as FunctionsError;
    displayPageAlert(
      `An error occurred while signing out the user: ${rawError.message}`
    );
    updating.value = false;
  }

  getUsers();
};

getUsers();
const PagesModule = usePages();
PagesModule.viewPage("/users", "User Management", false);
</script>
