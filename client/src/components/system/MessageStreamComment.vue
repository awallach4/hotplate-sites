<template>
  <div class="d-flex align-start mt-4" style="width: 100%">
    <v-profile-photo class="mr-4" :image-path="comment.img" :size="32" />
    <div>
      <p class="mb-0">
        <strong>{{ comment.name }}</strong>
        <span class="pl-2" style="font-size: 0.75rem">{{ comment.date }}</span>
      </p>
      <p class="mb-0">{{ comment.content }}</p>
    </div>
    <v-spacer />
    <v-menu
      v-if="isAuthorized && comment.uid === user.uid"
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
        <v-list-item @click="removeComment()">
          <v-list-item-title>Delete</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script lang="ts" setup>
import { isAuthorized, user } from "@/plugins/authHandler";
import { useRoute } from "vue-router/composables";
import { displayPageAlert, getFirestoreError } from "@/plugins/errorHandler";
import type {
  MessageStreamMessage,
  MessageStreamMessageComment
} from "@/types";
import type { FirestoreError } from "firebase/firestore/lite";

interface Props {
  comment: MessageStreamMessageComment;
  message: MessageStreamMessage;
  componentId: string;
}
interface Emits {
  (e: "fetch"): void;
}
const props = withDefaults(defineProps<Props>(), {
  comment: () => ({} as MessageStreamMessageComment),
  message: () => ({} as MessageStreamMessage),
  componentId: ""
});
const emit = defineEmits<Emits>();

const route = useRoute();
const removeComment = async () => {
  if (!isAuthorized.value || props.comment.uid !== user.value.uid) {
    return;
  }
  try {
    const { firestore } = await import("@/plugins/firebase");
    const { arrayRemove, doc, updateDoc } = await import(
      "firebase/firestore/lite"
    );
    await updateDoc(
      doc(
        firestore,
        `pages/${route.params.BasePage}/components/${props.componentId}/messages/${props.message.id}`
      ),
      { comments: arrayRemove(props.comment) }
    );
    emit("fetch");
  } catch (error) {
    displayPageAlert(
      `An error occurred while deleting the comment: ${getFirestoreError(
        error as FirestoreError
      )}`
    );
    emit("fetch");
  }
};
</script>
