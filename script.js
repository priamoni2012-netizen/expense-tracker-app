// ডেটা স্টোরেজ
const storageKey = 'expenseTrackerData';
const defaultCategories = {
    income: ['বেতন', 'ব্যবসা', 'বিনিয়োগ', 'অন্যান্য আয়'],
    expense: ['খাদ্য', 'পরিবহন', 'শিক্ষা', 'স্বাস্থ্য', 'বিনোদন', 'অন্যান্য ব্যয়']
};

let appData = {
    orgName: 'আমার প্রতিষ্ঠান',
    transactions: [],
    categories: { ...defaultCategories },
    bank1: { name: 'ব্যাংক-১', balance: 0 },
    bank2: { name: 'ব্যাংক-২', balance: 0 }
};

let currentCategoryType = 'income';

// ডেটা লোড করা
function loadData() {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
        const loaded = JSON.parse(saved);
        appData = { ...appData, ...loaded };
    }
}

// ডেটা সেভ করা
function saveData() {
    localStorage.setItem(storageKey, JSON.stringify(appData));
}

// আজকের তারিখ সেট করা
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transDate').value = today;
    document.getElementById('balanceDate').value = today;
}

// প্রতিষ্ঠানের নাম আপডেট করা
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setTodayDate();
    
    document.getElementById('orgName').value = appData.orgName;
    document.getElementById('orgName').addEventListener('change', function() {
        appData.orgName = this.value;
        saveData();
    });

    // ট্যাব সুইচিং
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // ক্যাটাগরী ট্যাব সুইচিং
    document.querySelectorAll('.category-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const catType = this.getAttribute('data-cat-type');
            switchCategoryTab(catType);
        });
    });

    // ব্যালান্সিং ডেট পিকার
    document.getElementById('balanceDate').addEventListener('change', updateDailyBalance);

    // প্রাথমিক আপডেট
    updateCategoryDropdown();
    renderCategoryList();
    renderTransactionsList();
    updateDailyBalance();
    updateBankBalance();
});

// ট্যাব সুইচ করা
function switchTab(tabName) {
    // সব ট্যাব লুকান
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // নির্বাচিত ট্যাব দেখান
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// ক্যাটাগরী ট্যাব সুইচ করা
function switchCategoryTab(catType) {
    currentCategoryType = catType;
    document.querySelectorAll('.category-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// ক্যাটাগরী ড্রপডাউন আপডেট করা
function updateCategoryDropdown() {
    const categorySelect = document.getElementById('category');
    const transType = document.getElementById('transType').value;
    const categories = appData.categories[transType] || [];

    categorySelect.innerHTML = '';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

// লেনদেন ধরন পরিবর্তন হলে ক্যাটাগরী আপডেট করা
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('transType').addEventListener('change', updateCategoryDropdown);
});

// লেনদেন যোগ করা
function addTransaction() {
    const date = document.getElementById('transDate').value;
    const type = document.getElementById('transType').value;
    const category = document.getElementById('category').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value;

    if (!date || !category || !amount || amount <= 0) {
        alert('অনুগ্রহ করে সব তথ্য সঠিকভাবে পূরণ করুন');
        return;
    }

    const transaction = {
        id: Date.now(),
        date,
        type,
        category,
        amount,
        description,
        createdAt: new Date().toLocaleString('bn-BD')
    };

    appData.transactions.push(transaction);
    saveData();
    renderTransactionsList();
    updateDailyBalance();
    updateBankBalance();

    // ফর্ম রিসেট
    document.getElementById('amount').value = '';
    document.getElementById('description').value = '';
    document.getElementById('transDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('transType').value = 'income';
    updateCategoryDropdown();
}

// লেনদেন রেন্ডার করা
function renderTransactionsList() {
    const container = document.getElementById('transactionsList');
    container.innerHTML = '';

    // সর্বশেষ ৫০টি লেনদেন দেখান (সর্বশেষ প্রথম)
    const sorted = [...appData.transactions].reverse().slice(0, 50);

    if (sorted.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #95a5a6;">এখনও কোন লেনদেন নেই</p>';
        return;
    }

    sorted.forEach(trans => {
        const div = document.createElement('div');
        div.className = `transaction-item ${trans.type}`;
        
        const formattedDate = new Date(trans.date + 'T00:00:00').toLocaleDateString('bn-BD', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const amountSign = trans.type === 'income' ? '+' : '-';
        
        div.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-date">${formattedDate}</div>
                <div class="transaction-category">${trans.category}</div>
                ${trans.description ? `<div class="transaction-desc">${trans.description}</div>` : ''}
            </div>
            <div style="display: flex; align-items: center;">
                <span class="transaction-amount ${trans.type}">${amountSign}${trans.amount.toLocaleString('bn-BD')}</span>
                <button class="btn btn-delete" onclick="deleteTransaction(${trans.id})">মুছুন</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// লেনদেন মুছা
function deleteTransaction(id) {
    if (confirm('এটি মুছতে চান?')) {
        appData.transactions = appData.transactions.filter(t => t.id !== id);
        saveData();
        renderTransactionsList();
        updateDailyBalance();
        updateBankBalance();
    }
}

// ক্যাটাগরী যোগ করা
function addCategory() {
    const input = document.getElementById('newCategory');
    const categoryName = input.value.trim();

    if (!categoryName) {
        alert('অনুগ্রহ করে ক্যাটাগরীর নাম লিখুন');
        return;
    }

    if (appData.categories[currentCategoryType].includes(categoryName)) {
        alert('এই ক্যাটাগরী ইতিমধ্যে বিদ্যমান');
        return;
    }

    appData.categories[currentCategoryType].push(categoryName);
    saveData();
    input.value = '';
    renderCategoryList();
    updateCategoryDropdown();
}

// ক্যাটাগরী লিস্ট রেন্ডার করা
function renderCategoryList() {
    const incomeList = document.getElementById('incomeCategoryList');
    const expenseList = document.getElementById('expenseCategoryList');

    incomeList.innerHTML = '';
    appData.categories.income.forEach(cat => {
        incomeList.appendChild(createCategoryItem(cat, 'income'));
    });

    expenseList.innerHTML = '';
    appData.categories.expense.forEach(cat => {
        expenseList.appendChild(createCategoryItem(cat, 'expense'));
    });
}

// ক্যাটাগরী আইটেম তৈরি করা
function createCategoryItem(categoryName, type) {
    const div = document.createElement('div');
    div.className = 'category-item';
    
    div.innerHTML = `
        <span>${categoryName}</span>
        <button class="btn btn-delete" onclick="deleteCategory('${categoryName}', '${type}')">মুছুন</button>
    `;
    
    return div;
}

// ক্যাটাগরী মুছা
function deleteCategory(categoryName, type) {
    if (confirm(`'${categoryName}' মুছতে চান?`)) {
        appData.categories[type] = appData.categories[type].filter(c => c !== categoryName);
        saveData();
        renderCategoryList();
        updateCategoryDropdown();
    }
}

// দৈনিক ব্যালান্স আপডেট করা
function updateDailyBalance() {
    const selectedDate = document.getElementById('balanceDate').value;
    
    const dayIncome = appData.transactions
        .filter(t => t.date === selectedDate && t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const dayExpense = appData.transactions
        .filter(t => t.date === selectedDate && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const dayBalance = dayIncome - dayExpense;

    document.getElementById('dayIncome').textContent = dayIncome.toLocaleString('bn-BD') + ' টাকা';
    document.getElementById('dayExpense').textContent = dayExpense.toLocaleString('bn-BD') + ' টাকা';
    
    const balanceElement = document.getElementById('dayBalance');
    balanceElement.textContent = dayBalance.toLocaleString('bn-BD') + ' টাকা';
    balanceElement.style.color = dayBalance >= 0 ? '#27ae60' : '#e74c3c';

    // হাতে নগদ আপডেট করা
    const bank1Value = parseFloat(document.getElementById('bank1Balance').value) || 0;
    const bank2Value = parseFloat(document.getElementById('bank2Balance').value) || 0;
    const totalBankBalance = bank1Value + bank2Value;
    
    // সব লেনদেনের মোট
    const totalIncome = appData.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = appData.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const cashBalance = (totalIncome - totalExpense) - totalBankBalance;
    const cashElement = document.getElementById('cashBalance');
    cashElement.textContent = cashBalance.toLocaleString('bn-BD') + ' টাকা';
    cashElement.style.color = cashBalance >= 0 ? '#27ae60' : '#e74c3c';
}

// ব্যাংক ব্যালান্স আপডেট করা
function updateBankBalance() {
    const bankName1 = document.getElementById('bankName1').value || 'ব্যাংক-১';
    const bankName2 = document.getElementById('bankName2').value || 'ব্যাংক-২';
    const bank1Balance = parseFloat(document.getElementById('bank1Balance').value) || 0;
    const bank2Balance = parseFloat(document.getElementById('bank2Balance').value) || 0;

    appData.bank1 = { name: bankName1, balance: bank1Balance };
    appData.bank2 = { name: bankName2, balance: bank2Balance };
    saveData();

    updateDailyBalance();
}

// ব্যাংক ডেটা লোড করা
function loadBankData() {
    document.getElementById('bankName1').value = appData.bank1.name;
    document.getElementById('bank1Balance').value = appData.bank1.balance;
    document.getElementById('bankName2').value = appData.bank2.name;
    document.getElementById('bank2Balance').value = appData.bank2.balance;
}

// ডকুমেন্ট লোড হওয়ার পর
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loadBankData, 100);
});