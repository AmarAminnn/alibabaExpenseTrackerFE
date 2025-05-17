<template>
  <v-app>
    <v-main>
      <v-container fluid>
        <UserUploadComponent @file-uploaded="handleFileUploaded" />
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
              <v-card-title>
                All Expenses
                <v-spacer></v-spacer>
                <v-btn color="primary" small @click="fetchExpenses" :loading="isLoading">
                  <v-icon left>mdi-refresh</v-icon>
                  Refresh
                </v-btn>
              </v-card-title>
              <v-card-text>
                <div v-if="isLoading" class="d-flex justify-center my-4">
                  <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </div>
                <v-list v-else-if="allExpenses.length > 0">
                  <v-list-item v-for="expense in allExpenses" :key="expense.id">
                    <template v-slot:title>{{ expense.item_name }}</template>
                    <template v-slot:subtitle>{{ expense.category }} - ${{ formatPrice(expense.price) }}</template>
                  </v-list-item>
                </v-list>
                <div v-else class="text-center text-grey pa-4">
                  <p>No expenses found. Upload a receipt to get started.</p>
                </div>
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
    const isLoading = ref(false); // Add loading state

    const fetchExpenses = async () => {
      isLoading.value = true;
      try {
        const response = await api.get('/expenses');
        allExpenses.value = response.data;
        console.log('Expenses loaded:', allExpenses.value.length);
      } catch (error) {
        console.error('Error fetching expenses:', error);
      } finally {
        isLoading.value = false;
      }
    };

    // Add a function to format the price
    const formatPrice = (price) => {
      if (price === undefined || price === null) return '0.00';
      return parseFloat(price).toFixed(2);
    };

    // Handle file upload event from UserUploadComponent
    const handleFileUploaded = (fileInfo) => {
      console.log('File uploaded event received:', fileInfo);
      
      // If the extractedData contains all_expenses, use that directly
      if (fileInfo.extractedData && fileInfo.extractedData.all_expenses) {
        console.log('Using all_expenses from API response');
        allExpenses.value = fileInfo.extractedData.all_expenses;
      } else {
        // Otherwise, fetch the latest expenses from the API
        console.log('Fetching fresh expenses data');
        fetchExpenses();
      }
    };

    // Fetch expenses when the component is mounted
    onMounted(() => {
      fetchExpenses();
    });

    return {
      allExpenses,
      isLoading,
      formatPrice,
      fetchExpenses,
      handleFileUploaded
    };
  },
};
</script>

<style>
/* Global styles or styles specific to App.vue can go here */
.v-main {
  background-color: #f5f5f5;
}

h1 {
  font-weight: 500;
  color: #424242;
  margin-bottom: 24px;
}

.v-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.v-card-title {
  border-bottom: 1px solid #f0f0f0;
}
</style>
