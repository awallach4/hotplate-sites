<template>
  <v-drag-frame
    v-model="retVal.hidden"
    :not-card="false"
    :can-delete="canDelete"
    name="Header"
    header="Header"
    class="page-header"
    @delete="deleteSelf(true)"
  >
    <v-card-text class="cardtext--text">
      <v-text-field
        v-model="retVal.head"
        color="secondary"
        filled
        label="Heading"
        :disabled="dragging"
      />
      <v-text-field
        v-model="retVal.sub"
        color="secondary"
        filled
        label="Subheading"
        :disabled="dragging"
      />
      <v-select
        v-model="retVal.fullPage"
        color="secondary"
        item-color="secondary"
        :items="[
          { text: 'Banner', value: false },
          { text: 'Cover', value: true }
        ]"
        filled
        label="Header Type"
      />
      <h3 class="mb-4">Background Image</h3>
      <img
        v-if="retVal.storPath"
        :src="retVal.storPath"
        alt="Image"
        style="max-height: 200px"
        :style="{
          'max-width': $vuetify.breakpoint.name === 'xs' ? '200px' : '300px'
        }"
      />
      <v-spacer />
      <v-file-input
        ref="fileInput"
        v-model="imageFile"
        accept="image/png, image/jpeg, image/jpg, image/bmp"
        prepend-inner-icon="mdi-image"
        prepend-icon=""
        label="Image Upload"
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
        @click="uploadImage"
        >Upload</v-btn
      >
      <v-spacer v-if="$vuetify.breakpoint.name === 'xs'" />
      <v-btn
        color="error"
        class="errtext--text"
        :class="{ 'ml-5': $vuetify.breakpoint.name !== 'xs' }"
        :block="$vuetify.breakpoint.name === 'xs'"
        :disabled="!canRemove"
        @click="delImg"
        >Delete Image</v-btn
      >
    </v-card-text>
  </v-drag-frame>
</template>

<script lang="ts" setup>
import { displayPageAlert } from "@/plugins/errorHandler";
import { deleteFile, uploadFile } from "@/plugins/firebaseStorage";
import type { ComponentMetaData } from "@/types";
import { computed, onUpdated, ref, type Ref } from "vue";

interface PageHeaderData {
  head: string;
  sub: string;
  fullPage: boolean;
  storPath: string;
  hidden: boolean;
}

interface Props {
  dragging: boolean;
  canDelete: boolean;
  metaData: ComponentMetaData;
  value: PageHeaderData;
}

interface Emits {
  (e: "input", payload: PageHeaderData): void;
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
      head: "",
      sub: "",
      fullPage: false,
      storPath: "",
      hidden: false
    };
  }
});

const emit = defineEmits<Emits>();

const retVal = ref(props.value);
const imageFile: Ref<File | null> = ref(null);
const uploadProgress = ref(0);

const canUpload = computed(() => {
  if (
    imageFile.value &&
    (uploadProgress.value === 0 || uploadProgress.value === 100) &&
    !retVal.value.storPath
  ) {
    return true;
  } else {
    return false;
  }
});

const canRemove = computed(() => {
  if (retVal.value.storPath) {
    return true;
  } else {
    return false;
  }
});

const updateData = () => {
  emit("input", retVal.value);
};

const uploadImage = async () => {
  if (imageFile.value) {
    const fileURL = await uploadFile(
      `${props.metaData.storPath}/${imageFile.value.name}`,
      imageFile.value,
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
      imageFile.value = null;
      uploadProgress.value = 0;
    } catch (error) {
      displayPageAlert(
        `An error occurred while getting the image URL: ${error}`
      );
    }
  }
};

const delImg = async () => {
  if (canRemove.value) {
    if (confirm("Are you sure you want to delete this image?")) {
      try {
        await deleteFile(retVal.value.storPath);
        retVal.value.storPath = "";
      } catch (error) {
        displayPageAlert(
          `An error occurred while deleting the image: ${error}`
        );
      }
    }
  } else {
    displayPageAlert("No image is uploaded.");
  }
};

const deleteSelf = async (ask: boolean) => {
  if (ask) {
    if (
      !confirm(
        "Are you sure you want to delete this component?  ALL IMAGES WILL BE DELETED REGARDLESS OF SAVING!"
      )
    ) {
      return;
    }
  }
  if (retVal.value.storPath) {
    try {
      await deleteFile(retVal.value.storPath);
    } catch (error) {
      displayPageAlert(
        `An error occurred while deleting the image(s): ${error}`
      );
    }
  }
  emit("delete");
};

defineExpose({ deleteSelf });

onUpdated(() => {
  updateData();
});

updateData();
</script>
