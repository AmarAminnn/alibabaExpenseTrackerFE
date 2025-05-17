<template>
  <v-app>
    <v-main>
      <v-container fluid>
        <UserUploadComponent />

      </v-container>
    </v-main>
  </v-app>
</template>

<script>
// 1. Import the HelloWorld component if you plan to use it (optional)
// import HelloWorld from './components/HelloWorld.vue';

// 2. Import your upload component from its file path
//    It's a common convention to use PascalCase for component names in JavaScript.
import UserUpload from './components/upload.vue'; // This points to your src/components/upload.vue file

export default {
  name: 'App',
  components: {
    // HelloWorld, // Register HelloWorld if you've imported it and want to use <HelloWorld />

    // 3. Register your upload component.
    //    The key here (e.g., 'UserUploadComponent') is how you will refer to it in the <template>
    //    The value (UserUpload) is the component you imported.
    UserUploadComponent: UserUpload,
  },
  // You can add data, methods, computed properties, etc., for App.vue here if needed
  data: () => ({
    //
  }),
};
</script>

<style>
/* Global styles or styles specific to App.vue can go here */
/* For example, to ensure the content is nicely padded if not using v-container directly around the component */
/* .v-main {
  padding: 20px;
} */
</style>
