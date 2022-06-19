<template>
  <div class="request-form">
    <card-wrap :is-elevated="useCard" :header="header">
      <p v-html="sanitized(text)" />
      <strong>Available Items:</strong>
      <ul :style="{ columns }">
        <li v-for="item in items" :key="item.id">{{ item.content }}</li>
      </ul>
      <v-spacer />
      <v-form
        v-if="canMail && email && settings.mailURL"
        ref="form"
        :disabled="submitting"
        @submit.prevent="request"
      >
        <v-row>
          <v-col style="min-width: 150px">
            <v-select
              v-model="book"
              outlined
              dense
              multiple
              :items="items"
              item-text="content"
              item-value="content"
              label="Item Title(s)"
              :rules="[minLength(book, 1, 'Required.')]"
              color="secondary"
              item-color="secondary"
            />
          </v-col>
          <v-col style="min-width: 150px">
            <v-text-field
              v-model="comments"
              label="Comments"
              outlined
              dense
              color="secondary"
            />
          </v-col>
          <v-col>
            <v-btn
              color="secondary"
              class="sectext--text"
              type="submit"
              :disabled="submitting"
              >Request Item(s)</v-btn
            >
          </v-col>
        </v-row>
      </v-form>
      <strong v-else-if="!canMail && settings.mailURL"
        >We're sorry, but it looks like you're not allowed to send emails.
        Please contact a site administrator for more information.</strong
      >
      <strong v-else-if="canMail && !email && settings.mailURL"
        >We're sorry, but this form is missing an email recipient. Please
        contact a webmaster for assitance.</strong
      >
      <strong v-else-if="!settings.mailURL">
        We're sorry, but the email service script URL was not found. Please
        contact a site administrator for assistance.
      </strong>
    </card-wrap>
  </div>
</template>

<script lang="ts" setup>
import type { EmailData, ItemListItem, VFormOptions } from "@/types";
import sanitized from "@/plugins/dompurify";
import { canMail } from "@/plugins/mailService";
import { computed, ref, type Ref } from "@vue/composition-api";
import { user } from "@/plugins/authHandler";
import { minLength } from "@/plugins/formRules";
import { useVuetify } from "@/plugins/contextInject";
import { displayPageAlert } from "@/plugins/errorHandler";
import { settings } from "@/plugins/routerStoreHelpers";

interface Props {
  items: ItemListItem[];
  email: string;
  header?: string;
  text?: string;
  useCard?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  email: "",
  header: "",
  text: "",
  useCard: true
});

const book: Ref<string[]> = ref([]);
const comments = ref("");
const submitting = ref(false);
const form = ref({} as VFormOptions);

const listItems = computed(() => {
  const list: string[] = [];
  book.value.forEach((item) => {
    list.push(`<li>${item}</li>`);
  });
  const string = list.toString().replace(/,/g, "");
  return string;
});

const columns = computed(() => {
  const vuetify = useVuetify();
  const breakpoint = vuetify.breakpoint.name;
  if (breakpoint === "sm") {
    return "2";
  } else if (breakpoint === "xs") {
    return "1";
  } else {
    return "3";
  }
});

const message = computed(() => {
  return `<p>Hello ${props.email},</p><p>You have received a request from ${user.value.displayName} for the following items: <ul>${listItems.value}</ul>  Please contact ${user.value.displayName} at <a href="mailto:${user.value.email}">${user.value.email}</a> to arrange a pickup date.</p><p>Comments: ${comments.value}</p>`;
});

const request = async () => {
  const isValid = form.value.validate();
  if (!canMail.value || !isValid) {
    return;
  }
  if (!props.email) {
    displayPageAlert(
      "This form is missing an email recipient.  Please contact a webmaster for assistance."
    );
    return;
  }
  submitting.value = true;
  const postData: EmailData = {
    to: props.email,
    subject: "YOUR_COMPANY Item Request",
    body: message.value
  };
  if (user.value.email) {
    postData.reply = user.value.email;
  }
  if (user.value.displayName) {
    postData.sender = user.value.displayName;
  }
  try {
    const { sendEmail } = await import("@/plugins/mailService");
    await sendEmail(postData);
    displayPageAlert("Your request has been sent!");
    submitting.value = false;
  } catch (error) {
    displayPageAlert(error as string);
    submitting.value = false;
  }
};
</script>

<style lang="scss" scoped>
.spacer {
  height: 24px;
}
</style>
