<template>
  <v-drag-frame
    v-model="retVal.hidden"
    :not-card="false"
    :can-delete="canDelete"
    name="Plain Text"
    header="Plain Text"
    class="plain-text"
    @delete="deleteSelf(true)"
  >
    <v-card-text class="cardtext--text">
      <v-switch
        v-model="retVal.useCard"
        color="secondary"
        label="Create Card on Page"
      />
      <v-text-field
        v-model="retVal.text"
        color="secondary"
        filled
        label="Text"
        :disabled="dragging"
      />
    </v-card-text>
  </v-drag-frame>
</template>

<script lang="ts" setup>
import { onUpdated, ref } from "vue";

interface PlainTextData {
  text: string;
  useCard: boolean;
  hidden: boolean;
}

interface Props {
  dragging: boolean;
  canDelete: boolean;
  value: PlainTextData;
}

interface Emits {
  (e: "input", payload: PlainTextData): void;
  (e: "delete"): void;
}

const props = withDefaults(defineProps<Props>(), {
  dragging: false,
  canDelete: true,
  value: () => {
    return {
      text: "",
      useCard: false,
      hidden: false
    };
  }
});

const emit = defineEmits<Emits>();

const retVal = ref(props.value);

const updateData = () => {
  emit("input", retVal.value);
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
