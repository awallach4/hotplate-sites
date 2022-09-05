<template>
  <div class="contact-form">
    <card-wrap :is-elevated="useCard" :header="header">
      <p v-html="sanitized(text)" />
      <v-form
        v-if="canMail && email && settings.mailURL && settings.useEmail"
        ref="form"
        :disabled="submitting"
        @submit.prevent="send"
      >
        <v-text-field
          v-model="name"
          label="Your Name"
          filled
          :rules="[fieldRequired]"
          color="secondary"
          validate-on-blur
        />
        <v-text-field
          v-model="sender"
          label="Your Email Address"
          type="email"
          filled
          color="secondary"
          :rules="[fieldRequired, validEmail]"
          validate-on-blur
        />
        <tiptap-editor
          v-model="message"
          placeholder="Your Message"
          :use-img="false"
          :disabled="submitting"
        />
        <v-spacer />
        <v-btn
          type="submit"
          :disabled="submitting"
          block
          color="secondary"
          class="sectext--text"
        >
          Send
        </v-btn>
      </v-form>
      <strong v-else-if="!canMail"
        >We're sorry, but it looks like you're not allowed to send emails.
        Please contact a site administrator for more information.</strong
      >
      <strong v-else-if="canMail && !email"
        >We're sorry, but this form is missing an email recipient. Please
        contact a webmaster for assitance.</strong
      >
      <strong v-else>
        We're sorry, but the email service has not been enabled by an
        administrator.
      </strong>
    </card-wrap>
  </div>
</template>

<script lang="ts" setup>
import type { EmailData, VFormOptions } from "@/types";
import sanitized from "@/plugins/dompurify";
import { canMail } from "@/plugins/mailService";
import { fieldRequired, validEmail } from "@/plugins/formRules";
import { ref } from "vue";
import { displayPageAlert } from "@/plugins/errorHandler";
import { TiptapEditor } from "@/components/asyncComponents";
import { settings } from "@/plugins/routerStoreHelpers";
import { companyName } from "../../../../hotplateConfig";

interface Props {
  email: string;
  text?: string;
  header?: string;
  useCard?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  email: "",
  text: "",
  header: "",
  useCard: true
});

const name = ref("");
const sender = ref("");
const message = ref("");
const submitting = ref(false);
const form = ref({} as VFormOptions);

const send = async (): Promise<void> => {
  const isValid = form.value.validate();
  if (!canMail.value || !isValid || !message.value) {
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
    subject: `${name.value} (${sender.value}) Submitted a Contact Form`,
    body: message.value,
    sender: companyName,
    reply: sender.value
  };
  try {
    const { sendEmail } = await import("@/plugins/mailService");
    await sendEmail(postData);
    form.value.reset();
    message.value = "";
    displayPageAlert("Your message has been sent!");
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
