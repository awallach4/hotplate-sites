<template>
  <v-card class="message-stream-post" outlined>
    <v-card-title class="cardtext--text pl-6 pr-6">
      <v-profile-photo :image-path="message.img" :size="40" />
      <div>
        <p class="mb-0 pl-4 text-subtitle-2">
          {{ message.name }}
        </p>
        <v-subheader style="height: unset; line-height: 1.5rem">{{
          message.date
        }}</v-subheader>
      </div>
      <v-spacer />
      <v-menu
        v-if="isAuthorized && message.uid === user.uid"
        v-model="actionMenu"
        offset-y
        left
        bottom
        transition="slide-x-reverse-transition"
      >
        <template #activator="{ on, attrs }">
          <v-btn v-bind="attrs" icon v-on="on">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click.stop="openEditor">
            <v-list-item-title>Edit</v-list-item-title>
            <v-dialog v-model="editing" max-width="1200px" persistent>
              <v-card>
                <v-card-title>Edit Post</v-card-title>
                <v-card-text>
                  <tiptap-editor v-model="updatedContent" :use-img="false" />
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
                        :disabled="updating"
                        icon
                        @click="deletePostFile(item)"
                      >
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                      <a
                        :href="item.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        >{{ item.name }}</a
                      >
                    </li>
                  </ul>
                </v-card-text>
                <v-card-actions>
                  <v-dialog v-model="uploadDialog" max-width="300px" persistent>
                    <template #activator="{ on }">
                      <v-btn
                        outlined
                        color="secondary"
                        class="mb-2"
                        :disabled="updating"
                        v-on="on"
                      >
                        <v-icon left>mdi-paperclip</v-icon> Add
                      </v-btn>
                    </template>
                    <v-card color="card">
                      <v-card-title class="cardtext--text"
                        >Add Attachments</v-card-title
                      >
                      <v-card-text class="cardtext--text">
                        <v-file-input
                          v-model="fileInput"
                          filled
                          color="secondary"
                          label="Attach Files"
                          prepend-icon=""
                          prepend-inner-icon="mdi-paperclip"
                          multiple
                          :disabled="
                            uploadProgress !== 0 && uploadProgress !== 100
                          "
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
                          :disabled="
                            uploadProgress !== 0 && uploadProgress !== 100
                          "
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
                  <v-btn
                    color="error"
                    class="errtext--text ml-auto"
                    @click="editing = false"
                    >Cancel</v-btn
                  >
                  <v-btn
                    color="secondary"
                    class="sectext--text"
                    @click="updatePost"
                    >Save</v-btn
                  >
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-list-item>
          <v-list-item @click="remove">
            <v-list-item-title>Delete</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-card-title>
    <v-card-text class="cardtext--text pl-6 pr-6 pb-6">
      <span v-html="sanitized(message.content)" />
      <strong v-if="message.files.length > 0">Attachments</strong>
      <ul>
        <li v-for="file in message.files" :key="file.url">
          <a
            :href="file.url"
            target="_blank"
            download
            rel="noreferrer noopener nofollow"
            >{{ file.name }}</a
          >
        </li>
      </ul>
    </v-card-text>
    <v-divider v-if="message.comments.length > 0" />
    <v-card-text
      v-if="message.comments.length > 0"
      class="cardtext--text pl-6 pr-6 pb-6"
    >
      <strong>
        {{ message.comments.length }}
        {{ message.comments.length === 1 ? "comment" : "comments" }}
      </strong>
      <message-stream-comment
        v-for="(item, index) in message.comments"
        :key="index"
        :component-id="componentId"
        :comment="item"
        :message="message"
        @fetch="$emit('fetch')"
      />
    </v-card-text>
    <v-divider v-if="isAuthorized" />
    <v-card-actions v-if="isAuthorized" class="pl-6 pr-6 pt-4 pb-4">
      <div class="d-flex align-center" style="width: 100%">
        <v-profile-photo class="mr-4" :image-path="user.photoURL" :size="32" />
        <v-text-field
          v-model="comment"
          outlined
          rounded
          color="secondary"
          placeholder="Add comment"
          dense
          hide-details
          :disabled="commenting"
        >
          <template #append>
            <v-btn
              icon
              :disabled="!comment || comment.length < 1 || commenting"
              @click="addComment()"
            >
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </div>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
import sanitized from "@/plugins/dompurify";
import type {
  MessageStreamMessage,
  MessageStreamMessageComment,
  UploadedFile
} from "@/types";
import { ref, watch, type Ref } from "@vue/composition-api";
import { isAuthorized, user } from "@/plugins/authHandler";
import { useRoute } from "@/plugins/contextInject";
import {
  MessageStreamComment,
  TiptapEditor
} from "@/components/asyncComponents";
import type { FirestoreError } from "firebase/firestore/lite";
import { displayPageAlert } from "@/plugins/errorHandler";
import { deleteFile, uploadFile } from "@/plugins/firebaseStorage";

interface Props {
  message: MessageStreamMessage;
  storPath: string;
  componentId: string;
}
interface Emits {
  (e: "fetch"): void;
}
const props = withDefaults(defineProps<Props>(), {
  message: () => ({} as MessageStreamMessage),
  storPath: "",
  componentId: ""
});

const emit = defineEmits<Emits>();

const route = useRoute();
const comment = ref("");
const commenting = ref(false);
const editing = ref(false);
const actionMenu = ref(false);
const updatedContent = ref("");
const postFiles = ref(props.message.files);
const updating = ref(false);
const uploadProgress = ref(0);
const fileInput: Ref<File[]> = ref([]);
const uploadDialog = ref(false);

watch(editing, (newValue) => {
  if (newValue === false) {
    updatedContent.value = "";
  } else {
    updatedContent.value = props.message.content;
  }
});

const openEditor = () => {
  actionMenu.value = false;
  postFiles.value = props.message.files;
  editing.value = true;
};

const updatePost = async () => {
  if (!isAuthorized.value) {
    return;
  }
  if (props.message.uid !== user.value.uid) {
    return;
  }
  try {
    const hasEdited = props.message.date.includes(" ");
    let newDate = "";
    if (hasEdited) {
      newDate = `${props.message.date.slice(
        0,
        props.message.date.indexOf(" ")
      )} (Edited ${new Date().toLocaleDateString()})`;
    } else {
      newDate = `${
        props.message.date
      } (Edited ${new Date().toLocaleDateString()})`;
    }
    const { firestore } = await import("@/plugins/firebase");
    const { doc, updateDoc } = await import("firebase/firestore/lite");
    await updateDoc(
      doc(
        firestore,
        `pages/${route.params.SpecialPage}/components/${props.componentId}/messages/${props.message.id}`
      ),
      {
        content: updatedContent.value,
        date: newDate,
        files: postFiles.value
      }
    );
    emit("fetch");
    editing.value = false;
  } catch (error) {
    const rawError = error as FirestoreError;
    displayPageAlert(
      `An error occurred while editing the message: ${rawError.message}`
    );
    emit("fetch");
  }
};

const remove = async () => {
  if (!isAuthorized.value) {
    return;
  }
  if (props.message.uid !== user.value.uid) {
    return;
  }
  try {
    if (props.message.files) {
      props.message.files.forEach(async (file) => {
        await deleteFile(file.url);
      });
    }
  } catch (error) {
    displayPageAlert(
      `An error occurred while deleting the message's files: ${error}`
    );
    emit("fetch");
    return;
  }
  try {
    const { firestore } = await import("@/plugins/firebase");
    const { doc, deleteDoc } = await import("firebase/firestore/lite");
    await deleteDoc(
      doc(
        firestore,
        `pages/${route.params.SpecialPage}/components/${props.componentId}/messages/${props.message.id}`
      )
    );
    emit("fetch");
  } catch (error) {
    const rawError = error as FirestoreError;
    displayPageAlert(
      `An error occurred while deleting the message: ${rawError.message}`
    );
    emit("fetch");
  }
};

const addComment = async () => {
  if (!isAuthorized.value) {
    return;
  }
  commenting.value = true;
  const { generateString } = await import("@/plugins/stringGenerator");
  const newComment: MessageStreamMessageComment = {
    name: "Anonymous User",
    uid: user.value.uid,
    img: user.value.photoURL,
    id: generateString(20),
    content: comment.value,
    date: new Date().toLocaleDateString()
  };
  if (user.value.displayName) {
    newComment.name = user.value.displayName;
  }
  try {
    const { firestore } = await import("@/plugins/firebase");
    const { arrayUnion, doc, updateDoc } = await import(
      "firebase/firestore/lite"
    );
    await updateDoc(
      doc(
        firestore,
        `pages/${route.params.SpecialPage}/components/${props.componentId}/messages/${props.message.id}`
      ),
      { comments: arrayUnion(newComment) }
    );
    emit("fetch");
  } catch (error) {
    const rawError = error as FirestoreError;
    displayPageAlert(
      `An error occurred while posting the comment: ${rawError.message}`
    );
    emit("fetch");
  }
  comment.value = "";
  commenting.value = false;
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

<style lang="scss">
.message-stream-post {
  .v-text-field:not(.v-select) .v-input__append-inner {
    margin-top: 2px !important;
    margin-right: -16px;
  }
}
</style>
