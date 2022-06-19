<template>
  <v-drag-frame
    v-model="retVal.hidden"
    :not-card="false"
    :can-delete="canDelete"
    name="Rich Text"
    :header="retVal.header || 'Rich Text'"
    class="rich-text"
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
        :use-img="true"
        :disabled="dragging"
      />
      <v-spacer />
      <h3 class="mb-4">Images</h3>
      <p>
        Copy the URLs below and add them as images or simply paste them into the
        editor. You'll want to right-click and copy the link address. URLs
        listed here are not displayed if they are not pasted into the editor.
      </p>
      <ul v-if="retVal.storPath">
        <li
          v-for="item in retVal.storPath"
          :key="item.url"
          class="mb-4 d-flex align-center"
          style="list-style-type: none"
        >
          <v-btn class="ml-n4 mr-2" icon @click="deleteItem(item)">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
          <a
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer nofollow"
            >{{ item.name }}</a
          >
        </li>
      </ul>
      <v-spacer v-if="retVal.storPath" />
      <v-file-input
        ref="fileInput"
        v-model="fileUpload"
        prepend-inner-icon="mdi-paperclip"
        prepend-icon=""
        label="File Upload"
        filled
        multiple
        :disabled="(uploadProgress !== 0 && uploadProgress !== 100) || dragging"
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
        :disabled="!canUpload"
        @click="uploadItem"
        >Upload</v-btn
      >
    </v-card-text>
  </v-drag-frame>
</template>

<script lang="ts" setup>
import sanitized from "@/plugins/dompurify";
import { displayPageAlert } from "@/plugins/errorHandler";
import { deleteFile, uploadFile } from "@/plugins/firebaseStorage";
import type { ComponentMetaData, UploadedFile } from "@/types";
import {
  computed,
  onUpdated,
  ref,
  watch,
  type Ref
} from "@vue/composition-api";

interface RichTextData {
  header: string;
  text: string;
  storPath: UploadedFile[];
  useCard: boolean;
  hidden: boolean;
}

interface Props {
  dragging: boolean;
  canDelete: boolean;
  metaData: ComponentMetaData;
  value: RichTextData;
}

interface Emits {
  (e: "input", payload: RichTextData): void;
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
      storPath: [],
      useCard: true,
      hidden: false
    };
  }
});

const emit = defineEmits<Emits>();

const retVal = ref(props.value);
const fileUpload: Ref<File[]> = ref([]);
const uploadProgress = ref(0);

const canUpload = computed(() => {
  return (
    fileUpload.value.length > 0 &&
    (uploadProgress.value === 0 || uploadProgress.value === 100)
  );
});

const cleanTxt = computed(() => {
  return sanitized(retVal.value.text);
});

watch(retVal, () => {
  retVal.value.text = cleanTxt.value;
});

const updateData = () => {
  emit("input", retVal.value);
};

const deleteSelf = (ask: boolean) => {
  if (ask) {
    if (
      !confirm(
        "Are you sure you want to delete this component?  ALL FILES WILL BE DELETED REGARDLESS OF SAVING!"
      )
    ) {
      return;
    }
  }

  retVal.value.storPath.forEach(async (item) => {
    try {
      await deleteFile(item.url);
    } catch (error) {
      displayPageAlert(
        `An error occurred while deleting the image(s): ${error}`
      );
    }
  });
  emit("delete");
};

defineExpose({ deleteSelf });

const uploadItem = () => {
  fileUpload.value.forEach(async (file) => {
    const fileURL = await uploadFile(
      `${props.metaData.storPath}/${file.name}`,
      file,
      (url) => {
        const index = retVal.value.storPath.map((e) => e.url).indexOf(url);
        retVal.value.storPath.splice(index, 1);
      },
      (snapshot) => {
        uploadProgress.value =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      }
    );
    try {
      uploadProgress.value = 100;
      retVal.value.storPath.push({ name: file.name, url: fileURL });
    } catch (error) {
      displayPageAlert(
        `An error occurred while getting the image URL(s): ${error}`
      );
    }
  });
  fileUpload.value = [];
  uploadProgress.value = 0;
};

const deleteItem = async (item: UploadedFile) => {
  try {
    await deleteFile(item.url);
    retVal.value.storPath.splice(retVal.value.storPath.indexOf(item), 1);
  } catch (error) {
    displayPageAlert(`An error occurred while deleting the image(s): ${error}`);
  }
};

onUpdated(() => {
  updateData();
});

updateData();
</script>
