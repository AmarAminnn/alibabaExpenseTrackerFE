<template>
  <v-card>
    <v-card-title class="text-h6">Expenses by Category</v-card-title>
    <v-card-text>
      <div v-if="expenses && expenses.length > 0">
        <div :style="{ position: 'relative', height: '300px' }">
           <Pie :data="chartData" :options="chartOptions" />
        </div>
      </div>
      <div v-else class="text-center text-grey">
        <p>No expense data available to display the chart.</p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { defineComponent, computed } from 'vue';
import { Pie } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // Import the datalabels plugin

// Register the necessary Chart.js elements and plugins
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, ChartDataLabels);

// Define a list of colors for the pie chart slices
const CHART_COLORS = [
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#FF9800', // Orange
  '#F4436C', // Red
  '#9C27B0', // Purple
  '#FFEB3B', // Yellow
  '#00BCD4', // Cyan
  '#E91E63', // Pink
  '#607D8B', // Blue Grey
  '#795548', // Brown
  '#9E9E9E', // Grey
  '#B0BEC5', // Light Blue Grey
];

export default defineComponent({
  name: 'ExpensePieChart',
  components: {
    Pie,
  },
  props: {
    expenses: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  setup(props) {
    // Computed property to transform the expenses data into Chart.js format
    const chartData = computed(() => {
      const categoryTotals = {};
      let totalSum = 0; // We need this for percentage calculation

      // Aggregate expenses by category
      if (props.expenses && Array.isArray(props.expenses)) {
        props.expenses.forEach(expense => {
          const price = parseFloat(expense.price);
          if (!isNaN(price)) {
             const category = expense.category || 'Uncategorized';
             if (categoryTotals[category]) {
               categoryTotals[category] += price;
             } else {
               categoryTotals[category] = price;
             }
             totalSum += price; // Calculate total for percentages
          }
        });
      }

      const labels = Object.keys(categoryTotals);
      const data = Object.values(categoryTotals);
      
      // Calculate percentages for each category
      const percentages = data.map(value => {
        return totalSum > 0 ? ((value / totalSum) * 100).toFixed(1) + '%' : '0%';
      });

      // Generate background colors, cycling through the predefined list
      const backgroundColor = labels.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]);

      return {
        labels: labels,
        datasets: [
          {
            label: 'Total Amount',
            data: data,
            backgroundColor: backgroundColor,
            borderColor: '#ffffff',
            borderWidth: 2,
            // Add percentages as a custom property for datalabels
            percentages: percentages
          },
        ],
      };
    });

    // Chart.js options for customization
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Expenses by Category',
          font: {
            size: 16,
          },
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw;
              const total = context.chart.data.datasets[0].data.reduce((sum, val) => sum + val, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: $${value.toFixed(2)} (${percentage}%)`;
            }
          }
        },
        legend: {
          position: 'top',
        },
        // Configure the datalabels plugin
        datalabels: {
          color: '#fff',
          font: {
            weight: 'bold',
            size: 12
          },
          formatter: (value, context) => {
            // Get the percentage from our custom property
            return context.chart.data.datasets[0].percentages[context.dataIndex];
          },
          // Only show labels for segments that are large enough
          display: function(context) {
            const total = context.chart.data.datasets[0].data.reduce((sum, val) => sum + val, 0);
            const value = context.dataset.data[context.dataIndex];
            const percentage = (value / total) * 100;
            // Only show label if the segment is at least 5% of the total
            return percentage >= 5;
          }
        }
      },
    };

    return {
      chartData,
      chartOptions,
    };
  },
});
</script>