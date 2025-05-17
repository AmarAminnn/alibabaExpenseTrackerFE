<template>
  <v-app>
    <v-main>
      <v-container fluid>
        <UserUploadComponent />
      </v-container>

      <v-container>
        <v-row>
          <v-col cols="12">
            <h1>Expense Dashboard</h1>
          </v-col>
          <v-col cols="12" md="6">
            <!-- Display the pie chart -->
            <ExpensePieChart :expenses="allExpenses" />
          </v-col>
          <v-col cols="12" md="6">
            <!-- Maybe a list of expenses here -->
            <v-card>
              <v-card-title>All Expenses</v-card-title>
              <v-card-text>
                <v-list>
                  <v-list-item v-for="expense in allExpenses" :key="expense.id">
                    <!-- Remove v-list-item-content and place title/subtitle directly in v-list-item -->
                    <template v-slot:title>{{ expense.item_name }}</template>
                    <template v-slot:subtitle>{{ expense.category }} - ${{ formatPrice(expense.price) }}</template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
// Imports remain the same
import UserUpload from './components/upload.vue';
import ExpensePieChart from '@/components/ExpensePieChart.vue';
import { ref, onMounted } from 'vue';
import api from '@/api';

export default {
  name: 'App',
  components: {
    UserUploadComponent: UserUpload,
    ExpensePieChart,
  },
  data: () => ({
    //
  }),
  setup() {
    const allExpenses = ref([]); // Reactive reference to hold expense data

    const fetchExpenses = async () => {
      try {
        const response = await api.get('/expenses');
        allExpenses.value = response.data;
      } catch (error) {
        console.error('Error fetching expenses:', error);
      }
    };

    // Add a function to format the price
    const formatPrice = (price) => {
      if (price === undefined || price === null) return '0.00';
      return parseFloat(price).toFixed(2);
    };

    // Fetch expenses when the component is mounted
    onMounted(() => {
      fetchExpenses();
    });

    return {
      allExpenses,
      formatPrice, // Make the function available to the template
    };
  },
};
</script>

<style>
/* Global styles or styles specific to App.vue can go here */
/* For example, to ensure the content is nicely padded if not using v-container directly around the component */
/* .v-main {
  padding: 20px;
} */
</style>

