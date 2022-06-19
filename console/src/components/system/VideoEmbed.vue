<template>
  <v-drag-frame
    v-model="retVal.hidden"
    :not-card="false"
    :can-delete="canDelete"
    name="Video"
    :header="retVal.header || 'Video'"
    class="video-embed"
    @delete="deleteSelf(true)"
  >
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
        placeholder="Description"
        :use-img="false"
        :disabled="dragging"
      />
      <v-spacer />
      <video
        v-if="retVal.storPath"
        controls
        :style="{
          'max-width': $vuetify.breakpoint.name === 'xs' ? '150px' : '300px'
        }"
      >
        <source :src="retVal.storPath" :type="retVal.type" />
        We're sorry, but it looks like your browser does not support videos.
      </video>
      <v-spacer />
      <v-file-input
        ref="fileInput"
        v-model="videoFile"
        accept="video/mp4"
        prepend-inner-icon="mdi-video-image"
        prepend-icon=""
        label="Video Upload"
        filled
        color="secondary"
        :disabled="(uploadProgress !== 0 && uploadProgress !== 100) || dragging"
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
      <v-spacer v-if="uploadProgress !== 0" />
      <v-btn
        color="secondary"
        class="sectext--text"
        :block="$vuetify.breakpoint.name === 'xs'"
        :disabled="!canUpload"
        @click="uploadItem"
        >Upload</v-btn
      >
      <v-spacer v-if="$vuetify.breakpoint.name === 'xs'" />
      <v-btn
        color="error"
        class="errtext--text"
        :class="{ 'ml-5': $vuetify.breakpoint.name !== 'xs' }"
        :block="$vuetify.breakpoint.name === 'xs'"
        :disabled="!retVal.storPath"
        @click="deleteItem"
        >Delete Video</v-btn
      >
    </v-card-text>
  </v-drag-frame>
</template>

<script lang="ts" setup>
import type { ComponentMetaData } from "@/types";
import sanitized from "@/plugins/dompurify";
import {
  computed,
  onUpdated,
  ref,
  watch,
  type Ref
} from "@vue/composition-api";
import { deleteFile, uploadFile } from "@/plugins/firebaseStorage";
import { displayPageAlert } from "@/plugins/errorHandler";

interface VideoEmbedData {
  header: string;
  text: string;
  storPath: string;
  type: string;
  useCard: boolean;
  hidden: boolean;
}

interface Props {
  dragging: boolean;
  canDelete: boolean;
  metaData: ComponentMetaData;
  value: VideoEmbedData;
}

interface Emits {
  (e: "input", payload: VideoEmbedData): void;
  (e: "delete"): void;
}

const props = withDefaults(defineProps<Props>(), {
  dragging: false,
  canDelete: true,
  metaData: () => {
    return {
      id: "",
      storPath: ""
    };
  },
  value: () => {
    return {
      header: "",
      text: "",
      storPath: "",
      type: "",
      useCard: true,
      hidden: false
    };
  }
});

const emit = defineEmits<Emits>();

const retVal = ref(props.value);
const videoFile: Ref<File | null> = ref(null);
const uploadProgress = ref(0);

const cleanTxt = computed(() => {
  return sanitized(retVal.value.text);
});

const canUpload = computed(() => {
  if (
    videoFile.value &&
    (uploadProgress.value === 0 || uploadProgress.value === 100) &&
    !retVal.value.storPath
  ) {
    return true;
  } else {
    return false;
  }
});

watch(retVal, () => {
  retVal.value.text = cleanTxt.value;
});

const updateData = () => {
  emit("input", retVal.value);
};

const deleteSelf = async (ask: boolean) => {
  if (ask) {
    if (
      !confirm(
        "Are you sure you want to delete this component?  ALL VIDEOS WILL BE DELETED REGARDLESS OF SAVING!"
      )
    ) {
      return;
    }
  }

  if (retVal.value.storPath) {
    try {
      await deleteFile(retVal.value.storPath);
    } catch (error) {
      displayPageAlert(`An error occurred while deleting the video: ${error}`);
    }
  }
  emit("delete");
};

defineExpose({ deleteSelf });

const uploadItem = async () => {
  if (videoFile.value) {
    const fileURL = await uploadFile(
      `${props.metaData.storPath}/${videoFile.value.name}`,
      videoFile.value,
      () => {
        retVal.value.storPath = "";
      },
      (snapshot) => {
        uploadProgress.value =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      }
    );
    try {
      uploadProgress.value = 100;
      retVal.value.storPath = fileURL;
      videoFile.value = null;
      uploadProgress.value = 0;
    } catch (error) {
      displayPageAlert(
        `An error occurred while getting the video URL: ${error}`
      );
    }
  }
};

const deleteItem = async () => {
  try {
    await deleteFile(retVal.value.storPath);
    retVal.value.storPath = "";
  } catch (error) {
    displayPageAlert(`An error occurred while deleting the video: ${error}`);
  }
};

onUpdated(() => {
  updateData();
});

updateData();
</script>
