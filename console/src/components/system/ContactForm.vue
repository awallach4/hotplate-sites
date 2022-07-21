<template>
  <v-drag-frame
    v-model="retVal.hidden"
    :not-card="false"
    :can-delete="canDelete"
    name="Contact Form"
    :header="retVal.header || 'Contact Form'"
    class="contact-form"
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
import sanitized from "@/plugins/dompurify";
import { computed, onUpdated, ref, watch } from "vue";

interface ContactFormData {
  email: string;
  text: string;
  header: string;
  useCard: boolean;
  hidden: boolean;
}

interface Props {
  dragging: boolean;
  canDelete: boolean;
  value: ContactFormData;
}

interface Emits {
  (e: "input", payload: ContactFormData): void;
  (e: "delete"): void;
}

const props = withDefaults(defineProps<Props>(), {
  dragging: false,
  canDelete: true,
  value: () => {
    return {
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
