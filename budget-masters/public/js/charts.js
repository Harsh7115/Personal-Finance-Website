// public/js/charts.js
// Contributors: Harshit Jain, Ashish Dev Choudhary, Shivansh Singh, Advik Bargoti
// Javascript file for Charts Functionality

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = '/';
        return;
    }

    // Set username
    document.getElementById('username').textContent = user.username;

    // Event listeners
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('budgetSelect').addEventListener('change', updateCharts);
    document.getElementById('timeRange').addEventListener('change', updateCharts);

    // Load initial data
    loadBudgets().then(() => updateCharts());
});

async function loadBudgets() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch(`/api/budgets/${user.id}`);
        const data = await response.json();

        if (data.success) {
            const budgetSelect = document.getElementById('budgetSelect');
            data.budgets.forEach(budget => {
                const option = document.createElement('option');
                option.value = budget._id;
                option.textContent = budget.name;
                budgetSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading budgets:', error);
    }
}

async function updateCharts() {
    const budgetId = document.getElementById('budgetSelect').value;
    const timeRange = document.getElementById('timeRange').value;
    
    try {
        const data = await fetchChartData(budgetId, timeRange);
        updateCategoryPieChart(data.categoryData);
        updateTrendsBarChart(data.trendsData);
        updateBudgetComparisonChart(data.comparisonData);
        updateDailySpendingChart(data.dailyData);
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

async function fetchChartData(budgetId, timeRange) {
    let expenses = [];
    try {
        // Fetch expenses based on budget selection
        if (budgetId === 'all') {
            const user = JSON.parse(localStorage.getItem('user'));
            const budgetsResponse = await fetch(`/api/budgets/${user.id}`);
            const budgetsData = await budgetsResponse.json();
            
            // Fetch expenses for all budgets
            const expensesPromises = budgetsData.budgets.map(budget =>
                fetch(`/api/expenses/budget/${budget._id}`).then(res => res.json())
            );
            const expensesResults = await Promise.all(expensesPromises);
            expenses = expensesResults.flatMap(result => result.expenses || []);
        } else {
            const response = await fetch(`/api/expenses/budget/${budgetId}`);
            const data = await response.json();
            expenses = data.expenses || [];
        }

        // Filter expenses by time range
        const filteredExpenses = filterExpensesByTimeRange(expenses, timeRange);

        return {
            categoryData: processCategoryData(filteredExpenses),
            trendsData: processTrendsData(filteredExpenses),
            comparisonData: processComparisonData(filteredExpenses),
            dailyData: processDailyData(filteredExpenses)
        };
    } catch (error) {
        console.error('Error fetching chart data:', error);
        return {
            categoryData: [],
            trendsData: [],
            comparisonData: [],
            dailyData: []
        };
    }
}

function filterExpensesByTimeRange(expenses, timeRange) {
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
        case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
    }

    return expenses.filter(expense => new Date(expense.date) >= startDate);
}

function processCategoryData(expenses) {
    const categoryTotals = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});

    return {
        labels: Object.keys(categoryTotals),
        data: Object.values(categoryTotals)
    };
}

function processTrendsData(expenses) {
    const monthlyTotals = expenses.reduce((acc, expense) => {
        const month = new Date(expense.date).toLocaleString('default', { month: 'short' });
        acc[month] = (acc[month] || 0) + expense.amount;
        return acc;
    }, {});

    return {
        labels: Object.keys(monthlyTotals),
        data: Object.values(monthlyTotals)
    };
}

function processComparisonData(expenses) {
    // Group expenses by category and compare with budget limits
    const categoryTotals = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});

    return {
        labels: Object.keys(categoryTotals),
        actual: Object.values(categoryTotals),
        budget: Object.keys(categoryTotals).map(category => 1000)
    };
}

function processDailyData(expenses) {
    const dailyTotals = expenses.reduce((acc, expense) => {
        const date = new Date(expense.date).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + expense.amount;
        return acc;
    }, {});

    return {
        labels: Object.keys(dailyTotals),
        data: Object.values(dailyTotals)
    };
}

// Chart Update Functions
function updateCategoryPieChart(data) {
    const ctx = document.getElementById('categoryPieChart').getContext('2d');
    if (window.categoryPieChart) {
        window.categoryPieChart.destroy();
    }

    window.categoryPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.data,
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function updateTrendsBarChart(data) {
    const ctx = document.getElementById('trendsBarChart').getContext('2d');
    if (window.trendsBarChart) {
        window.trendsBarChart.destroy();
    }

    window.trendsBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Monthly Spending',
                data: data.data,
                backgroundColor: '#36A2EB'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateBudgetComparisonChart(data) {
    const ctx = document.getElementById('budgetComparisonChart').getContext('2d');
    if (window.budgetComparisonChart) {
        window.budgetComparisonChart.destroy();
    }

    window.budgetComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Actual',
                    data: data.actual,
                    backgroundColor: '#36A2EB'
                },
                {
                    label: 'Budget',
                    data: data.budget,
                    backgroundColor: '#FF6384'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateDailyLineChart(data) {
    const ctx = document.getElementById('dailyLineChart').getContext('2d');
    if (window.dailyLineChart) {
        window.dailyLineChart.destroy();
    }

    window.dailyLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Daily Spending',
                data: data.data,
                borderColor: '#4BC0C0',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = '/';
}