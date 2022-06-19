<template>
  <v-drag-frame
    :not-card="false"
    :error="true"
    :can-delete="canDelete"
    name=""
    header="Error"
    :hidden="false"
    class="nonexistent-component"
    @delete="deleteSelf(true)"
  >
    <v-card-text class="errtext--text">
      We're sorry, but the specified component type does not exist. Please
      contact a site administrator or the site author for help.
    </v-card-text>
  </v-drag-frame>
</template>

<script lang="ts" setup>
interface Props {
  canDelete: boolean;
}

interface Emits {
  (e: "delete"): void;
}

withDefaults(defineProps<Props>(), {
  canDelete: true
});

const emit = defineEmits<Emits>();

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
</script>
