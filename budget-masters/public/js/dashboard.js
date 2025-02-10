// public/js/dashboard.js
// Contributors: Harshit Jain, Ashish Dev Choudhary, Shivansh Singh, Advik Bargoti
// Javascript file for Dashboard Functionality
let currentBudgets = [];

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
    setupEventListeners();
    
    // Load initial data
    loadBudgets();
});

function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Budget creation
    document.getElementById('createBudgetBtn').addEventListener('click', () => {
        document.getElementById('createBudgetModal').classList.remove('hidden');
    });

    document.getElementById('cancelBudgetBtn').addEventListener('click', () => {
        document.getElementById('createBudgetModal').classList.add('hidden');
        document.getElementById('budgetForm').reset();
        resetCategoryInputs();
    });

    document.getElementById('addCategoryBtn').addEventListener('click', addCategoryInput);
    document.getElementById('budgetForm').addEventListener('submit', createBudget);

    // Expense handling
    document.getElementById('expenseForm').addEventListener('submit', addExpense);
    document.getElementById('cancelExpenseBtn').addEventListener('click', () => {
        document.getElementById('addExpenseModal').classList.add('hidden');
        document.getElementById('expenseForm').reset();
    });

    // Edit expense handling
    document.getElementById('editExpenseForm').addEventListener('submit', updateExpense);
    document.getElementById('cancelEditExpenseBtn').addEventListener('click', () => {
        document.getElementById('editExpenseModal').classList.add('hidden');
    });
}

async function loadBudgets() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch(`/api/budgets/${user.id}`);
        const data = await response.json();

        if (data.success) {
            currentBudgets = data.budgets;
            updateDashboardSummary(data.budgets);
            displayBudgets(data.budgets);
        }
    } catch (error) {
        console.error('Error loading budgets:', error);
    }
}

function updateDashboardSummary(budgets) {
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.totalLimit, 0);
    const totalSpent = budgets.reduce((sum, budget) => sum + (budget.totalSpent || 0), 0);
    const savings = totalBudget - totalSpent;

    document.getElementById('totalBudget').textContent = formatCurrency(totalBudget);
    document.getElementById('totalSpent').textContent = formatCurrency(totalSpent);
    document.getElementById('savings').textContent = formatCurrency(savings);

    updateUserSavings(totalBudget, totalSpent);
}

function displayBudgets(budgets) {
    const budgetsGrid = document.getElementById('budgetsGrid');
    budgetsGrid.innerHTML = '';

    budgets.forEach(budget => {
        const totalSpent = budget.totalSpent || 0;
        const percentage = (totalSpent / budget.totalLimit) * 100;
        const progressColor = percentage > 90 ? '#e74c3c' : percentage > 70 ? '#f39c12' : '#2ecc71';

        const budgetEl = document.createElement('div');
        budgetEl.className = 'budget-card';
        budgetEl.innerHTML = `
            <h3>${budget.name}</h3>
            <p class="budget-total">Budget: ${formatCurrency(budget.totalLimit)}</p>
            <div class="budget-progress">
                <div class="progress-bar">
                    <div class="progress" style="width: ${percentage}%; background-color: ${progressColor}"></div>
                </div>
                <p class="budget-amounts">Spent: ${formatCurrency(totalSpent)}</p>
            </div>
            <div class="categories-list">
                ${budget.categories.map(category => `
                    <div class="category-item">
                        <span>${category.name}</span>
                        <span>${formatCurrency(category.spent)} / ${formatCurrency(category.limit)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="expenses-list">
                ${budget.expenses ? budget.expenses.map(expense => `
                    <div class="expense-item">
                        <div class="expense-details">
                            <span class="expense-description">${expense.description}</span>
                            <span class="expense-amount">${formatCurrency(expense.amount)}</span>
                            <span class="expense-date">${new Date(expense.date).toLocaleDateString()}</span>
                        </div>
                        <div class="expense-actions">
                            <button onclick="editExpense('${budget._id}', '${expense._id}')" class="btn-secondary btn-small">Edit</button>
                            <button onclick="deleteExpense('${expense._id}')" class="btn-secondary btn-small">Delete</button>
                        </div>
                    </div>
                `).join(''): ''}
            </div>
            <div class="budget-actions">
                <button class="btn-primary add-expense-btn" data-budget-id="${budget._id}">Add Expense</button>
                <button class="btn-secondary delete-budget-btn" data-budget-id="${budget._id}">Delete Budget</button>
            </div>
        `;

        budgetsGrid.appendChild(budgetEl);

        // Add event listeners
        budgetEl.querySelector('.add-expense-btn').addEventListener('click', () => showAddExpenseModal(budget._id));
        budgetEl.querySelector('.delete-budget-btn').addEventListener('click', () => deleteBudget(budget._id));
    });
}

function addCategoryInput() {
    const categoriesList = document.getElementById('categoriesList');
    const categoryInput = document.createElement('div');
    categoryInput.className = 'category-input';
    categoryInput.innerHTML = `
        <input type="text" class="category-name" placeholder="Category name" required>
        <button type="button" class="btn-secondary remove-category">Remove</button>
    `;

    categoryInput.querySelector('.remove-category').addEventListener('click', () => {
        categoryInput.remove();
    });

    categoriesList.appendChild(categoryInput);
}

function resetCategoryInputs() {
    const categoriesList = document.getElementById('categoriesList');
    categoriesList.innerHTML = `
        <div class="category-input">
            <input type="text" class="category-name" placeholder="Category name" required>
        </div>
    `;
}

async function createBudget(e) {
    e.preventDefault();
    
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        const categories = Array.from(document.querySelectorAll('.category-name'))
            .map(input => input.value.trim())
            .filter(Boolean);

        if (categories.length === 0) {
            alert('Please add at least one category');
            return;
        }

        const budgetData = {
            userId: user.id,
            name: document.getElementById('budgetName').value,
            categories: categories,
            limit: parseFloat(document.getElementById('budgetLimit').value)
        };

        const response = await fetch('/api/budgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(budgetData)
        });

        const data = await response.json();
        if (data.success) {
            document.getElementById('createBudgetModal').classList.add('hidden');
            document.getElementById('budgetForm').reset();
            resetCategoryInputs();
            await loadBudgets();
        } else {
            alert(data.message || 'Error creating budget');
        }
    } catch (error) {
        console.error('Error creating budget:', error);
        alert('Failed to create budget. Please try again.');
    }
}

function showAddExpenseModal(budgetId) {
    const budget = currentBudgets.find(b => b._id === budgetId);
    if (!budget) return;

    document.getElementById('budgetId').value = budgetId;
    
    const categorySelect = document.getElementById('expenseCategory');
    categorySelect.innerHTML = budget.categories.map(category => 
        `<option value="${category.name}">${category.name}</option>`
    ).join('');
    
    document.getElementById('expenseDate').valueAsDate = new Date();
    document.getElementById('addExpenseModal').classList.remove('hidden');
}

async function editExpense(budgetId, expenseId) {
    const budget = currentBudgets.find(b => b._id === budgetId);
    const expense = budget.expenses.find(e => e._id === expenseId);
    
    if (!expense) return;

    // Populate edit form
    document.getElementById('editExpenseId').value = expenseId;
    document.getElementById('editExpenseAmount').value = expense.amount;
    document.getElementById('editExpenseDescription').value = expense.description;
    document.getElementById('editExpenseDate').value = expense.date.split('T')[0];
    
    // Populate categories dropdown
    const categorySelect = document.getElementById('editExpenseCategory');
    categorySelect.innerHTML = budget.categories.map(category => 
        `<option value="${category.name}" ${category.name === expense.category ? 'selected' : ''}>
            ${category.name}
        </option>`
    ).join('');
    
    document.getElementById('editExpenseModal').classList.remove('hidden');
}

async function updateExpense(e) {
    e.preventDefault();

    const expenseId = document.getElementById('editExpenseId').value;
    const expenseData = {
        amount: parseFloat(document.getElementById('editExpenseAmount').value),
        category: document.getElementById('editExpenseCategory').value,
        description: document.getElementById('editExpenseDescription').value,
        date: document.getElementById('editExpenseDate').value
    };

    try {
        const response = await fetch(`/api/expenses/${expenseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expenseData)
        });

        const data = await response.json();
        if (data.success) {
            document.getElementById('editExpenseModal').classList.add('hidden');
            document.getElementById('editExpenseForm').reset();
            await loadBudgets();
        } else {
            alert(data.message || 'Error updating expense');
        }
    } catch (error) {
        console.error('Error updating expense:', error);
        alert('Failed to update expense. Please try again.');
    }
}

async function addExpense(e) {
    e.preventDefault();

    const expenseData = {
        budgetId: document.getElementById('budgetId').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        category: document.getElementById('expenseCategory').value,
        description: document.getElementById('expenseDescription').value,
        date: document.getElementById('expenseDate').value
    };

    try {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expenseData)
        });

        const data = await response.json();
        if (data.success) {
            document.getElementById('addExpenseModal').classList.add('hidden');
            document.getElementById('expenseForm').reset();
            await loadBudgets();
        } else {
            alert(data.message || 'Error adding expense');
        }
    } catch (error) {
        console.error('Error adding expense:', error);
        alert('Failed to add expense. Please try again.');
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
            await loadBudgets();
        } else {
            alert(data.message || 'Error deleting expense');
        }
    } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Failed to delete expense. Please try again.');
    }
}

async function deleteBudget(budgetId) {
    if (!confirm('Are you sure you want to delete this budget? All associated expenses will also be deleted.')) return;

    try {
        const response = await fetch(`/api/budgets/${budgetId}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (data.success) {
            await loadBudgets();
        } else {
            alert(data.message || 'Error deleting budget');
        }
    } catch (error) {
        console.error('Error deleting budget:', error);
        alert('Failed to delete budget. Please try again.');
    }
}

async function updateUserSavings(totalBudget, totalSpent) {
    const user = JSON.parse(localStorage.getItem('user'));
    const savingsPercentage = totalBudget > 0 
        ? ((totalBudget - totalSpent) / totalBudget * 100).toFixed(2)
        : 0;

    try {
        await fetch(`/api/users/${user.id}/savings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                totalSavings: totalBudget - totalSpent,
                savingsPercentage: parseFloat(savingsPercentage)
            })
        });
    } catch (error) {
        console.error('Error updating user savings:', error);
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = '/';
}