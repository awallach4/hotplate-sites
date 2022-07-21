<template>
  <div class="message-stream">
    <message-stream-creator
      v-if="isAuthorized"
      :stor-path="metaData.storPath"
      :component-id="metaData.id"
      @fetch="getMessages()"
    />
    <v-spacer v-if="isAuthorized" />
    <v-card v-if="messages.length < 1" outlined>
      <v-card-text class="secondary--text">
        <h3 class="my-2 text-h5">View updates and connect with others here</h3>
        <p class="body-1">Why not create a post?</p>
      </v-card-text>
    </v-card>
    <div v-for="(message, index) in messages" :key="index">
      <message-stream-post
        :message="message"
        :stor-path="metaData.storPath"
        :component-id="metaData.id"
        @fetch="getMessages()"
      />
      <v-spacer />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ComponentMetaData, MessageStreamMessage } from "@/types";
import { ref, type Ref } from "vue";
import type { FirestoreError } from "firebase/firestore/lite";
import { isAuthorized } from "@/plugins/authHandler";
import { useRoute } from "@/plugins/contextInject";
import { displayPageAlert, getFirestoreError } from "@/plugins/errorHandler";
import {
  MessageStreamCreator,
  MessageStreamPost
} from "@/components/asyncComponents";

interface Props {
  metaData: ComponentMetaData;
}
const props = withDefaults(defineProps<Props>(), {
  metaData: () => {
    return { id: "", storPath: "" };
  }
});

const route = useRoute();
const messages: Ref<MessageStreamMessage[]> = ref([]);

const getMessages = async () => {
  try {
    const { firestore } = await import("@/plugins/firebase");
    const { collection, getDocs, orderBy, query } = await import(
      "firebase/firestore/lite"
    );
    const messageDocs = await getDocs(
      query(
        collection(
          firestore,
          `pages/${route.params.BasePage}/components/${props.metaData.id}/messages`
        ),
        orderBy("createdAt", "desc")
      )
    );

    messages.value = [];
    messageDocs.forEach((message) => {
      const data = message.data() as MessageStreamMessage;
      messages.value.push(data);
    });
  } catch (error) {
    displayPageAlert(
      `An error occurred while getting the messages: ${getFirestoreError(
        error as FirestoreError
      )}`
    );
  }
};

getMessages();
</script>

<style lang="scss" scoped>
.spacer {
  height: 24px;
}
</style>
