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
    dailyBalances: {} // {date: {bank1: 0, bank2: 0, cash: 0, bank1Name: '', bank2Name: ''}}
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

    // ব্যাংক ইনপুট চেঞ্জ ইভেন্ট
    document.getElementById('bank1Balance').addEventListener('input', function() {
        updateCashBalance();
    });
    document.getElementById('bank2Balance').addEventListener('input', function() {
        updateCashBalance();
    });
    document.getElementById('bankName1').addEventListener('change', function() {
        saveBankInfo();
    });
    document.getElementById('bankName2').addEventListener('change', function() {
        saveBankInfo();
    });

    // রিপোর্ট ডেট সেট করা
    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    document.getElementById('reportStartDate').value = firstDay;
    document.getElementById('reportEndDate').value = today;

    // প্রাথমিক আপডেট
    updateCategoryDropdown();
    renderCategoryList();
    renderTransactionsList();
    updateDailyBalance();
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
        container.innerHTML = '<p style="text-align: center; color: #95a5a6;">এখনও কোনো লেনদেন নেই</p>';
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
    
    // নির্বাচিত তারিখের আয় ও ব্যয়
    const dayIncome = appData.transactions
        .filter(t => t.date === selectedDate && t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const dayExpense = appData.transactions
        .filter(t => t.date === selectedDate && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const dayBalance = dayIncome - dayExpense;

    // দৈনিক ব্যালান্স প্রদর্শন করা
    document.getElementById('dayIncome').textContent = dayIncome.toLocaleString('bn-BD') + ' টাকা';
    document.getElementById('dayExpense').textContent = dayExpense.toLocaleString('bn-BD') + ' টাকা';
    
    const balanceElement = document.getElementById('dayBalance');
    balanceElement.textContent = dayBalance.toLocaleString('bn-BD') + ' টাকা';
    balanceElement.style.color = dayBalance >= 0 ? '#27ae60' : '#e74c3c';

    // ব্যাংক ও নগদ ব্যালান্স লোড করা
    loadBankCashBalance(selectedDate, dayBalance);
}

// ব্যাংক এবং নগদ ব্যালান্স লোড করা
function loadBankCashBalance(date, dayBalance) {
    if (!appData.dailyBalances[date]) {
        appData.dailyBalances[date] = {
            bank1: 0,
            bank2: 0,
            cash: dayBalance,
            bank1Name: '',
            bank2Name: ''
        };
    }

    const balance = appData.dailyBalances[date];
    document.getElementById('bankName1').value = balance.bank1Name || '';
    document.getElementById('bank1Balance').value = balance.bank1 || 0;
    document.getElementById('bankName2').value = balance.bank2Name || '';
    document.getElementById('bank2Balance').value = balance.bank2 || 0;

    // নগদ ব্যালান্স দেখানো
    const cashBalance = dayBalance - ((balance.bank1 || 0) + (balance.bank2 || 0));
    const cashElement = document.getElementById('cashBalance');
    cashElement.textContent = cashBalance.toLocaleString('bn-BD') + ' টাকা';
    cashElement.style.color = cashBalance >= 0 ? '#27ae60' : '#e74c3c';
}

// নগদ ব্যালান্স স্বয়ংক্রিয়ভাবে আপডেট করা
function updateCashBalance() {
    const selectedDate = document.getElementById('balanceDate').value;
    const dayBalanceText = document.getElementById('dayBalance').textContent;
    const dayBalance = parseFloat(dayBalanceText.replace(/[^\d.-]/g, '')) || 0;
    
    if (!appData.dailyBalances[selectedDate]) {
        appData.dailyBalances[selectedDate] = {
            bank1: 0,
            bank2: 0,
            cash: 0,
            bank1Name: '',
            bank2Name: ''
        };
    }

    const bank1Value = parseFloat(document.getElementById('bank1Balance').value) || 0;
    const bank2Value = parseFloat(document.getElementById('bank2Balance').value) || 0;
    const totalBankBalance = bank1Value + bank2Value;
    
    // নগদ = মোট দৈনিক ব্যালান্স - ব্যাংক ব্যালান্স
    const cashBalance = dayBalance - totalBankBalance;
    
    appData.dailyBalances[selectedDate].bank1 = bank1Value;
    appData.dailyBalances[selectedDate].bank2 = bank2Value;
    appData.dailyBalances[selectedDate].cash = cashBalance;
    
    saveData();

    const cashElement = document.getElementById('cashBalance');
    cashElement.textContent = cashBalance.toLocaleString('bn-BD') + ' টাকা';
    cashElement.style.color = cashBalance >= 0 ? '#27ae60' : '#e74c3c';
}

// ব্যাংক তথ্য সংরক্ষণ করা
function saveBankInfo() {
    const selectedDate = document.getElementById('balanceDate').value;
    
    if (!appData.dailyBalances[selectedDate]) {
        appData.dailyBalances[selectedDate] = {
            bank1: 0,
            bank2: 0,
            cash: 0
        };
    }

    appData.dailyBalances[selectedDate].bank1Name = document.getElementById('bankName1').value;
    appData.dailyBalances[selectedDate].bank2Name = document.getElementById('bankName2').value;
    
    saveData();
}

// ব্যাংক ব্যালান্স আপডেট করা
function updateBankBalance() {
    const selectedDate = document.getElementById('balanceDate').value;
    const bankName1 = document.getElementById('bankName1').value || '';
    const bankName2 = document.getElementById('bankName2').value || '';
    const bank1Balance = parseFloat(document.getElementById('bank1Balance').value) || 0;
    const bank2Balance = parseFloat(document.getElementById('bank2Balance').value) || 0;

    if (!appData.dailyBalances[selectedDate]) {
        appData.dailyBalances[selectedDate] = {
            bank1: 0,
            bank2: 0,
            cash: 0
        };
    }

    appData.dailyBalances[selectedDate].bank1 = bank1Balance;
    appData.dailyBalances[selectedDate].bank2 = bank2Balance;
    appData.dailyBalances[selectedDate].bank1Name = bankName1;
    appData.dailyBalances[selectedDate].bank2Name = bankName2;
    
    saveData();
    updateDailyBalance();
    alert('ব্যাংক ব্যালান্স আপডেট হয়েছে!');
}

// রিপোর্ট তৈরি করা
function generateReport() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;

    if (!startDate || !endDate) {
        alert('অনুগ্রহ করে উভয় তারিখ নির্বাচন করুন');
        return;
    }

    if (startDate > endDate) {
        alert('শুরু তারিখ শেষ তারিখের আগে হতে হবে');
        return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dates.push(dateStr);
    }

    // প্রথম তারিখ থেকে ব্যাংক নামগুলি পান
    let bank1Name = '';
    let bank2Name = '';
    
    for (let date of dates) {
        if (appData.dailyBalances[date]) {
            if (!bank1Name && appData.dailyBalances[date].bank1Name) {
                bank1Name = appData.dailyBalances[date].bank1Name;
            }
            if (!bank2Name && appData.dailyBalances[date].bank2Name) {
                bank2Name = appData.dailyBalances[date].bank2Name;
            }
        }
    }

    // রিপোর্ট ডেটা সংগ্রহ করা
    let html = '<table class="report-table"><thead><tr>';
    html += '<th>তারিখ</th>';
    html += `<th>${bank1Name || 'ব্যাংক-१'}</th>`;
    html += `<th>${bank2Name || 'ব্যাংক-२'}</th>`;
    html += '<th>মোট ব্যাংক</th>';
    html += '</tr></thead><tbody>';

    let totalBank1 = 0;
    let totalBank2 = 0;
    let totalBankAll = 0;

    dates.forEach(date => {
        const balance = appData.dailyBalances[date];
        
        if (balance) {
            const bank1 = balance.bank1 || 0;
            const bank2 = balance.bank2 || 0;
            const totalBank = bank1 + bank2;

            totalBank1 += bank1;
            totalBank2 += bank2;
            totalBankAll += totalBank;

            const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('bn-BD', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            html += `<tr>`;
            html += `<td>${formattedDate}</td>`;
            html += `<td>${bank1.toLocaleString('bn-BD')}</td>`;
            html += `<td>${bank2.toLocaleString('bn-BD')}</td>`;
            html += `<td style="font-weight: bold; background-color: #d5dbdb;">${totalBank.toLocaleString('bn-BD')}</td>`;
            html += `</tr>`;
        }
    });

    html += '</tbody></table>';

    // সারসংক্ষেপ
    html += `<div class="report-summary">
        <div class="summary-row">
            <span class="summary-label">মোট ${bank1Name || 'ব্যাংক-१'}:</span>
            <span class="summary-value">${totalBank1.toLocaleString('bn-BD')} টাকা</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">মোট ${bank2Name || 'ব্যাংক-२'}:</span>
            <span class="summary-value">${totalBank2.toLocaleString('bn-BD')} টাকা</span>
        </div>
        <div class="summary-row" style="background-color: rgba(255, 255, 255, 0.2);">
            <span class="summary-label">সর্বমোট (সব ব্যাংক):</span>
            <span class="summary-value">${totalBankAll.toLocaleString('bn-BD')} টাকা</span>
        </div>
    </div>`;

    document.getElementById('reportContainer').innerHTML = html;
}
