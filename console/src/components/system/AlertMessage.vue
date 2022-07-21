<template>
  <v-drag-frame
    v-model="retVal.hidden"
    :not-card="false"
    :can-delete="canDelete"
    name="Alert Message"
    header="Alert Message"
    class="alert-message"
    @delete="deleteSelf(true)"
  >
    <v-card-text class="cardtext--text">
      <v-select
        v-model="retVal.type"
        color="secondary"
        filled
        item-color="secondary"
        label="Type"
        :items="types"
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
import { AlertMessageTypes, type VSelectValues } from "@/types";
import { onUpdated, ref } from "vue";

interface AlertMessageData {
  text: string;
  type: string;
  hidden: boolean;
}

interface Props {
  dragging: boolean;
  canDelete: boolean;
  value: AlertMessageData;
}

interface Emits {
  (e: "input", payload: AlertMessageData): void;
  (e: "delete"): void;
}

const props = withDefaults(defineProps<Props>(), {
  dragging: false,
  canDelete: true,
  value: () => {
    return {
      text: "",
      type: AlertMessageTypes.INFORMATION,
      hidden: false
    };
  }
});

const emit = defineEmits<Emits>();

const types: VSelectValues[] = [
  {
    text: "Success Message",
    value: AlertMessageTypes.SUCCESS
  },
  {
    text: "Information",
    value: AlertMessageTypes.INFORMATION
  },
  {
    text: "Warning",
    value: AlertMessageTypes.WARNING
  },
  {
    text: "Error",
    value: AlertMessageTypes.ERROR
  }
];

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
