<template>
  <v-card class="signup-sheet" outlined>
    <v-card-title class="cardtext--text">
      {{ retVal.header || "Signup Sheet" }}
      <v-tooltip bottom>
        <template #activator="{ on }">
          <v-btn
            v-if="canDelete"
            class="ml-auto"
            icon
            v-on="on"
            @click="deleteSelf(true)"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
        Delete Signup Sheet
      </v-tooltip>
    </v-card-title>
    <v-card-text class="cardtext--text">
      <v-switch
        v-model="retVal.useCard"
        color="secondary"
        label="Create Card on Page"
      />
      <v-text-field
        v-model="retVal.header"
        color="secondary"
        filled
        label="Header"
        :disabled="dragging"
      />
      <tiptap-editor
        v-model="retVal.text"
        :use-img="false"
        :disabled="dragging"
      />
      <v-spacer />
      <v-dialog v-if="settings.mailURL" v-model="details" max-width="500px">
        <template #activator="{ on, attrs }">
          <v-btn
            color="secondary"
            class="sectext--text"
            v-bind="attrs"
            v-on="on"
            ><v-icon left>mdi-email</v-icon> Email Details</v-btn
          >
        </template>
        <v-card>
          <v-card-title>Email Details</v-card-title>
          <v-card-text>
            <v-form
              id="detailsEmail"
              ref="detailsEmail"
              :disabled="submitting"
              @submit.prevent="sendDetails"
            >
              <v-select
                v-model="recipients"
                multiple
                filled
                :rules="[minLength(recipients, 1, 'Required.')]"
                :items="privateSettings.addresses"
                label="Recipients"
                color="secondary"
                item-color="secondary"
                item-text="text"
                item-value="value"
              >
                <template #prepend-item>
                  <v-list-item ripple @click="toggle">
                    <v-list-item-action>
                      <v-icon
                        :color="recipients.length > 0 ? 'secondary' : ''"
                        >{{ icon }}</v-icon
                      >
                    </v-list-item-action>
                    <v-list-item-content>
                      <v-list-item-title>Select All</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </template>
              </v-select>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="error"
              class="errtext--text ml-auto"
              :disabled="submitting"
              @click="cancelDetails"
              >Cancel</v-btn
            >
            <v-btn
              type="submit"
              form="detailsEmail"
              color="secondary"
              class="sectext--text"
              :disabled="submitting"
              >Send</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-spacer />
      <v-switch
        v-model="retVal.enabled"
        label="Allow Signups"
        color="secondary"
      />
      <v-switch
        v-model="retVal.multiple"
        label="Allow Multiple Signups"
        color="secondary"
      />
      <v-spacer />
      <h3>Event Shifts</h3>
      <v-spacer />
      <v-text-field
        v-for="(item, index) in retVal.times"
        :key="`t${index}`"
        v-model="retVal.times[index]"
        :label="`Shift ${index + 1}`"
        filled
        color="secondary"
        append-icon="mdi-delete"
        :disabled="dragging"
        @click:append="removeTime(index)"
      />
      <v-btn color="secondary" class="sectext--text" @click="addTime"
        ><v-icon left>mdi-plus</v-icon> Add Shift</v-btn
      >
      <v-spacer />
      <h3>Event Roles</h3>
      <v-spacer />
      <v-text-field
        v-for="(role, index) in retVal.roles"
        :key="`r${index}`"
        v-model="retVal.roles[index]"
        :label="`Role ${index + 1}`"
        filled
        color="secondary"
        append-icon="mdi-delete"
        :disabled="dragging"
        @click:append="removeRole(index)"
      />
      <v-btn color="secondary" class="sectext--text" @click="addRole"
        ><v-icon left>mdi-plus</v-icon> Add Role</v-btn
      >
      <v-spacer />
      <h3>Attendees</h3>
      <p>
        Click a row to remove it from the signup sheet. You do not need to click
        the Save button when removing signups for changes to take effect.
      </p>
      <v-data-table
        :headers="headers"
        :items="items"
        no-data-text="Nobody is signed up"
        item-key="key"
        @click:row="confirmRemove($event)"
      />
      <v-dialog v-if="settings.mailURL" v-model="mail" persistent>
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
            <v-form ref="mailer" :disabled="submitting" @submit.prevent="email">
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
  </v-card>
</template>

<script lang="ts" setup>
import sanitized from "@/plugins/dompurify";
import {
  CheckboxIcons,
  type EmailData,
  type SignupData,
  type VFormOptions
} from "@/types";
import {
  computed,
  onUpdated,
  ref,
  watch,
  type Ref
} from "@vue/composition-api";
import type { FieldValue, FirestoreError } from "firebase/firestore/lite";
import { fieldRequired, minLength } from "@/plugins/formRules";
import { user } from "@/plugins/authHandler";
import { displayPageAlert } from "@/plugins/errorHandler";
import { settings, privateSettings } from "@/plugins/routerStoreHelpers";

interface SignupItem {
  role: string;
  name: string;
  comments: string;
  uid: string;
  shift: string;
  email: string;
  key: string;
  time?: FieldValue;
}

interface Props {
  dragging: boolean;
  dbPath: string;
  canDelete: boolean;
  value: SignupData;
}

interface Emits {
  (e: "input", payload: SignupData): void;
  (e: "delete"): void;
}

const props = withDefaults(defineProps<Props>(), {
  dragging: false,
  dbPath: "",
  canDelete: true,
  value: () => {
    return {
      header: "",
      text: "",
      times: [],
      multiple: true,
      enabled: true,
      id: "",
      roles: [],
      useCard: true
    };
  }
});

const emit = defineEmits<Emits>();

const retVal = ref(props.value);
const mail = ref(false);
const subject = ref("");
const body = ref("");
const recipients: Ref<string[]> = ref([]);
const details = ref(false);
const submitting = ref(false);
const items: Ref<SignupItem[]> = ref([]);
const mailer = ref({} as VFormOptions);
const detailsEmail = ref({} as VFormOptions);

const cleanTxt = computed(() => {
  return sanitized(retVal.value.text);
});

const headers = computed(() => {
  if (retVal.value.times.length > 0 && retVal.value.roles.length > 0) {
    return [
      { text: "Shift", value: "shift" },
      { text: "Role", value: "role" },
      { text: "Name", value: "name" },
      { text: "Comments", value: "comments" }
    ];
  } else if (retVal.value.roles.length > 0) {
    return [
      { text: "Role", value: "role" },
      { text: "Name", value: "name" },
      { text: "Comments", value: "comments" }
    ];
  } else if (retVal.value.times.length > 0) {
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

const icon = computed(() => {
  if (privateSettings.value.addresses) {
    if (recipients.value.length === privateSettings.value.addresses.length) {
      return CheckboxIcons.CHECKED;
    } else if (
      recipients.value.length > 0 &&
      recipients.value.length !== privateSettings.value.addresses.length
    ) {
      return CheckboxIcons.INDETERMINATE;
    } else {
      return CheckboxIcons.UNCHECKED;
    }
  } else {
    return CheckboxIcons.UNCHECKED;
  }
});

watch(retVal, () => {
  retVal.value.text = cleanTxt.value;
});

const updateData = () => {
  emit("input", retVal.value);
};

const addTime = () => {
  retVal.value.times.push("");
  updateData();
};

const removeTime = (index: number) => {
  retVal.value.times.splice(index, 1);
  updateData();
};

const addRole = () => {
  retVal.value.roles.push("");
  updateData();
};

const removeRole = (index: number) => {
  retVal.value.roles.splice(index, 1);
  updateData();
};

const cancelEmail = () => {
  mail.value = false;
  subject.value = "";
  body.value = "";
  mailer.value.resetValidation();
};

const email = async () => {
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

const cancelDetails = () => {
  details.value = false;
  recipients.value = [];
  detailsEmail.value.resetValidation();
};

const sendDetails = async () => {
  const isValid = detailsEmail.value.validate();
  if (!isValid) {
    return;
  }

  submitting.value = true;
  const postData: EmailData = {
    to: recipients.value.join(),
    subject: `New Signup Available at YOUR_SITE_URL: ${retVal.value.header}`,
    body: `<p>A new signup sheet has been created at <a href="YOUR_SITE_URL" target="_blank" rel="noreferrer noopener nofollow">YOUR_SITE_URL</a> for "${retVal.value.header}".  See the event details below.</p>${retVal.value.text}`
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
    detailsEmail.value.reset();
    submitting.value = false;
    details.value = false;
  } catch (error) {
    displayPageAlert(error as string);
    submitting.value = false;
  }
};

const toggle = () => {
  if (privateSettings.value.addresses) {
    if (recipients.value.length >= privateSettings.value.addresses.length) {
      recipients.value = [];
    } else if (
      recipients.value.length < privateSettings.value.addresses.length
    ) {
      if (privateSettings.value.addresses.length > 0) {
        recipients.value = [];
        privateSettings.value.addresses.forEach((address) => {
          recipients.value.push(address.value);
        });
      }
    }
  } else {
    recipients.value = [];
  }
};

onUpdated(() => {
  updateData();
});

const getSignups = async () => {
  retVal.value.text = cleanTxt.value;
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
    updateData();
  } catch (error) {
    const rawError = error as FirestoreError;
    displayPageAlert(
      `An error occurred while getting the signups: ${rawError.message}`
    );
  }
};

const remove = async (row: SignupItem) => {
  const { firestore } = await import("@/plugins/firebase");
  const { deleteDoc, doc } = await import("firebase/firestore/lite");
  await deleteDoc(doc(firestore, `${props.dbPath}/${row.key}`));
  await getSignups();
};

const confirmRemove = (row: SignupItem) => {
  if (confirm("Are you sure you want to delete this signup?")) {
    remove(row);
  }
};

const deleteSelf = async (ask: boolean) => {
  if (ask) {
    if (
      !confirm(
        "Are you sure you want to delete this component?  ALL SIGNUPS WILL BE DELETED REGARDLESS OF SAVING!"
      )
    ) {
      return;
    }
  }

  await getSignups();
  items.value.forEach((item) => {
    remove(item);
  });
  emit("delete");
};

defineExpose({ deleteSelf });

getSignups();
</script>
