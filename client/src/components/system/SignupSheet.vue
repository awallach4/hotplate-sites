<template>
  <div class="sign-up">
    <v-card :flat="!data.useCard" :color="data.useCard ? 'card' : 'background'">
      <v-card-title :class="data.useCard ? 'cardtext--text' : 'bgtext--text'">{{
        data.header
      }}</v-card-title>
      <v-card-text
        :class="data.useCard ? 'cardtext--text' : 'bgtext--text'"
        v-html="sanitized(data.text)"
      />
      <v-data-table
        :headers="headers"
        :items="items"
        no-data-text="Nobody is signed up"
        item-key="key"
        @click:row="remove($event)"
      />
      <v-card-text>
        <v-dialog v-if="settings.mailURL && canMail" v-model="mail" persistent>
          <template #activator="{ on }">
            <v-btn
              color="secondary"
              class="sectext--text"
              :disabled="items.length < 1"
              v-on="on"
            >
              <v-icon left>mdi-email</v-icon>Email Attendees
            </v-btn>
          </template>
          <v-card>
            <v-card-title>Email Attendees</v-card-title>
            <v-card-text>
              <v-form
                ref="mailer"
                :disabled="submitting"
                @submit.prevent="email"
              >
                <v-text-field
                  v-model="subject"
                  label="Subject"
                  filled
                  :rules="[fieldRequired]"
                  color="secondary"
                />
                <tiptap-editor
                  v-model="body"
                  :use-img="false"
                  placeholder="Body"
                  :disabled="submitting"
                />
                <v-spacer />
                <v-btn
                  type="submit"
                  color="secondary"
                  class="sectext--text"
                  :disabled="submitting"
                >
                  Send
                </v-btn>
                <v-btn
                  type="button"
                  color="error"
                  class="errtext--text ml-4"
                  :disabled="submitting"
                  @click="cancelEmail"
                >
                  Cancel
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>
        </v-dialog>
      </v-card-text>
      <v-card-text
        v-if="isAuthorized && isSignedUp && data.enabled"
        :class="data.useCard ? 'cardtext--text' : 'bgtext--text'"
      >
        <strong
          >You're signed up! If you wish to cancel, just click your name to
          remove it from the list.</strong
        >
      </v-card-text>
      <v-card-text
        v-if="isAuthorized && !data.enabled"
        :class="data.useCard ? 'cardtext--text' : 'bgtext--text'"
      >
        <strong
          >This signup sheet is locked. You cannot make changes to it.</strong
        >
      </v-card-text>
      <template
        v-if="isAuthorized && (!isSignedUp || data.multiple) && data.enabled"
      >
        <v-card-subtitle
          :class="data.useCard ? 'cardtext--text' : 'bgtext--text'"
          >Want to Attend the Event? Sign Up Here!</v-card-subtitle
        >
        <v-card-text :class="data.useCard ? 'cardtext--text' : 'bgtext--text'">
          <v-form ref="form" :disabled="submitting" @submit.prevent="add">
            <p>You will be signed up as:</p>
            <v-text-field
              v-model="name"
              label="Name"
              outlined
              dense
              color="secondary"
              :rules="[fieldRequired]"
            />
            <v-select
              v-if="data.roles.length > 0"
              v-model="role"
              label="Role"
              outlined
              dense
              :items="data.roles"
              color="secondary"
              item-color="secondary"
              :rules="[fieldRequired]"
            />
            <v-select
              v-if="data.times.length > 0"
              v-model="shift"
              :items="data.times"
              :rules="[fieldRequired]"
              outlined
              dense
              label="Select Time Shift"
              color="secondary"
              item-color="secondary"
            />
            <v-text-field
              v-model="comments"
              outlined
              dense
              label="Comments"
              color="secondary"
            />
            <v-btn
              type="submit"
              block
              color="secondary"
              class="sectext--text"
              :disabled="submitting"
            >
              Sign Up
            </v-btn>
          </v-form>
        </v-card-text>
      </template>
      <v-card-text v-else-if="!isAuthorized" class="cardtext--text">
        <strong>Please sign in with an authorized account to sign up.</strong>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import type { EmailData, SignupData, SignupItem, VFormOptions } from "@/types";
import sanitized from "@/plugins/dompurify";
import { canMail } from "@/plugins/mailService";
import { computed, onMounted, ref, type Ref } from "@vue/composition-api";
import { isAuthorized, user } from "@/plugins/authHandler";
import type { FirestoreError } from "firebase/firestore/lite";
import { fieldRequired } from "@/plugins/formRules";
import { TiptapEditor } from "@/components/asyncComponents";
import { displayPageAlert } from "@/plugins/errorHandler";
import { settings } from "@/plugins/routerStoreHelpers";

interface Props {
  data: SignupData;
  dbPath: string;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => {
    return {
      header: "",
      text: "",
      times: [],
      multiple: true,
      enabled: false,
      roles: [],
      id: "",
      useCard: true,
      hidden: false
    };
  },
  dbPath: ""
});

const comments = ref("");
const shift = ref("");
const name = ref("");
const role = ref("");
const submitting = ref(false);
const mail = ref(false);
const subject = ref("");
const body = ref("");
const items: Ref<SignupItem[]> = ref([]);
const form = ref({} as VFormOptions);
const mailer = ref({} as VFormOptions);

const isSignedUp = computed(() => {
  if (!isAuthorized.value) {
    return false;
  }
  const isSignedUp: boolean[] = [];
  items.value.forEach((item) => {
    if (item.uid === user.value.uid) {
      isSignedUp.push(true);
    } else {
      isSignedUp.push(false);
    }
  });
  return isSignedUp.includes(true);
});

const headers = computed(() => {
  if (props.data.times.length > 0 && props.data.roles.length > 0) {
    return [
      { text: "Shift", value: "shift" },
      { text: "Role", value: "role" },
      { text: "Name", value: "name" },
      { text: "Comments", value: "comments" }
    ];
  } else if (props.data.times.length <= 0 && props.data.roles.length > 0) {
    return [
      { text: "Role", value: "role" },
      { text: "Name", value: "name" },
      { text: "Comments", value: "comments" }
    ];
  } else if (props.data.times.length > 0 && props.data.roles.length <= 0) {
    return [
      { text: "Shift", value: "shift" },
      { text: "Name", value: "name" },
      { text: "Comments", value: "comments" }
    ];
  } else {
    return [
      { text: "Name", value: "name" },
      { text: "Comments", value: "comments" }
    ];
  }
});

const getSignups = async () => {
  try {
    const { firestore } = await import("@/plugins/firebase");
    const { collection, getDocs, orderBy, query } = await import(
      "firebase/firestore/lite"
    );
    const signupDocs = await getDocs(
      query(collection(firestore, props.dbPath), orderBy("time", "asc"))
    );

    items.value = [];
    signupDocs.forEach((signup) => {
      const data = signup.data() as SignupItem;
      items.value.push(data);
    });
  } catch (error) {
    const rawError = error as FirestoreError;
    displayPageAlert(
      `An error occurred while getting the signups: ${rawError.message}`
    );
  }
};

const add = async () => {
  if (!isAuthorized.value) {
    return;
  }
  submitting.value = true;
  const isValid = form.value.validate();
  if (!isValid) {
    submitting.value = false;
    return;
  }
  if (!props.data.enabled) {
    submitting.value = false;
    return;
  }
  if (!isSignedUp.value || props.data.multiple) {
    const { generateString } = await import("@/plugins/stringGenerator");
    const { serverTimestamp } = await import("firebase/firestore/lite");
    const member = {
      role: role.value,
      name: name.value,
      comments: comments.value,
      uid: user.value.uid,
      shift: shift.value,
      email: "",
      key: generateString(20),
      time: serverTimestamp()
    };
    if (user.value.email) {
      member.email = user.value.email;
    }
    try {
      const { firestore } = await import("@/plugins/firebase");
      const { doc, setDoc } = await import("firebase/firestore/lite");
      await setDoc(doc(firestore, `${props.dbPath}/${member.key}`), member);
      await getSignups();
    } catch (error) {
      const rawError = error as FirestoreError;
      displayPageAlert(
        `An error occurred while signing up: ${rawError.message}`
      );
    }
    comments.value = "";
    role.value = "";
    if (user.value.displayName) {
      name.value = user.value.displayName;
    } else {
      name.value = "Anonymous User";
    }
    shift.value = "";
    submitting.value = false;
    if (form.value) {
      form.value.resetValidation();
    }
  } else {
    displayPageAlert("You are already signed up!");
    submitting.value = false;
  }
};

const remove = async (row: SignupItem) => {
  if (!isAuthorized.value) {
    return;
  }
  if (row.uid !== user.value.uid) {
    return;
  }
  if (!props.data.enabled) {
    return;
  }
  if (
    confirm("Are you sure you want to remove yourself from the sign up sheet?")
  ) {
    try {
      const { firestore } = await import("@/plugins/firebase");
      const { deleteDoc, doc } = await import("firebase/firestore/lite");
      await deleteDoc(doc(firestore, `${props.dbPath}/${row.key}`));
      await getSignups();
    } catch (error) {
      const rawError = error as FirestoreError;
      displayPageAlert(
        `An error occurred while removing your signup: ${rawError.message}`
      );
    }
  }
};

const cancelEmail = () => {
  mail.value = false;
  subject.value = "";
  body.value = "";
  mailer.value.resetValidation();
};

const email = async () => {
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
  const emails: string[] = [];
  await getSignups();
  items.value.forEach((item) => {
    if (item.email) {
      emails.push(item.email);
    }
  });
  const postData: EmailData = {
    to: emails.join(),
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

onMounted(() => {
  if (isAuthorized.value && user.value.displayName) {
    name.value = user.value.displayName;
  } else {
    name.value = "Anonymous User";
  }
  getSignups();
});
</script>

<style lang="scss" scoped>
img {
  max-width: 300px;
  max-height: 300px;
}

.spacer {
  height: 24px;
}
</style>
