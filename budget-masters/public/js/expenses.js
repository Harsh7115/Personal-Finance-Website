// public/js/expenses.js
// Contributors: Harshit Jain, Ashish Dev Choudhary, Shivansh Singh, Advik Bargoti
// Javascript file for Expenses Functionality
let allExpenses = [];
let userBudgets = [];

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
    document.getElementById('budgetFilter').addEventListener('change', filterExpenses);
    document.getElementById('categoryFilter').addEventListener('change', filterExpenses);
    document.getElementById('dateFilter').addEventListener('change', filterExpenses);
    document.getElementById('editExpenseForm').addEventListener('submit', updateExpense);

    // Load initial data
    loadBudgetsAndExpenses();
});

async function loadBudgetsAndExpenses() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        
        // Load budgets
        const budgetsResponse = await fetch(`/api/budgets/${user.id}`);
        const budgetsData = await budgetsResponse.json();
        
        if (budgetsData.success) {
            userBudgets = budgetsData.budgets;
            populateBudgetFilter(budgetsData.budgets);
            populateCategoryFilter(budgetsData.budgets);
            
            // Load expenses for each budget
            const allExpensesPromises = budgetsData.budgets.map(budget => 
                fetch(`/api/expenses/budget/${budget._id}`).then(res => res.json())
            );
            
            const expensesResults = await Promise.all(allExpensesPromises);
            allExpenses = expensesResults
                .filter(result => result.success)
                .flatMap(result => result.expenses);
            
            displayExpenses(allExpenses);
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function populateBudgetFilter(budgets) {
    const budgetFilter = document.getElementById('budgetFilter');
    budgets.forEach(budget => {
        const option = document.createElement('option');
        option.value = budget._id;
        option.textContent = budget.name;
        budgetFilter.appendChild(option);
    });
}

function populateCategoryFilter(budgets) {
    const categoryFilter = document.getElementById('categoryFilter');
    const categories = new Set(budgets.flatMap(budget => budget.categories));
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

function filterExpenses() {
    const budgetId = document.getElementById('budgetFilter').value;
    const category = document.getElementById('categoryFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    let filteredExpenses = [...allExpenses];
    
    if (budgetId !== 'all') {
        filteredExpenses = filteredExpenses.filter(expense => expense.budgetId === budgetId);
    }
    
    if (category !== 'all') {
        filteredExpenses = filteredExpenses.filter(expense => expense.category === category);
    }
    
    const today = new Date();
    if (dateFilter !== 'all') {
        filteredExpenses = filteredExpenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            switch(dateFilter) {
                case 'today':
                    return isSameDay(expenseDate, today);
                case 'week':
                    return isThisWeek(expenseDate, today);
                case 'month':
                    return isSameMonth(expenseDate, today);
                default:
                    return true;
            }
        });
    }
    
    displayExpenses(filteredExpenses);
}

function displayExpenses(expenses) {
    const tbody = document.getElementById('expensesTableBody');
    tbody.innerHTML = '';
    
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(expense => {
        const budget = userBudgets.find(b => b._id === expense.budgetId);
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${formatDate(expense.date)}</td>
            <td>${expense.description}</td>
            <td>${expense.category}</td>
            <td>${budget ? budget.name : 'Unknown Budget'}</td>
            <td>${formatCurrency(expense.amount)}</td>
            <td>
                <button class="btn-secondary btn-small" onclick="editExpense('${expense._id}')">Edit</button>
                <button class="btn-secondary btn-small" onclick="deleteExpense('${expense._id}')">Delete</button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

function editExpense(expenseId) {
    const expense = allExpenses.find(e => e._id === expenseId);
    if (!expense) return;
    
    document.getElementById('editExpenseId').value = expenseId;
    document.getElementById('editAmount').value = expense.amount;
    document.getElementById('editDescription').value = expense.description;
    document.getElementById('editDate').value = formatDateForInput(expense.date);
    
    document.getElementById('editExpenseModal').classList.remove('hidden');
}

async function updateExpense(e) {
    e.preventDefault();
    
    const expenseId = document.getElementById('editExpenseId').value;
    const updatedData = {
        amount: parseFloat(document.getElementById('editAmount').value),
        description: document.getElementById('editDescription').value,
        date: document.getElementById('editDate').value
    };
    
    try {
        const response = await fetch(`/api/expenses/${expenseId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });
        
        const data = await response.json();
        if (data.success) {
            closeEditModal();
            loadBudgetsAndExpenses();
        }
    } catch (error) {
        console.error('Error updating expense:', error);
    }
}

async function deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
        const response = await fetch(`/api/expenses/${expenseId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        if (data.success) {
            loadBudgetsAndExpenses();
        }
    } catch (error) {
        console.error('Error deleting expense:', error);
    }
}

function closeEditModal() {
    document.getElementById('editExpenseModal').classList.add('hidden');
    document.getElementById('editExpenseForm').reset();
}

// Utility Functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function formatDateForInput(dateString) {
    return new Date(dateString).toISOString().split('T')[0];
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

function isThisWeek(d1, d2) {
    const oneDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round(Math.abs((d1 - d2) / oneDay));
    return diffDays <= 7;
}

function isSameMonth(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth();
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = '/';
}
