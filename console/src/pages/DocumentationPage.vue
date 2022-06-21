<template>
  <div id="dashboard">
    <v-card color="card">
      <iframe
        src="https://hotplate-docs.netlify.app"
        width="100%"
        frameborder="none"
        style="min-height: 250px; height: 70vh"
      />
      <v-card-text class="cardtext--text">
        Not working? Visit
        <a
          href="https://hotplate-docs.netlify.app"
          target="_blank"
          rel="noreferrer noopener nofollow"
          >https://hotplate-docs.netlify.app</a
        >
        to view the documentation.
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { usePages } from "@/store/pages";

const PagesModule = usePages();
PagesModule.viewPage("/", "Documentation", false);
</script>
