<template>
  <div id="nav">
    <v-navigation-drawer v-model="drawer" app color="card lighten-1">
      <v-list nav>
        <v-list-group v-if="isLoggedIn" color="secondary">
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
          <v-list-item to="/profile"> My Account </v-list-item>
          <v-list-item
            v-if="isWebmaster && privateSettings.consoleURL"
            :href="privateSettings.consoleURL"
            target="_blank"
          >
            Admin Console
            <v-spacer />
            <v-icon>mdi-launch</v-icon>
          </v-list-item>
          <v-list-item @click="logout"> Log Out </v-list-item>
        </v-list-group>
        <v-divider v-if="isLoggedIn" />
        <v-list-item-group color="secondary">
          <div v-for="path in specialPages" :key="path.id" class="mb-2">
            <v-list-item
              v-if="
                path.permissions === 'public' ||
                (isAuthorized && path.permissions === 'users') ||
                (isAuthorized &&
                  isWebmaster &&
                  path.permissions === 'webmasters')
              "
              :to="path.dbPath"
            >
              <v-list-item-title>{{ path.name }}</v-list-item-title>
            </v-list-item>
          </div>
          <v-list-item v-if="!isLoggedIn" to="/login"> Log In </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar app color="primary" elevate-on-scroll>
      <v-app-bar-nav-icon
        class="pritext--text"
        aria-label="Open Navigation Drawer"
        @click.stop="drawer = !drawer"
      />
      <v-toolbar-title class="pritext--text">{{ pageTitle }}</v-toolbar-title>
      <v-spacer />
      <v-progress-linear
        v-if="loading"
        color="secondary"
        indeterminate
        absolute
        bottom
      />
      <v-tooltip
        v-if="
          !privateSettings.linkHidden &&
          privateSettings.meetLink &&
          isAuthorized
        "
        bottom
      >
        <template #activator="{ on }">
          <v-btn
            :href="privateSettings.meetLink"
            target="_blank"
            rel="noopener noreferrer nofollow"
            icon
            class="pritext--text"
            aria-label="Join Virtual Meeting"
            v-on="on"
          >
            <v-icon>mdi-video</v-icon>
          </v-btn>
        </template>
        Join Meeting
      </v-tooltip>
      <v-dialog v-if="canMail && settings.mailURL" v-model="mail" persistent>
        <v-card color="card" class="cardtext--text">
          <v-card-title>Send Email</v-card-title>
          <v-card-text>
            <v-form
              ref="mailer"
              :disabled="submitting"
              @submit.prevent="sendMail"
            >
              <complex-v-select
                v-model="recipients"
                :items="privateSettings.addresses"
                label="Recipients"
                :extra-option="user.email"
                extra-option-label="Send Me a Copy"
                :rules="[minLength(otherRecipients, 1, 'Required.')]"
              />
              <v-text-field
                v-model="subject"
                :rules="[fieldRequired]"
                label="Subject"
                filled
                color="secondary"
              />
              <tiptap-editor
                v-model="body"
                class="mb-5"
                placeholder="Body"
                :use-img="false"
                :disabled="submitting"
              />
              <p>
                Where's the file upload button? Sadly, our email service does
                not support file or image uploads. If you want to add files or
                images, you will have to add a link to a file shared in Google
                Drive, Dropbox, or other service.
              </p>
              <v-btn
                color="secondary"
                class="sectext--text"
                type="submit"
                :disabled="submitting"
                >Send</v-btn
              >
              <v-btn
                class="ml-4 errtext--text"
                color="error"
                type="button"
                :disabled="submitting"
                @click="cancel"
              >
                Cancel
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-dialog>
      <v-tooltip v-if="canMail && settings.mailURL" bottom>
        <template #activator="{ on }">
          <v-btn
            icon
            class="pritext--text"
            aria-label="Send Email"
            v-on="on"
            @click.stop="mail = true"
          >
            <v-icon>mdi-email</v-icon>
          </v-btn>
        </template>
        Send Email
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
import type { EmailData, VFormOptions } from "@/types";
import { useUser } from "@/store/user";
import { canMail } from "@/plugins/mailService";
import { computed, ref, type Ref } from "@vue/composition-api";
import {
  user,
  isLoggedIn,
  isAuthorized,
  isWebmaster
} from "@/plugins/authHandler";
import { fieldRequired, minLength } from "@/plugins/formRules";
import { TiptapEditor } from "@/components/asyncComponents";
import {
  loading,
  pageTitle,
  privateSettings,
  pushRouter,
  settings,
  specialPages
} from "@/plugins/routerStoreHelpers";
import { displayPageAlert } from "@/plugins/errorHandler";
import { useVuetify } from "@/plugins/contextInject";
import type { AuthError } from "firebase/auth";

const drawer = ref(false);
const mail = ref(false);
const recipients: Ref<string[]> = ref([]);
const submitting = ref(false);
const subject = ref("");
const body = ref("");
const mailer = ref({} as VFormOptions);
const vuetify = useVuetify();

const otherRecipients = computed(() => {
  return recipients.value.filter((value) => {
    return value !== user.value.email;
  });
});

const toggleDarkMode = () => {
  try {
    vuetify.theme.dark = !vuetify.theme.dark;
    localStorage.setItem("darkMode", `${vuetify.theme.dark}`);
  } catch (error) {
    displayPageAlert(
      `Whoops!  There was an error while toggling dark mode: ${error}`
    );
  }
};

const logout = async () => {
  try {
    const UserModule = useUser();
    await UserModule.logout();
    pushRouter("/");
  } catch (error) {
    const rawError = error as AuthError;
    displayPageAlert(rawError.message);
  }
};

const sendMail = async () => {
  if (!canMail.value) {
    return;
  }
  const isValid = mailer.value.validate() && body.value.length > 0;
  if (body.value.length < 1) {
    displayPageAlert("The message requires a body.");
    return;
  }
  if (!isValid) {
    return;
  }
  submitting.value = true;
  const postData: EmailData = {
    to: recipients.value.join(),
    subject: subject.value,
    body: body.value
  };
  if (user.value.displayName) {
    postData.sender = user.value.displayName;
  }
  if (user.value.email) {
    postData.reply = user.value.email;
  }
  try {
    const { sendEmail } = await import("@/plugins/mailService");
    await sendEmail(postData);
    displayPageAlert("Success!");
    mailer.value.reset();
    body.value = "";
    submitting.value = false;
    mail.value = false;
  } catch (error) {
    displayPageAlert(error as string);
    submitting.value = false;
  }
};

const cancel = () => {
  mailer.value.reset();
  body.value = "";
  mail.value = false;
};
</script>

<style lang="scss">
.v-navigation-drawer {
  height: 100% !important;
}
</style>
