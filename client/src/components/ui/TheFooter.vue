<template>
  <v-footer padless>
    <v-card
      flat
      tile
      :color="$vuetify.theme.dark ? 'card lighten-1' : 'card darken-1'"
      width="100%"
    >
      <v-divider />
      <v-card-text class="cardtext--text text-center py-4 body-2"
        >{{ settings.footerTxt }} <br v-if="settings.footerTxt" />
        <span style="font-size: 0.7rem"
          >This site is protected by reCAPTCHA and the Google
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noreferrer noopener nofollow"
            >Privacy Policy</a
          >
          and
          <a
            href="https://policies.google.com/terms"
            rel="noreferrer noopener nofollow"
            >Terms of Service</a
          >
          apply.
        </span>
      </v-card-text>
    </v-card>
  </v-footer>
</template>

<script lang="ts" setup>
import { settings } from "@/plugins/routerStoreHelpers";
</script>
