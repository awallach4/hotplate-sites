<template>
  <v-card
    v-if="!editing"
    :ripple="false"
    class="elevation-5"
    role="button"
    @click="editing = true"
    @keypress.space.prevent="editing = true"
    @keypress.enter.prevent="editing = true"
  >
    <v-card-text class="pl-6 pr-6 editor d-flex align-center">
      <v-profile-photo :image-path="user.photoURL" :size="40" />
      <div>
        <p class="ma-0 pl-4 share">Share something with everyone...</p>
      </div>
    </v-card-text>
  </v-card>
  <v-card v-else color="card" class="elevation-5">
    <v-card-text class="pa-6 editor cardtext--text">
      <tiptap-editor
        v-model="postContent"
        placeholder="Share with everyone"
        :use-img="false"
        :disabled="submitting"
      />
      <v-spacer v-if="postFiles.length > 0" style="height: 24px" />
      <strong v-if="postFiles.length > 0">Attachments</strong>
      <ul v-if="postFiles.length > 0">
        <li
          v-for="item in postFiles"
          :key="item.url"
          class="mb-4 d-flex align-center list-style-none"
        >
          <v-btn
            class="ml-n4 mr-2"
            :disabled="submitting"
            icon
            @click="deletePostFile(item)"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
          <a :href="item.url" target="_blank" rel="noopener noreferrer">{{
            item.name
          }}</a>
        </li>
      </ul>
    </v-card-text>
    <v-card-actions class="d-flex flex-wrap pr-6 pl-6">
      <v-dialog v-model="uploadDialog" max-width="300px" persistent>
        <template #activator="{ on }">
          <v-btn
            outlined
            color="secondary"
            class="mb-2"
            :disabled="submitting"
            v-on="on"
          >
            <v-icon left>mdi-paperclip</v-icon> Add
          </v-btn>
        </template>
        <v-card color="card">
          <v-card-title class="cardtext--text">Add Attachments</v-card-title>
          <v-card-text class="cardtext--text">
            <v-file-input
              v-model="fileInput"
              filled
              color="secondary"
              label="Attach Files"
              prepend-icon=""
              prepend-inner-icon="mdi-paperclip"
              multiple
              :disabled="uploadProgress !== 0 && uploadProgress !== 100"
            />
            <v-progress-linear
              :active="uploadProgress !== 0"
              background-opacity=".3"
              buffer-value="100"
              height="4"
              rounded
              :value="uploadProgress"
              color="secondary"
            />
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn
              text
              :disabled="uploadProgress !== 0 && uploadProgress !== 100"
              @click="
                uploadDialog = false;
                fileInput = [];
              "
            >
              Cancel
            </v-btn>
            <v-btn
              color="secondary"
              class="sectext--text"
              :disabled="
                fileInput.length <= 0 ||
                (uploadProgress !== 0 && uploadProgress !== 100)
              "
              @click="attachFile"
            >
              Add
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-switch
        v-if="canMail && settings.mailURL && settings.useEmail"
        v-model="email"
        label="Send Email"
        color="secondary"
        class="ml-4 mr-4 mb-2"
        :disabled="submitting"
      />
      <complex-v-select
        v-if="email && canMail && settings.mailURL && settings.useEmail"
        v-model="recipients"
        :items="privateSettings.addresses"
        :disabled="submitting"
        label="Recipients"
        class="mr-4 mb-2"
        style="max-width: 300px"
      />
      <v-spacer />
      <div class="mb-2">
        <v-btn text :disabled="submitting" @click.stop="cancel">Cancel</v-btn>
        <v-btn
          color="secondary"
          class="sectext--text ml-2"
          :disabled="postContent.length <= 0 || submitting"
          @click.stop="addPost"
        >
          Post
        </v-btn>
      </div>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
import { user } from "@/plugins/authHandler";
import { canMail } from "@/plugins/mailService";
import type { EmailData, MessageStreamMessage, UploadedFile } from "@/types";
import { ref, type Ref } from "@vue/composition-api";
import { useRoute } from "@/plugins/contextInject";
import { TiptapEditor, VProfilePhoto } from "@/components/asyncComponents";
import { privateSettings, settings } from "@/plugins/routerStoreHelpers";
import { displayPageAlert, getFirestoreError } from "@/plugins/errorHandler";
import type { FirestoreError } from "firebase/firestore/lite";
import { deleteFile, uploadFile } from "@/plugins/firebaseStorage";
import { companyName } from "@/CLIENT_CONFIG";

interface Props {
  storPath: string;
  componentId: string;
}
interface Emits {
  (e: "fetch"): void;
}
const props = withDefaults(defineProps<Props>(), {
  storPath: "",
  componentId: ""
});
const emit = defineEmits<Emits>();

const route = useRoute();
const editing = ref(false);
const postContent = ref("");
const postFiles: Ref<UploadedFile[]> = ref([]);
const fileInput: Ref<File[]> = ref([]);
const email = ref(false);
const recipients: Ref<string[]> = ref([]);
const uploadProgress = ref(0);
const submitting = ref(false);
const uploadDialog = ref(false);

const cancel = () => {
  postContent.value = "";
  postFiles.value = [];
  recipients.value = [];
  editing.value = false;
};

const addPost = async () => {
  submitting.value = true;
  const { serverTimestamp } = await import("firebase/firestore/lite");
  const { generateString } = await import("@/plugins/stringGenerator");
  const message: MessageStreamMessage = {
    name: "Anonymous User",
    uid: user.value.uid,
    id: generateString(20),
    img: user.value.photoURL || "",
    files: postFiles.value,
    content: postContent.value,
    date: new Date().toLocaleDateString(),
    comments: [],
    createdAt: serverTimestamp()
  };
  if (user.value.displayName) {
    message.name = user.value.displayName;
  }
  try {
    const { firestore } = await import("@/plugins/firebase");
    const { doc, setDoc } = await import("firebase/firestore/lite");
    await setDoc(
      doc(
        firestore,
        `pages/${route.params.BasePage}/components/${props.componentId}/messages/${message.id}`
      ),
      { ...message }
    );
    emit("fetch");
  } catch (error) {
    displayPageAlert(
      `An error occurred while posting: ${getFirestoreError(
        error as FirestoreError
      )}`
    );
    emit("fetch");
    submitting.value = false;
    return;
  }
  if (email.value) {
    let body = postContent.value;
    if (message.files.length > 0) {
      const list: string[] = [];
      message.files.forEach((file) => {
        list.push(
          `<li><a href="${file.url}" target="_blank" download rel="noreferrer noopener">${file.name}</a></li>`
        );
      });
      const string = list.toString().replace(/,/g, "");
      body = `${postContent.value}<br /><strong>Attachments</strong><ul>${string}</ul>`;
    }
    const postData: EmailData = {
      to: recipients.value.join(),
      subject: "Anonymous User Posted to the Message Board",
      body,
      sender: `${companyName} Message Board`
    };
    if (user.value.email) {
      postData.reply = user.value.email;
    }
    if (user.value.displayName) {
      postData.subject = `${user.value.displayName} Posted to the Message Board`;
    }
    try {
      const { sendEmail } = await import("@/plugins/mailService");
      await sendEmail(postData);
    } catch (error) {
      displayPageAlert(error as string);
    }
  }
  cancel();
  editing.value = false;
  submitting.value = false;
};

const attachFile = () => {
  fileInput.value.forEach(async (file) => {
    const fileURL = await uploadFile(
      `${props.storPath}/${file.name}`,
      file,
      (url) => {
        const index = postFiles.value.map((e) => e.url).indexOf(url);
        postFiles.value.splice(index, 1);
      },
      (snapshot) => {
        uploadProgress.value =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      }
    );

    try {
      uploadProgress.value = 100;
      postFiles.value.push({ name: file.name, url: fileURL });
    } catch (error) {
      displayPageAlert(
        `An error occurred while getting the file URL(s): ${error}`
      );
    }
  });
  fileInput.value = [];
  uploadProgress.value = 0;
  uploadDialog.value = false;
};

const deletePostFile = async (item: UploadedFile) => {
  try {
    await deleteFile(item.url);
    postFiles.value.splice(postFiles.value.indexOf(item), 1);
  } catch (error) {
    displayPageAlert(`An error occurred while deleting the file(s): ${error}`);
  }
};
</script>

<style lang="scss" scoped>
.editor:hover {
  .share {
    color: var(--v-secondary-base);
  }
}
</style>
