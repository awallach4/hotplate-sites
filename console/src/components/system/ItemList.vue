<template>
  <v-drag-frame
    v-model="retVal.hidden"
    :not-card="false"
    :can-delete="canDelete"
    name="List"
    :header="retVal.header || 'List'"
    class="item-list"
    @delete="deleteSelf(true)"
  >
    <v-card-text class="cardtext--text">
      <v-switch
        v-model="retVal.useCard"
        color="secondary"
        label="Create Card on Page"
      />
      <v-switch
        v-model="retVal.ordered"
        color="secondary"
        label="Numbered List"
      />
      <v-text-field
        v-model="retVal.header"
        color="secondary"
        filled
        label="List Title"
        :disabled="dragging"
      />
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
    </v-card-text>
  </v-drag-frame>
</template>

<script lang="ts" setup>
import draggable from "vuedraggable";
import type { ItemListItem } from "@/types";
import { onUpdated, ref } from "@vue/composition-api";

interface ItemListData {
  header: string;
  items: ItemListItem[];
  ordered: boolean;
  useCard: boolean;
  hidden: boolean;
}

interface DragEvent {
  originalEvent: KeyboardEvent;
}

interface Props {
  dragging: boolean;
  canDelete: boolean;
  value: ItemListData;
}

interface Emits {
  (e: "input", payload: ItemListData): void;
  (e: "delete"): void;
}

const props = withDefaults(defineProps<Props>(), {
  dragging: false,
  canDelete: true,
  value: () => {
    return {
      header: "",
      items: [],
      ordered: false,
      useCard: true,
      hidden: false
    };
  }
});

const emit = defineEmits<Emits>();

const retVal = ref(props.value);
const controlOnStart = ref(false);

const updateData = () => {
  emit("input", retVal.value);
};

const addItem = async () => {
  const { generateString } = await import("@/plugins/stringGenerator");
  retVal.value.items.push({
    id: generateString(20),
    content: ""
  });
  updateData();
};

const delItem = (index: number) => {
  retVal.value.items.splice(index, 1);
  updateData();
};

const pullFunction = () => {
  return controlOnStart.value ? "clone" : true;
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
