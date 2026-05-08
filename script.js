// Check if user is logged in
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (currentPage === 'dashboard.html' || currentPage === '') {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
            window.location.href = 'index.html';
        } else {
            initDashboard();
        }
    } else {
        initLogin();
    }
});

// ============= LOGIN PAGE LOGIC =============
function initLogin() {
    const loginForm = document.getElementById('loginForm');
    const registerToggle = document.getElementById('registerToggle');
    const cancelRegister = document.getElementById('cancelRegister');
    const registerBtn = document.getElementById('registerBtn');
    const registerForm = document.getElementById('registerForm');
    const loginMessage = document.getElementById('loginMessage');

    // Toggle between login and register
    registerToggle.addEventListener('click', () => {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    });

    cancelRegister.addEventListener('click', () => {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        clearMessage();
    });

    // Handle login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Get all users from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            showMessage('تم تسجيل الدخول بنجاح!', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
        }

        loginForm.reset();
    });

    // Handle registration
    registerBtn.addEventListener('click', () => {
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;

        if (!name || !email || !password) {
            showMessage('الرجاء ملء جميع الحقول', 'error');
            return;
        }

        // Get all users
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Check if email already exists
        if (users.some(u => u.email === email)) {
            showMessage('هذا البريد الإلكتروني مسجل بالفعل', 'error');
            return;
        }

        // Add new user
        const newUser = {
            id: Date.now(),
            name: name,
            email: email,
            password: password
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        showMessage('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول', 'success');
        
        setTimeout(() => {
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            document.getElementById('email').value = email;
            document.getElementById('password').value = '';
            clearMessage();
        }, 1500);
    });

    function showMessage(msg, type) {
        loginMessage.textContent = msg;
        loginMessage.className = `message ${type}`;
    }

    function clearMessage() {
        loginMessage.textContent = '';
        loginMessage.className = 'message';
    }
}

// ============= DASHBOARD LOGIC =============
function initDashboard() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    document.getElementById('userName').textContent = `مرحباً، ${currentUser.name}`;

    // Initialize demo data if first time
    initializeDemoData(currentUser);

    // Display bank card info
    displayBankCard(currentUser);

    // Display wallet
    displayWallet(currentUser);

    // Display transactions
    displayTransactions(currentUser);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // Add task
    document.getElementById('addTaskForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value;
        const category = document.getElementById('taskCategory').value;
        const dueDate = document.getElementById('taskDueDate').value;
        const description = document.getElementById('taskDescription').value;

        if (!title.trim()) {
            alert('الرجاء إدخال عنوان المهمة');
            return;
        }

        const task = {
            id: Date.now(),
            userId: currentUser.id,
            title: title,
            category: category,
            dueDate: dueDate,
            description: description,
            completed: false,
            createdAt: new Date().toISOString()
        };

        // Save task
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        tasks.push(task);
        localStorage.setItem('tasks', JSON.stringify(tasks));

        // Reset form
        document.getElementById('addTaskForm').reset();
        
        // Refresh tasks display
        renderTasks('all');
        updateStats();
    });

    // Category filter
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTasks(btn.dataset.filter);
        });
    });

    // Modal close
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);

    // Money Modal close
    const moneyModalCloseBtn = document.querySelector('#moneyModal .modal-close');
    if (moneyModalCloseBtn) {
        moneyModalCloseBtn.addEventListener('click', () => {
            document.getElementById('moneyModal').classList.add('hidden');
        });
    }

    // Add money button
    document.getElementById('addMoneyBtn').addEventListener('click', () => {
        openMoneyModal('add', currentUser);
    });

    // Remove money button
    document.getElementById('removeMoneyBtn').addEventListener('click', () => {
        openMoneyModal('remove', currentUser);
    });

    // Money form submission
    document.getElementById('moneyForm').addEventListener('submit', (e) => {
        e.preventDefault();
        handleMoneyTransaction(currentUser);
    });

    // Initialize
    renderTasks('all');
    updateStats();
}

function renderTasks(filter) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const tasksList = document.getElementById('tasksList');

    // Filter tasks for current user
    let userTasks = tasks.filter(t => t.userId === currentUser.id);

    // Apply category filter
    if (filter !== 'all') {
        userTasks = userTasks.filter(t => t.category === filter);
    }

    // Sort by due date
    userTasks.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
    });

    if (userTasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <p>لا توجد مهام حالياً</p>
                <p class="text-small">أضف مهمة جديدة للبدء</p>
            </div>
        `;
        return;
    }

    tasksList.innerHTML = userTasks.map(task => `
        <div class="task-card ${task.completed ? 'completed' : ''}" onclick="openTaskModal(${task.id})">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                   onclick="event.stopPropagation(); toggleTask(${task.id})" />
            <div class="task-header">
                <div>
                    <span class="task-category ${task.category}">${getCategoryLabel(task.category)}</span>
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                    ${task.dueDate ? `<div class="task-due-date">📅 ${formatDate(task.dueDate)}</div>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const userTasks = tasks.filter(t => t.userId === currentUser.id);
    const completed = userTasks.filter(t => t.completed).length;
    const pending = userTasks.length - completed;

    document.getElementById('totalTasks').textContent = userTasks.length;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
}

function toggleTask(taskId) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks(getActiveFilter());
        updateStats();
    }
}

function openTaskModal(taskId) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div>
            <p><strong>العنوان:</strong> ${escapeHtml(task.title)}</p>
            <p><strong>الفئة:</strong> ${getCategoryLabel(task.category)}</p>
            ${task.description ? `<p><strong>الوصف:</strong> ${escapeHtml(task.description)}</p>` : ''}
            ${task.dueDate ? `<p><strong>تاريخ الاستحقاق:</strong> ${formatDate(task.dueDate)}</p>` : ''}
            <p><strong>الحالة:</strong> ${task.completed ? 'مكتملة ✓' : 'قيد الانتظار'}</p>
            <p><strong>تم الإنشاء:</strong> ${formatDate(task.createdAt)}</p>
        </div>
    `;

    const deleteBtn = document.getElementById('deleteTaskBtn');
    deleteBtn.onclick = () => deleteTask(taskId);

    document.getElementById('taskModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('taskModal').classList.add('hidden');
}

function deleteTask(taskId) {
    if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
        let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        tasks = tasks.filter(t => t.id !== taskId);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        closeModal();
        renderTasks(getActiveFilter());
        updateStats();
    }
}

// ============= BANK DATA FUNCTIONS =============

function initializeDemoData(currentUser) {
    // Check if user already has demo data
    const userBankData = JSON.parse(localStorage.getItem(`bankData_${currentUser.id}`) || 'null');
    
    if (!userBankData) {
        // First time login - add demo data with 0 balance
        const bankData = {
            cardNumber: `**** **** **** ${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
            cardHolder: currentUser.name,
            expiryDate: `${Math.floor(Math.random() * 12) + 1}${Math.floor(Math.random() * 2) + 2}`,
            cvv: '***',
            usdBalance: 0.00,
            eurBalance: 0.00,
            sarBalance: 0.00,
            madBalance: 0.00,
            pointsBalance: 0
        };
        
        localStorage.setItem(`bankData_${currentUser.id}`, JSON.stringify(bankData));

        // Add demo transactions (empty list since balance is 0)
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        localStorage.setItem('transactions', JSON.stringify(transactions));

        // Add demo tasks
        const demoTasks = [
            {
                id: Date.now() + 100,
                userId: currentUser.id,
                title: 'دفع فاتورة الكهرباء',
                category: 'finance',
                dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                description: 'دفع فاتورة الكهرباء الشهرية',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 101,
                userId: currentUser.id,
                title: 'إنهاء المشروع الجديد',
                category: 'work',
                dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                description: 'إنهاء تطوير المشروع الجديد والتسليم',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 102,
                userId: currentUser.id,
                title: 'الاجتماع مع العملاء',
                category: 'work',
                dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                description: 'عقد اجتماع مع العملاء لمناقشة المتطلبات الجديدة',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 103,
                userId: currentUser.id,
                title: 'شراء البقالة',
                category: 'personal',
                dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                description: 'الذهاب إلى السوق وشراء احتياجات المنزل',
                completed: true,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 104,
                userId: currentUser.id,
                title: 'ممارسة الرياضة',
                category: 'personal',
                dueDate: new Date(Date.now() + 0 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                description: 'الذهاب إلى الجيم لمدة ساعة',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 105,
                userId: currentUser.id,
                title: 'مراجعة الحسابات الشهرية',
                category: 'finance',
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                description: 'مراجعة والتحقق من الحسابات والنفقات الشهرية',
                completed: false,
                createdAt: new Date().toISOString()
            }
        ];

        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        tasks.push(...demoTasks);
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
}

function displayBankCard(currentUser) {
    const bankData = JSON.parse(localStorage.getItem(`bankData_${currentUser.id}`));
    
    if (bankData) {
        document.getElementById('cardNumber').textContent = bankData.cardNumber;
        document.getElementById('cardHolder').textContent = bankData.cardHolder;
    }
}

function displayWallet(currentUser) {
    const bankData = JSON.parse(localStorage.getItem(`bankData_${currentUser.id}`));
    
    if (bankData) {
        document.getElementById('usdBalance').textContent = `$${bankData.usdBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('eurBalance').textContent = `€${bankData.eurBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('sarBalance').textContent = `﷼${bankData.sarBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('madBalance').textContent = `د.م.${bankData.madBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        document.getElementById('pointsBalance').textContent = bankData.pointsBalance.toLocaleString('en-US');
    }
}

function displayTransactions(currentUser) {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const userTransactions = transactions
        .filter(t => t.userId === currentUser.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    const transactionsList = document.getElementById('transactionsList');
    
    if (userTransactions.length === 0) {
        transactionsList.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 20px;">لا توجد معاملات حالياً</p>';
        return;
    }

    transactionsList.innerHTML = userTransactions.map(trans => `
        <div class="transaction-item ${trans.type}">
            <div class="transaction-info">
                <div class="transaction-icon">${trans.icon}</div>
                <div class="transaction-details">
                    <div class="transaction-type">${trans.title}</div>
                    <div class="transaction-date">${formatDate(trans.date)}</div>
                </div>
            </div>
            <div class="transaction-amount ${trans.type}">
                ${trans.type === 'income' ? '+' : '-'}${trans.amount.toFixed(2)} ${trans.currency}
            </div>
        </div>
    `).join('');
}

// ============= UTILITY FUNCTIONS =============

function getCategoryLabel(category) {
    const labels = {
        'personal': 'شخصي',
        'work': 'العمل',
        'finance': 'مالي'
    };
    return labels[category] || category;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getActiveFilter() {
    const activeBtn = document.querySelector('.category-btn.active');
    return activeBtn ? activeBtn.dataset.filter : 'all';
}

// ============= MONEY MANAGEMENT FUNCTIONS =============

function openMoneyModal(type, currentUser) {
    const modal = document.getElementById('moneyModal');
    const title = document.getElementById('moneyModalTitle');
    const submitBtn = document.getElementById('moneySubmitBtn');
    const moneyForm = document.getElementById('moneyForm');
    
    if (type === 'add') {
        title.textContent = 'إضافة أموال ➕';
        submitBtn.textContent = 'إضافة أموال';
        moneyForm.dataset.action = 'add';
    } else {
        title.textContent = 'سحب أموال ➖';
        submitBtn.textContent = 'سحب أموال';
        moneyForm.dataset.action = 'remove';
    }
    
    moneyForm.reset();
    document.getElementById('moneyMessage').textContent = '';
    document.getElementById('moneyMessage').className = 'message';
    modal.classList.remove('hidden');
}

function handleMoneyTransaction(currentUser) {
    const amount = parseFloat(document.getElementById('moneyAmount').value);
    const currency = document.getElementById('moneyCurrency').value;
    const password = document.getElementById('moneyPassword').value;
    const description = document.getElementById('moneyDescription').value || '';
    const action = document.getElementById('moneyForm').dataset.action;
    const messageDiv = document.getElementById('moneyMessage');

    if (!action) {
        showMoneyMessage('خطأ: لم يتم تحديد نوع العملية', 'error');
        return;
    }

    // Verify password
    if (password !== currentUser.password) {
        showMoneyMessage('كلمة المرور غير صحيحة', 'error');
        return;
    }

    if (amount <= 0) {
        showMoneyMessage('الرجاء إدخال مبلغ صحيح', 'error');
        return;
    }

    // Get bank data
    let bankData = JSON.parse(localStorage.getItem(`bankData_${currentUser.id}`));
    
    if (!bankData) {
        showMoneyMessage('خطأ: لم تتم تهيئة البيانات المصرفية', 'error');
        return;
    }
    
    // Determine currency key and emoji
    let currencyKey, currencyEmoji;
    const currencyMap = {
        'usd': { key: 'usdBalance', emoji: '💵', symbol: '$' },
        'eur': { key: 'eurBalance', emoji: '€', symbol: '€' },
        'sar': { key: 'sarBalance', emoji: '﷼', symbol: '﷼' },
        'mad': { key: 'madBalance', emoji: '💎', symbol: 'د.م.' }
    };

    const currencyInfo = currencyMap[currency];
    currencyKey = currencyInfo.key;
    currencyEmoji = currencyInfo.emoji;

    // Check if sufficient balance for removal
    if (action === 'remove' && bankData[currencyKey] < amount) {
        showMoneyMessage('الرصيد غير كافي', 'error');
        return;
    }

    // Update balance
    if (action === 'add') {
        bankData[currencyKey] += amount;
    } else {
        bankData[currencyKey] -= amount;
    }

    // Save updated bank data
    localStorage.setItem(`bankData_${currentUser.id}`, JSON.stringify(bankData));

    // Create transaction record
    const transactionType = action === 'add' ? 'income' : 'expense';
    const transactionTitle = action === 'add' 
        ? (description || 'إضافة أموال')
        : (description || 'سحب أموال');

    const transaction = {
        id: Date.now(),
        userId: currentUser.id,
        type: transactionType,
        icon: action === 'add' ? '➕' : '➖',
        title: transactionTitle,
        date: new Date().toISOString(),
        amount: amount,
        currency: currency.toUpperCase()
    };

    // Add to transactions
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    // Show success message
    showMoneyMessage(`تم ${action === 'add' ? 'إضافة' : 'سحب'} ${amount.toFixed(2)} ${currencyInfo.symbol} بنجاح!`, 'success');

    // Update display
    displayWallet(currentUser);
    displayTransactions(currentUser);

    // Clear form and close modal after 1.5 seconds
    setTimeout(() => {
        document.getElementById('moneyModal').classList.add('hidden');
        document.getElementById('moneyForm').reset();
    }, 1500);
}

function showMoneyMessage(msg, type) {
    const messageDiv = document.getElementById('moneyMessage');
    messageDiv.textContent = msg;
    messageDiv.className = `message ${type}`;
}
