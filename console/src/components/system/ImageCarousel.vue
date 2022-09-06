<template>
  <v-drag-frame
    v-model="retVal.hidden"
    :not-card="false"
    :can-delete="canDelete"
    name="Image Carousel"
    :header="retVal.header || 'Image Carousel'"
    class="image-carousel"
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
      <h3>Images - Click to Select</h3>
      <v-item-group v-model="imgDel" multiple>
        <v-row>
          <v-col
            v-for="(img, index) in retVal.storPath"
            :key="index"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <v-item v-slot="{ active, toggle }">
              <v-img
                :src="img"
                :gradient="
                  active
                    ? 'to bottom, var(--v-error-base), rgba(255,255,255,0.5)'
                    : ''
                "
                alt="Image"
                contain
                class="text-center align-center pa-2 ma-2"
                style="max-width: 100%; max-height: 200px; cursor: pointer"
                @click="toggle"
              >
                <v-icon v-if="active" large color="errtext">mdi-delete</v-icon>
              </v-img>
            </v-item>
          </v-col>
        </v-row>
      </v-item-group>
      <v-spacer />
      <v-file-input
        ref="fileInput"
        v-model="imageFile"
        accept="image/png, image/jpeg, image/bmp, .svg"
        prepend-inner-icon="mdi-image"
        prepend-icon=""
        label="Image Uploads"
        multiple
        :disabled="(uploadProgress !== 0 && uploadProgress !== 100) || dragging"
        filled
        color="secondary"
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
        @click="uploadImages"
        >Upload</v-btn
      >
      <v-spacer v-if="$vuetify.breakpoint.name === 'xs'" />
      <v-btn
        color="error"
        class="errtext--text"
        :class="{ 'ml-2': $vuetify.breakpoint.name !== 'xs' }"
        :block="$vuetify.breakpoint.name === 'xs'"
        :disabled="!canRemove"
        @click="rmImgs"
        >Delete Selected</v-btn
      >
    </v-card-text>
  </v-drag-frame>
</template>

<script lang="ts" setup>
import { displayPageAlert } from "@/plugins/errorHandler";
import { deleteFile, uploadFile } from "@/plugins/firebaseStorage";
import type { ComponentMetaData } from "@/types";
import { computed, onUpdated, ref, type Ref } from "vue";

interface ImageCarouselData {
  header: string;
  storPath: string[];
  useCard: boolean;
  hidden: boolean;
}

interface Props {
  dragging: boolean;
  canDelete: boolean;
  metaData: ComponentMetaData;
  value: ImageCarouselData;
}

interface Emits {
  (e: "input", payload: ImageCarouselData): void;
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
      storPath: [],
      useCard: true,
      hidden: false
    };
  }
});

const emit = defineEmits<Emits>();

const retVal = ref(props.value);
const imageFile: Ref<File[]> = ref([]);
const imgDel: Ref<number[]> = ref([]);
const uploadProgress = ref(0);

const canUpload = computed(() => {
  return (
    imageFile.value &&
    (uploadProgress.value === 0 || uploadProgress.value === 100) &&
    imageFile.value.length > 0 &&
    (uploadProgress.value === 0 || uploadProgress.value === 100)
  );
});

const canRemove = computed(() => {
  return imgDel.value.length > 0;
});

const updateData = () => {
  emit("input", retVal.value);
};

const deleteSelf = (ask: boolean) => {
  if (ask) {
    if (
      !confirm(
        "Are you sure you want to delete this component?  ALL IMAGES WILL BE DELETED REGARDLESS OF SAVING!"
      )
    ) {
      return;
    }
  }
  retVal.value.storPath.forEach(async (img) => {
    try {
      await deleteFile(img);
    } catch (error) {
      displayPageAlert(
        `An error occurred while deleting the image(s): ${error}`
      );
    }
  });
  emit("delete");
};

defineExpose({ deleteSelf });

const uploadImages = () => {
  imageFile.value.forEach(async (img) => {
    const fileURL = await uploadFile(
      `${props.metaData.storPath}/${img.name}`,
      img,
      (url) => {
        const index = retVal.value.storPath.indexOf(url);
        retVal.value.storPath.splice(index, 1);
      },
      (snapshot) => {
        uploadProgress.value =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      }
    );
    try {
      uploadProgress.value = 100;
      retVal.value.storPath.push(fileURL);
    } catch (error) {
      displayPageAlert(
        `An error occurred while getting the image URL(s): ${error}`
      );
    }
  });
  imageFile.value = [];
  uploadProgress.value = 0;
};

const rmImgs = () => {
  if (canRemove.value) {
    if (
      confirm(
        "You are about to delete the selected images.  Do you wish to proceed?"
      )
    ) {
      imgDel.value.forEach(async (img: number) => {
        try {
          const selected = retVal.value.storPath[img];
          await deleteFile(selected);
          retVal.value.storPath.splice(
            retVal.value.storPath.indexOf(selected),
            1
          );
          const indexd = imgDel.value.indexOf(img);
          imgDel.value.splice(indexd, 1);
        } catch (error) {
          displayPageAlert(
            `An error occurred while deleting the image(s): ${error}`
          );
        }
      });
    }
  } else {
    displayPageAlert("Please select some images to delete.");
  }
};

onUpdated(() => {
  updateData();
});

updateData();
</script>
