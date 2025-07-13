// Dashboard JavaScript functionality
let currentSection = 'overview';
let users = [];
let withdrawals = [];
let stats = {};
let sidebarCollapsed = false;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
        // For demo purposes, we'll skip authentication
        console.log('No token found, running in demo mode');
    }

    // Set up event listeners
    setupEventListeners();
    
    // Initialize sidebar state
    initializeSidebar();
    
    // Load initial data (with fallback for demo)
    loadDashboardData();
    
    // Set up auto-refresh
    setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
});

function initializeSidebar() {
    const toggleBtn = document.getElementById("toggleSidebar");
    if (toggleBtn) {
        // Set initial icon based on sidebar state
        toggleBtn.innerHTML = '<i class="fas fa-times text-xl"></i>';
    }
}

function setupEventListeners() {
    // Mobile menu
    const openSidebarBtn = document.getElementById("openSidebar");
    if (openSidebarBtn) {
        openSidebarBtn.addEventListener("click", function() {
            document.getElementById("sidebar").classList.remove("sidebar-inactive");
            document.getElementById("sidebar").classList.add("sidebar-active");
            document.getElementById("mobileMenuOverlay").classList.remove("hidden");
        });
    }

    // Desktop sidebar toggle
    const toggleSidebarBtn = document.getElementById("toggleSidebar");
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener("click", function() {
            toggleDesktopSidebar();
        });
    }

    const closeSidebarBtn = document.getElementById("closeSidebar");
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener("click", closeMobileMenu);
    }
    
    const mobileOverlay = document.getElementById("mobileMenuOverlay");
    if (mobileOverlay) {
        mobileOverlay.addEventListener("click", closeMobileMenu);
    }

    // Search functionality
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        userSearch.addEventListener('input', filterUsers);
    }
    
    const withdrawalFilter = document.getElementById('withdrawalFilter');
    if (withdrawalFilter) {
        withdrawalFilter.addEventListener('change', filterWithdrawals);
    }
}

function closeMobileMenu() {
    document.getElementById("sidebar").classList.remove("sidebar-active");
    document.getElementById("sidebar").classList.add("sidebar-inactive");
    document.getElementById("mobileMenuOverlay").classList.add("hidden");
}

function toggleDesktopSidebar() {
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("mainContent");
    const toggleBtn = document.getElementById("toggleSidebar");
    
    sidebarCollapsed = !sidebarCollapsed;
    
    if (sidebarCollapsed) {
        sidebar.classList.remove("sidebar-active");
        sidebar.classList.add("sidebar-inactive");
        mainContent.classList.remove("ml-64");
        mainContent.classList.add("ml-0");
        toggleBtn.innerHTML = '<i class="fas fa-bars text-xl"></i>';
    } else {
        sidebar.classList.remove("sidebar-inactive");
        sidebar.classList.add("sidebar-active");
        mainContent.classList.remove("ml-0");
        mainContent.classList.add("ml-64");
        toggleBtn.innerHTML = '<i class="fas fa-times text-xl"></i>';
    }
}

// Navigation
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    
    // Show selected section
    const targetSection = document.getElementById(section + 'Section');
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
    
    // Update navigation - remove active class from all links
    document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
    
    // Add active class to clicked link
    const activeLink = document.querySelector(`[onclick*="showSection('${section}')"]`);
    if (activeLink) {
        activeLink.classList.add("active");
    }
    
    // Update page title
    const titles = {
        overview: 'Overview',
        users: 'User Management',
        withdrawals: 'Withdrawal Requests',
        analytics: 'Analytics'
    };
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = titles[section] || 'Dashboard';
    }
    
    currentSection = section;
    
    // Load section-specific data
    if (section === 'analytics') {
        loadAnalytics();
    }
    
    // Close mobile menu if open
    closeMobileMenu();
}

// API calls
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('adminToken');
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    const response = await fetch(`/api/admin${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: { ...defaultOptions.headers, ...options.headers }
    });
    
    if (response.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        return;
    }
    
    return response.json();
}

// Data loading functions
async function loadDashboardData() {
    try {
        showLoading();
        
        // Try to load real data, fallback to demo data
        try {
            // Load stats
            stats = await apiCall('/stats');
            updateStatsCards();
            
            // Load users
            users = await apiCall('/users');
            updateUsersTable();
            updateRecentUsers();
            
            // Load withdrawals
            withdrawals = await apiCall('/withdrawals');
            updateWithdrawalsTable();
            updateRecentWithdrawals();
        } catch (error) {
            console.log('API not available, using demo data');
            loadDemoData();
        }
        
        hideLoading();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        loadDemoData();
        hideLoading();
    }
}

function loadDemoData() {
    // Demo stats
    stats = {
        totalUsers: 1250,
        activeUsers: 890,
        totalEarnings: 45000,
        pendingRequests: 12
    };
    updateStatsCards();
    
    // Demo users
    users = [
        {
            telegramId: '123456789',
            username: 'john_doe',
            referralCount: 15,
            walletBalance: 750,
            upiId: 'john@paytm',
            isActive: true,
            joinedAt: new Date().toISOString()
        },
        {
            telegramId: '987654321',
            username: 'jane_smith',
            referralCount: 8,
            walletBalance: 420,
            upiId: 'jane@gpay',
            isActive: true,
            joinedAt: new Date().toISOString()
        }
    ];
    updateUsersTable();
    updateRecentUsers();
    
    // Demo withdrawals
    withdrawals = [
        {
            _id: '1',
            username: 'john_doe',
            userId: '123456789',
            amount: 500,
            upiId: 'john@paytm',
            status: 'pending',
            requestedAt: new Date().toISOString()
        },
        {
            _id: '2',
            username: 'jane_smith',
            userId: '987654321',
            amount: 300,
            upiId: 'jane@gpay',
            status: 'completed',
            requestedAt: new Date().toISOString()
        }
    ];
    updateWithdrawalsTable();
    updateRecentWithdrawals();
}

function updateStatsCards() {
    document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
    document.getElementById('activeUsers').textContent = stats.activeUsers || 0;
    document.getElementById('totalEarnings').textContent = `₹${stats.totalEarnings || 0}`;
    document.getElementById('pendingWithdrawals').textContent = stats.pendingRequests || 0;
}

function updateUsersTable(userList = users) {
    const tbody = document.getElementById("usersTable");
    tbody.innerHTML = "";
    
    userList.forEach(user => {
        const row = document.createElement('tr');
        row.className = 'table-row transition-all duration-200';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <i class="fas fa-user text-indigo-600"></i>
                        </div>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${user.username || 'Unknown'}</div>
                        <div class="text-sm text-gray-500">ID: ${user.telegramId}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${user.referralCount || 0}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ₹${user.walletBalance || 0}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${user.upiId || 'Not set'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${user.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="viewUser('${user.telegramId}')" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="editUserBalance('${user.telegramId}')" class="text-green-600 hover:text-green-900 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="toggleUserStatus('${user.telegramId}')" class="text-${user.isActive ? 'red' : 'green'}-600 hover:text-${user.isActive ? 'red' : 'green'}-900">
                    <i class="fas fa-${user.isActive ? 'ban' : 'check'}"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateWithdrawalsTable(withdrawalList = withdrawals) {
    const tbody = document.getElementById("withdrawalsTable");
    tbody.innerHTML = "";
    
    withdrawalList.forEach(withdrawal => {
        const row = document.createElement('tr');
        const statusColors = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${withdrawal.username || 'Unknown'}</div>
                <div class="text-sm text-gray-500">ID: ${withdrawal.userId}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ₹${withdrawal.amount}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${withdrawal.upiId}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${new Date(withdrawal.requestedAt).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[withdrawal.status]}">
                    ${withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                ${withdrawal.status === 'pending' ? `
                    <button onclick="processWithdrawal('${withdrawal._id || withdrawal.id}', 'approve')" class="text-green-600 hover:text-green-900 mr-3">
                        <i class="fas fa-check"></i>
                    </button>
                    <button onclick="processWithdrawal('${withdrawal._id || withdrawal.id}', 'reject')" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-times"></i>
                    </button>
                ` : `
                    <button onclick="viewWithdrawal('${withdrawal._id || withdrawal.id}')" class="text-indigo-600 hover:text-indigo-900">
                        <i class="fas fa-eye"></i>
                    </button>
                `}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateRecentUsers() {
    const container = document.getElementById('recentUsers');
    container.innerHTML = '';
    
    const recentUsers = users.slice(0, 5);
    recentUsers.forEach(user => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
        div.innerHTML = `
            <div class="flex items-center">
                <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <i class="fas fa-user text-indigo-600 text-sm"></i>
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium text-gray-900">${user.username || 'Unknown'}</p>
                    <p class="text-xs text-gray-500">${new Date(user.joinedAt).toLocaleDateString()}</p>
                </div>
            </div>
            <span class="text-sm text-gray-600">₹${user.walletBalance || 0}</span>
        `;
        container.appendChild(div);
    });
}

function updateRecentWithdrawals() {
    const container = document.getElementById('recentWithdrawals');
    container.innerHTML = '';
    
    const recentWithdrawals = withdrawals.slice(0, 5);
    recentWithdrawals.forEach(withdrawal => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
        div.innerHTML = `
            <div class="flex items-center">
                <div class="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                    <i class="fas fa-rupee-sign text-yellow-600 text-sm"></i>
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium text-gray-900">${withdrawal.username || 'Unknown'}</p>
                    <p class="text-xs text-gray-500">${new Date(withdrawal.requestedAt).toLocaleDateString()}</p>
                </div>
            </div>
            <span class="text-sm text-gray-600">₹${withdrawal.amount}</span>
        `;
        container.appendChild(div);
    });
}

// User management functions
async function viewUser(userId) {
    const user = users.find(u => u.telegramId.toString() === userId.toString());
    if (!user) return;
    
    const modal = document.getElementById('userModal');
    const content = document.getElementById('userModalContent');
    
    content.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Username</label>
                <p class="text-sm text-gray-900">${user.username || 'Unknown'}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Telegram ID</label>
                <p class="text-sm text-gray-900">${user.telegramId}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Referral Code</label>
                <p class="text-sm text-gray-900">${user.referralCode || 'N/A'}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Wallet Balance</label>
                <p class="text-sm text-gray-900">₹${user.walletBalance || 0}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Total Referrals</label>
                <p class="text-sm text-gray-900">${user.referralCount || 0}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">UPI ID</label>
                <p class="text-sm text-gray-900">${user.upiId || 'Not set'}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Joined Date</label>
                <p class="text-sm text-gray-900">${new Date(user.joinedAt).toLocaleDateString()}</p>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

async function editUserBalance(userId) {
    const user = users.find(u => u.telegramId.toString() === userId.toString());
    if (!user) return;
    
    const newBalance = prompt(`Enter new balance for ${user.username}:`, user.walletBalance || 0);
    if (newBalance === null) return;
    
    try {
        await apiCall(`/users/${userId}/balance`, {
            method: 'PUT',
            body: JSON.stringify({ balance: parseFloat(newBalance) })
        });
        
        showSuccess('User balance updated successfully');
        loadDashboardData();
    } catch (error) {
        showError('Failed to update user balance');
    }
}

async function toggleUserStatus(userId) {
    const user = users.find(u => u.telegramId.toString() === userId.toString());
    if (!user) return;
    
    const action = user.isActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    
    try {
        await apiCall(`/users/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ isActive: !user.isActive })
        });
        
        showSuccess(`User ${action}d successfully`);
        loadDashboardData();
    } catch (error) {
        showError(`Failed to ${action} user`);
    }
}

// Withdrawal management functions
async function processWithdrawal(withdrawalId, action) {
    const withdrawal = withdrawals.find(w => (w._id || w.id) === withdrawalId);
    if (!withdrawal) return;
    
    let notes = '';
    let transactionId = '';
    
    if (action === 'approve') {
        transactionId = prompt('Enter transaction ID (optional):') || '';
        notes = prompt('Enter admin notes (optional):') || '';
    } else if (action === 'reject') {
        notes = prompt('Enter rejection reason:');
        if (!notes) return;
    }
    
    if (!confirm(`Are you sure you want to ${action} this withdrawal?`)) return;
    
    try {
        await apiCall(`/withdrawals/${withdrawalId}/${action}`, {
            method: 'PUT',
            body: JSON.stringify({ notes, transactionId })
        });
        
        showSuccess(`Withdrawal ${action}d successfully`);
        loadDashboardData();
    } catch (error) {
        showError(`Failed to ${action} withdrawal`);
    }
}

// Analytics
function loadAnalytics() {
    // User Growth Chart
    const userCtx = document.getElementById('userGrowthChart').getContext('2d');
    new Chart(userCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Users',
                data: [12, 19, 3, 5, 2, 3],
                borderColor: 'rgb(99, 102, 241)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4
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
    
    // Withdrawal Status Chart
    const withdrawalCtx = document.getElementById('withdrawalChart').getContext('2d');
    new Chart(withdrawalCtx, {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'Approved', 'Completed', 'Rejected'],
            datasets: [{
                data: [
                    stats.pendingRequests || 0,
                    stats.approvedRequests || 0,
                    stats.completedRequests || 0,
                    stats.rejectedRequests || 0
                ],
                backgroundColor: [
                    '#fbbf24',
                    '#3b82f6',
                    '#10b981',
                    '#ef4444'
                ]
            }]
        },
        options: {
            responsive: true
        }
    });
}

// Utility functions
function filterUsers() {
    const searchTerm = document.getElementById("userSearch").value.toLowerCase();
    const filteredUsers = users.filter(user => 
        (user.username || "").toLowerCase().includes(searchTerm) ||
        user.telegramId.toString().includes(searchTerm)
    );
    
    updateUsersTable(filteredUsers);
}

function filterWithdrawals() {
    const status = document.getElementById("withdrawalFilter").value;
    const filteredWithdrawals = status === "all" ? 
        withdrawals : 
        withdrawals.filter(w => w.status === status);
    
    updateWithdrawalsTable(filteredWithdrawals);
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function showLoading() {
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
}

function hideLoading() {
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
}

function showSuccess(message) {
    // Simple alert for now - can be replaced with toast notifications
    alert('Success: ' + message);
}

function showError(message) {
    // Simple alert for now - can be replaced with toast notifications
    alert('Error: ' + message);
}

function refreshData() {
    loadDashboardData();
}

function exportUsers() {
    // Export users to CSV
    const csv = users.map(user => 
        `${user.telegramId},${user.username || ''},${user.referralCount || 0},${user.walletBalance || 0},${user.upiId || ''}`
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
    }
}

