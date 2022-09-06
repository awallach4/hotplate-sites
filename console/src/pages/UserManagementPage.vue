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
        <v-dialog v-model="userCreator" max-width="600px" persistent>
          <template #activator="{ on: dialog, attrs }">
            <v-tooltip bottom>
              <template #activator="{ on: tooltip }">
                <v-btn
                  v-bind="attrs"
                  aria-label="Manage Invites"
                  icon
                  :disabled="updating"
                  v-on="{ ...tooltip, ...dialog }"
                >
                  <v-icon>mdi-account-plus</v-icon>
                </v-btn>
              </template>
              Manage Invites
            </v-tooltip>
          </template>
          <v-card color="card" :loading="updating ? 'secondary' : false">
            <v-toolbar flat class="cardtext--text">
              <v-btn
                icon
                aria-label="Close"
                :disabled="updating"
                @click="userCreator = false"
              >
                <v-icon>mdi-close</v-icon>
              </v-btn>
              <v-toolbar-title>Manage Invites</v-toolbar-title>
              <v-spacer />
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
            </v-toolbar>
            <v-card-text class="cardtext--text">
              Users who have been invited by an administrator will appear in the
              table below. You can cancel a user's invite until they create
              their account. To change an invited user's email address, cancel
              the invite and invite the user again.
              <v-text-field
                v-model="newSearch"
                append-icon="mdi-magnify"
                filled
                label="Search by Email Address"
                class="mt-6"
                clearable
              />
              <v-data-table
                :headers="[headers[0], headers[4]]"
                :items="invitedUsers"
                :search="newSearch"
                no-data-text="No users have been invited."
                must-sort
                sort-by="email"
              >
                <!-- eslint-disable-next-line vue/valid-v-slot -->
                <template #item.actions="{ item }">
                  <v-tooltip bottom>
                    <template #activator="{ on, attrs }">
                      <v-btn
                        v-bind="attrs"
                        icon
                        aria-label="Cancel Invite"
                        :disabled="updating"
                        v-on="on"
                        @click="cancelInvite(item)"
                      >
                        <v-icon>mdi-minus-circle-outline</v-icon>
                      </v-btn>
                    </template>
                    Cancel Invite
                  </v-tooltip>
                </template>
              </v-data-table>
            </v-card-text>
            <v-divider />
            <v-expansion-panels v-model="inviteDropdown" flat>
              <v-expansion-panel class="card">
                <v-expansion-panel-header>
                  <h3>Invite User</h3>
                </v-expansion-panel-header>
                <v-expansion-panel-content>
                  <v-form
                    ref="newUserForm"
                    :disabled="updating"
                    @submit.prevent="createUser"
                  >
                    <v-text-field
                      v-model="newUserEmail"
                      filled
                      label="Email Address"
                      type="email"
                      :rules="[fieldRequired, validEmail]"
                      color="secondary"
                      validate-on-blur
                    />
                    <v-checkbox
                      v-if="settings.useEmail && settings.mailURL"
                      v-model="notifyUser"
                      color="secondary"
                      class="mt-0"
                      label="Send Invite Email"
                    />
                    <v-btn
                      block
                      color="secondary"
                      class="sectext--text"
                      type="submit"
                      :disabled="updating"
                      >Invite User
                    </v-btn>
                  </v-form>
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>
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
import type { FunctionsError } from "firebase/functions";
import { displayPageAlert, getFirestoreError } from "@/plugins/errorHandler";
import { loading, settings } from "@/plugins/routerStoreHelpers";
import { companyName } from "../../../hotplateConfig";

interface InvitedUser {
  email: string;
  id: string;
}

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

const newUserEmail = ref("");
const notifyUser = ref(false);
const users: Ref<UserManagementUser[]> = ref([]);
const selectedUser: Ref<UserManagementUser | null> = ref(null);
const newPermissions = ref(AuthLevels.UNSET);
const newUsername = ref("");
const updating = ref(false);
const newUserForm = ref({} as VFormOptions);
const userEditor = ref(false);
const userCreator = ref(false);
const inviteDropdown: Ref<number | undefined> = ref(undefined);
const updateUserForm = ref({} as VFormOptions);
const search = ref("");
const newSearch = ref("");
const invitedUsers: Ref<InvitedUser[]> = ref([]);

watch(userCreator, (newValue) => {
  if (!newValue) {
    inviteDropdown.value = undefined;
  }
});

watch(userEditor, (newValue) => {
  if (!newValue) {
    updateUserForm.value.reset();
  }
});

watch(inviteDropdown, (newValue) => {
  if (newValue === undefined) {
    newUserForm.value.reset();
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
      { controlledAuth: settings.value.controlledAuth || false },
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
    const newDocs = await getDocs(collection(firestore, "new-users"));
    invitedUsers.value = [];
    newDocs.forEach((doc) => {
      const focusUser = doc.data() as InvitedUser;
      focusUser.id = doc.id;
      invitedUsers.value.push(focusUser);
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
    const { firestore } = await import("@/plugins/firebase");
    const { addDoc, collection, getDocs, query, where } = await import(
      "firebase/firestore/lite"
    );
    const existingInvites = await getDocs(
      query(
        collection(firestore, "new-users"),
        where("email", "==", newUserEmail.value)
      )
    );
    const existingUsers = await getDocs(
      query(
        collection(firestore, "users"),
        where("email", "==", newUserEmail.value)
      )
    );
    if (existingInvites.size > 0 || existingUsers.size > 0) {
      displayPageAlert("The email address is already in use.");
      updating.value = false;
      return;
    }
    await addDoc(collection(firestore, `new-users`), {
      email: newUserEmail.value
    });

    if (settings.value.useEmail && settings.value.mailURL && notifyUser.value) {
      const postData: EmailData = {
        to: newUserEmail.value,
        subject: `Welcome to ${companyName}!`,
        sender: `${companyName} Accounts`,
        body: `<p>Welcome to ${companyName}, ${newUserEmail.value}!  A site administrator has invited you to create an account with ${companyName} using your current email address.  To create your account, head to the ${companyName} website and go to the "Register" page.  Use the email address you are currently reading this from to create your account and be sure to verify your email address upon account creation.  If you have any questions, please contact ${companyName} directly, do not reply to this email.  Again, welcome to ${companyName}!</p>`
      };
      const { sendEmail } = await import("@/plugins/mailService");
      await sendEmail(postData);
    }
    displayPageAlert("Successfully invited a new user.");
    updating.value = false;
    newUserForm.value.reset();
  } catch (error) {
    displayPageAlert(
      `An error occurred while creating the user: ${getFirestoreError(
        error as FirestoreError
      )}`
    );
    updating.value = false;
  }

  getUsers();
};

const cancelInvite = async (user: InvitedUser) => {
  try {
    updating.value = true;
    const { firestore } = await import("@/plugins/firebase");
    const { deleteDoc, doc } = await import("firebase/firestore/lite");
    await deleteDoc(doc(firestore, `new-users/${user.id}`));
    displayPageAlert("Successfully cancelled the invite.");
    updating.value = false;
  } catch (error) {
    displayPageAlert(
      `An error occurred while cancelling the invite: ${getFirestoreError(
        error as FirestoreError
      )}`
    );
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
  const isAdmin = focusUser.permissions === AuthLevels.ADMIN;
  const isWebmaster = focusUser.permissions === AuthLevels.WEBMASTER;

  if (isAdmin) {
    if (newPermissions.value === AuthLevels.ADMIN) {
      throw new Error("User is already an admin.");
    }
  } else if (isWebmaster) {
    if (newPermissions.value === AuthLevels.WEBMASTER) {
      throw new Error("User is already a webmaster.");
    }
  } else {
    if (
      newPermissions.value === AuthLevels.USER ||
      newPermissions.value === AuthLevels.UNSET
    ) {
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
