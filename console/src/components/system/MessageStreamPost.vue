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
      <v-menu offset-y left bottom transition="slide-x-reverse-transition">
        <template #activator="{ on, attrs }">
          <v-btn v-bind="attrs" icon v-on="on">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="remove()">
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
        :db-path="dbPath"
        :comment="item"
        :message="message"
        @fetch="$emit('fetch')"
      />
    </v-card-text>
    <v-divider />
    <v-card-actions class="pl-6 pr-6 pt-4 pb-4">
      <div class="d-flex align-center" style="width: 100%">
        <v-profile-photo class="mr-4" image-path="/profile.png" :size="32" />
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
import { displayPageAlert } from "@/plugins/errorHandler";
import { deleteFile } from "@/plugins/firebaseStorage";
import type {
  MessageStreamMessage,
  MessageStreamMessageComment
} from "@/types";
import { ref } from "@vue/composition-api";
import type { FirestoreError } from "firebase/firestore/lite";
import MessageStreamComment from "./MessageStreamComment.vue";

interface Props {
  dbPath: string;
  message: MessageStreamMessage;
  componentId: string;
}

interface Emits {
  (e: "fetch"): void;
}

const props = withDefaults(defineProps<Props>(), {
  dbPath: "",
  message: () => {
    return {} as MessageStreamMessage;
  },
  componentId: ""
});

const emit = defineEmits<Emits>();

const comment = ref("");
const commenting = ref(false);

const remove = async () => {
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
    const { deleteDoc, doc } = await import("firebase/firestore/lite");
    await deleteDoc(
      doc(
        firestore,
        `pages${props.dbPath}/components/${props.componentId}/messages/${props.message.id}`
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
  commenting.value = true;
  const { generateString } = await import("@/plugins/stringGenerator");
  const newComment: MessageStreamMessageComment = {
    name: "Admin",
    uid: "admin",
    img: null,
    id: generateString(20),
    content: comment.value,
    date: new Date().toLocaleDateString()
  };

  try {
    const { firestore } = await import("@/plugins/firebase");
    const { arrayUnion, doc, updateDoc } = await import(
      "firebase/firestore/lite"
    );
    await updateDoc(
      doc(
        firestore,
        `pages${props.dbPath}/components/${props.componentId}/messages/${props.message.id}`
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
</script>

<style lang="scss">
.message-stream-post {
  .v-text-field:not(.v-select) {
    .v-input__append-inner {
      margin-top: 2px !important;
      margin-right: -16px;
    }
  }
}
</style>
