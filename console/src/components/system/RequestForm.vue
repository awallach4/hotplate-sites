<template>
  <v-drag-frame
    v-model="retVal.hidden"
    :not-card="false"
    :can-delete="canDelete"
    name="Item Request Form"
    :header="retVal.header || 'Item Request Form'"
    class="request-form"
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
        label="Form Title"
        filled
        :disabled="dragging"
      />
      <tiptap-editor
        v-model="retVal.text"
        placeholder="Description"
        :use-img="false"
        :disabled="dragging"
      />
      <v-spacer />
      <draggable
        v-model="retVal.items"
        ghost-class="elevation-10"
        style="width: 100%"
        handle=".handle"
        :group="{ name: 'list', pull: pullFunction }"
        :animation="200"
        :disabled="dragging"
        @start="start"
      >
        <v-text-field
          v-for="(item, index) in retVal.items"
          :key="item.id"
          v-model="retVal.items[index].content"
          :label="`Item ${index + 1}`"
          filled
          color="secondary"
          append-icon="mdi-delete"
          :disabled="dragging"
          @click:append="delItem(index)"
        >
          <template #prepend>
            <v-icon class="handle">mdi-drag-vertical</v-icon>
          </template>
        </v-text-field>
      </draggable>
      <v-btn color="secondary" class="sectext--text" @click="addItem"
        ><v-icon>mdi-plus</v-icon> Add Item</v-btn
      >
      <v-spacer />
      <p>
        Enter the recipient's email address in this field. All emails sent
        through this form will go to this address.
      </p>
      <v-text-field
        v-model="retVal.email"
        label="Recipient's Email Address"
        filled
        color="secondary"
        item-color="secondary"
        :disabled="dragging"
      />
    </v-card-text>
  </v-drag-frame>
</template>

<script lang="ts" setup>
import type { ItemListItem } from "@/types";
import draggable from "vuedraggable";
import sanitized from "@/plugins/dompurify";
import { computed, onUpdated, ref, watch } from "@vue/composition-api";

interface RequestFormData {
  items: ItemListItem[];
  email: string;
  text: string;
  header: string;
  useCard: boolean;
  hidden: boolean;
}

interface DragEvent {
  originalEvent: KeyboardEvent;
}

interface Props {
  dragging: boolean;
  canDelete: boolean;
  value: RequestFormData;
}

interface Emits {
  (e: "input", payload: RequestFormData): void;
  (e: "delete"): void;
}

const props = withDefaults(defineProps<Props>(), {
  dragging: false,
  canDelete: true,
  value: () => {
    return {
      items: [],
      email: "",
      text: "",
      header: "",
      useCard: true,
      hidden: false
    };
  }
});

const emit = defineEmits<Emits>();

const retVal = ref(props.value);
const controlOnStart = ref(false);

const cleanTxt = computed(() => {
  return sanitized(retVal.value.text);
});

watch(retVal, () => {
  retVal.value.text = cleanTxt.value;
});

const updateData = () => {
  emit("input", retVal.value);
};

const addItem = async () => {
  const { generateString } = await import("@/plugins/stringGenerator");
  retVal.value.items.push({ id: generateString(20), content: "" });
  updateData();
};

const delItem = (index: number) => {
  retVal.value.items.splice(index, 1);
  updateData();
};

const pullFunction = () => {
  return controlOnStart ? "clone" : true;
};

const start = ({ originalEvent }: DragEvent) => {
  controlOnStart.value = originalEvent.ctrlKey;
};

const deleteSelf = (ask: boolean) => {
  if (ask) {
    if (
      !confirm(
        "Are you sure you want to delete this component?  Remember to save for this change to take effect!"
      )
    ) {
      return;
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
