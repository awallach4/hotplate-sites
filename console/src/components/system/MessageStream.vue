<template>
  <v-drag-frame
    v-model="retVal.hidden"
    :not-card="true"
    :can-delete="canDelete"
    name="Message Stream"
    header="Message Stream"
    class="message-stream"
    @delete="deleteSelf(true)"
  >
    <v-card-text class="cardtext--text">
      <p>
        Any posts from this console will be labeled as "Admin". You do not need
        to click the Save button after adding or deleting posts or comments.
      </p>
      <v-spacer />
      <message-stream-creator
        :component-id="metaData.id"
        :stor-path="metaData.storPath"
        :db-path="dbPath"
        @fetch="getMessages"
      />
      <v-spacer />
      <v-card v-if="messages.length < 1" outlined>
        <v-card-text class="secondary--text">
          <h3 class="my-2 text-h5">
            View updates and connect with others here
          </h3>
          <p class="body-1">Why not create a post?</p>
        </v-card-text>
      </v-card>
      <div v-for="(message, index) in messages" :key="index">
        <message-stream-post
          :component-id="metaData.id"
          :db-path="dbPath"
          :message="message"
          @fetch="getMessages"
        />
        <v-spacer />
      </div>
    </v-card-text>
  </v-drag-frame>
</template>

<script lang="ts" setup>
import { displayPageAlert } from "@/plugins/errorHandler";
import { deleteFile } from "@/plugins/firebaseStorage";
import type { ComponentMetaData, MessageStreamMessage } from "@/types";
import { onUpdated, ref, type Ref } from "@vue/composition-api";
import type { FirestoreError } from "firebase/firestore/lite";

interface MessageStreamData {
  hidden: boolean;
}

interface Props {
  dbPath: string;
  canDelete: boolean;
  metaData: ComponentMetaData;
  value: MessageStreamData;
}

interface Emits {
  (e: "input", payload: MessageStreamData): void;
  (e: "delete"): void;
}

const props = withDefaults(defineProps<Props>(), {
  dbPath: "",
  canDelete: true,
  metaData: () => {
    return {
      id: "",
      storPath: ""
    };
  },
  value: () => {
    return {
      hidden: false
    };
  }
});

const emit = defineEmits<Emits>();

const retVal = ref(props.value);
const messages: Ref<MessageStreamMessage[]> = ref([]);

const updateData = () => {
  emit("input", retVal.value);
};

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
          `pages${props.dbPath}/components/${props.metaData.id}/messages`
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
    const rawError = error as FirestoreError;
    displayPageAlert(
      `An error occurred while getting the messages: ${rawError.message}`
    );
  }

  updateData();
};

const deleteSelf = async (ask: boolean) => {
  if (ask) {
    if (
      !confirm(
        "Are you sure you want to delete this component?  ALL MESSAGES AND COMMENTS WILL BE PERMANENTLY DELETED, REGARDLESS OF SAVING!"
      )
    ) {
      return;
    }
  }

  await getMessages();
  messages.value.forEach(async (message) => {
    try {
      if (message.files) {
        message.files.forEach(async (file) => {
          await deleteFile(file.url);
        });
      }
    } catch (error) {
      displayPageAlert(
        `An error occurred while deleting the post files: ${error}`
      );
      return;
    }

    try {
      const { firestore } = await import("@/plugins/firebase");
      const { deleteDoc, doc } = await import("firebase/firestore/lite");
      await deleteDoc(
        doc(
          firestore,
          `pages${props.dbPath}/components/${props.metaData.id}/messages/${message.id}`
        )
      );
    } catch (error) {
      const rawError = error as FirestoreError;
      displayPageAlert(
        `An error occurred while deleting the posts: ${rawError.message}`
      );
    }
  });
  emit("delete");
};

defineExpose({ deleteSelf });

onUpdated(() => {
  updateData();
});

getMessages();
</script>

<style lang="scss" scoped>
.spacer {
  height: 24px;
}
</style>
