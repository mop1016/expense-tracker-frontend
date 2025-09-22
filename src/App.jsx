import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import GoogleLogin from './components/GoogleLogin';
//import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const App = () => {
  // 用戶狀態
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  
  // 應用程式狀態
  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(['餐飲', '交通', '購物', '娛樂', '薪資', '投資']);
  const [groups, setGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [budgets, setBudgets] = useState([]);
  
  // UI 狀態
  const [selectedGroup, setSelectedGroup] = useState('本人');
  const [showBalance, setShowBalance] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showInvitations, setShowInvitations] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);

  // 表單狀態
  const [loginForm, setLoginForm] = useState({ username_or_email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '', email: '', full_name: '', password: '', confirmPassword: '', phone: ''
  });
  const [newCategory, setNewCategory] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [searchUsers, setSearchUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvitees, setSelectedInvitees] = useState([]);

  // 新增交易表單狀態
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    category: '餐飲',
    date: new Date().toISOString().split('T')[0]
  });

  // 新增預算表單狀態
  const [newBudget, setNewBudget] = useState({
    category: '',
    amount: ''
  });

  // 圓餅圖顏色
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // API 函數
  const apiCall = async (endpoint, options = {}) => {
    console.log(`API Call: ${options.method || 'GET'} ${endpoint}`, options.body ? JSON.parse(options.body) : '');
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        credentials: 'include',
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`API Response:`, data);
      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // 檢查登入狀態
  const checkLoginStatus = async () => {
    try {
      const response = await apiCall('/api/auth/check-session');
      if (response.success && response.user) {
        setUser(response.user);
        setIsLoggedIn(true);
        setShowLogin(false);
        return true;
      } else {
        setUser(null);
        setIsLoggedIn(false);
        return false;
      }
    } catch (error) {
      console.error('檢查登入狀態失敗:', error);
      setUser(null);
      setIsLoggedIn(false);
      return false;
    }
  };

  // 用戶登入
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      const response = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username_or_email: loginForm.username_or_email,
          password: loginForm.password
        })
      });
      
      if (response.success) {
        setUser(response.user);
        setIsLoggedIn(true);
        setShowLogin(false);
        setLoginForm({ username_or_email: '', password: '' });
        
        // 登入成功後立即載入所有資料
        try {
          await Promise.all([
            loadGroups(),
            loadTransactions(),
            loadInvitations()
          ]);
        } catch (loadError) {
          console.error('登入後載入資料失敗:', loadError);
        }
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError(`登入失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Google 登入成功處理
  const handleGoogleLoginSuccess = async (googleUser) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiCall('/api/auth/google-login', {
        method: 'POST',
        body: JSON.stringify({
          credential: googleUser.credential
        })
      });
      
      if (response.success) {
        setUser(response.user);
        setIsLoggedIn(true);
        setShowLogin(false);
        
        // 登入成功後立即載入所有資料
        try {
          await Promise.all([
            loadGroups(),
            loadTransactions(),
            loadInvitations()
          ]);
        } catch (loadError) {
          console.error('登入後載入資料失敗:', loadError);
        }
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError(`Google登入處理失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Google 登入錯誤處理
  const handleGoogleLoginError = (errorMessage) => {
    setError(`Google登入失敗: ${errorMessage}`);
  };

  // 用戶註冊
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('密碼確認不符');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await apiCall('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: registerForm.username,
          email: registerForm.email,
          full_name: registerForm.full_name,
          password: registerForm.password,
          phone: registerForm.phone
        })
      });
      
      if (response.success) {
        setUser(response.user);
        setIsLoggedIn(true);
        setShowRegister(false);
        setRegisterForm({ username: '', email: '', full_name: '', password: '', confirmPassword: '', phone: '' });
        
        // 註冊成功後立即載入所有資料
        try {
          await Promise.all([
            loadGroups(),
            loadTransactions(),
            loadInvitations()
          ]);
        } catch (loadError) {
          console.error('註冊後載入資料失敗:', loadError);
        }
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError(`註冊失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 處理標籤切換
  const handleTabChange = async (tabId) => {
    setActiveTab(tabId);
    
    // 當切換到不同標籤時，載入相應的資料
    if (tabId === 'transactions') {
      await loadTransactions();
    } else if (tabId === 'groups') {
      await loadGroups();
    } else if (tabId === 'budget') {
      await loadBudgets();
    }
  };

  // 用戶登出
  const handleLogout = async () => {
    try {
      await apiCall('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setIsLoggedIn(false);
      setShowLogin(true);
      setActiveTab('overview');
      setTransactions([]);
      setGroups([]);
      setBudgets([]);
      setInvitations([]);
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  // 載入交易記錄
  const loadTransactions = async () => {
    try {
      let endpoint = '/api/transactions';
      
      // 如果選擇了特定群組，載入該群組的交易
      if (selectedGroup !== '本人') {
        const selectedGroupObject = groups.find(g => g.name === selectedGroup);
        if (selectedGroupObject) {
          endpoint = `/api/transactions?group_id=${selectedGroupObject.id}`;
        }
      }
      
      const data = await apiCall(endpoint);
      if (data.success) {
        // 轉換中文欄位名稱為英文
        const convertedTransactions = data.data.map(transaction => ({
          id: transaction.id,
          description: transaction['描述'] || transaction.description,
          amount: transaction['金額'] || transaction.amount,
          category: transaction.category,
          date: transaction['日期'] || transaction.date,
          group: transaction.group_name || transaction.group || '個人',
          group_id: transaction.group_id,
          user_id: transaction['使用者ID'] || transaction.user_id,
          user_name: transaction.user_name,
          username: transaction.username,
          type: transaction.type,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at
        }));
        setTransactions(convertedTransactions);
      }
    } catch (error) {
      console.error('載入交易記錄失敗:', error);
    }
  };

  // 載入群組
  const loadGroups = async () => {
    try {
      const data = await apiCall("/api/groups");
      if (data.success) {
        setGroups(data.data);
      }
    } catch (error) {
      console.error('載入群組失敗:', error);
    }
  };

  // 載入預算
  const loadBudgets = async () => {
    try {
      const data = await apiCall("/api/budgets");
      if (data.success) {
        setBudgets(data.data);
      }
    } catch (error) {
      console.error('載入預算失敗:', error);
    }
  };

  // 載入分類
  const loadCategories = async () => {
    try {
      const data = await apiCall("/api/categories");
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('載入分類失敗:', error);
    }
  };

  // 載入邀請
  const loadInvitations = async () => {
    try {
      const data = await apiCall("/api/invitations");
      if (data.success) {
        setInvitations(data.data);
      }
    } catch (error) {
      console.error('載入邀請失敗:', error);
    }
  };

  // 搜尋用戶
  const searchUsersForInvite = async (query) => {
    if (!query.trim()) {
      setSearchUsers([]);
      return;
    }
    
    try {
      const data = await apiCall(`/api/auth/search-users?q=${encodeURIComponent(query)}`);
      if (data.success) {
        setSearchUsers(data.data);
      }
    } catch (error) {
      console.error('搜尋用戶失敗:', error);
    }
  };

  // 新增交易
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const transactionData = {
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        category: newTransaction.category,
        date: newTransaction.date,
        group_id: selectedGroup !== '本人' ? groups.find(g => g.name === selectedGroup)?.id : null
      };
      
      const response = await apiCall('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData)
      });
      
      if (response.success) {
        setShowAddTransaction(false);
        setNewTransaction({
          description: '',
          amount: '',
          category: '餐飲',
          date: new Date().toISOString().split('T')[0]
        });
        await loadTransactions();
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError(`新增交易失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 初始化檢查登入狀態
  useEffect(() => {
    checkLoginStatus();
  }, []);

  // 當登入狀態改變時載入資料
  useEffect(() => {
    if (isLoggedIn) {
      const loadData = async () => {
        try {
          await Promise.all([
            loadGroups(),
            loadTransactions(),
            loadInvitations()
          ]);
        } catch (error) {
          console.error('載入資料失敗:', error);
        }
      };
      loadData();
    }
  }, [isLoggedIn]);

  // 計算統計數據
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const balance = totalIncome - totalExpense;

  // 計算支出分類統計
  const expenseByCategory = categories.map(category => {
    const categoryExpense = transactions
      .filter(t => t.category === category && t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    return {
      name: category,
      value: categoryExpense
    };
  }).filter(item => item.value > 0);

  // 如果未登入，顯示登入/註冊表單
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">多人協作記帳系統</h1>
            <p className="mt-2 text-gray-600">家庭、朋友、情侶共同記帳的最佳選擇</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {!showLogin && !showRegister ? (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-xl font-semibold mb-4">登入</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">用戶名或郵箱</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={loginForm.username_or_email}
                    onChange={(e) => setLoginForm({...loginForm, username_or_email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
                  <input
                    type="password"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? '登入中...' : '登入'}
                </button>
              </form>

              <div className="mt-4">
                <GoogleLogin 
                  onSuccess={handleGoogleLoginSuccess}
                  onError={handleGoogleLoginError}
                />
              </div>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-500"
                  onClick={() => setShowRegister(true)}
                >
                  還沒有帳戶？立即註冊
                </button>
              </div>
            </div>
          ) : showRegister ? (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-xl font-semibold mb-4">註冊新帳戶</h2>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">用戶名</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件</label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">全名</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={registerForm.full_name}
                    onChange={(e) => setRegisterForm({...registerForm, full_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電話</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
                  <input
                    type="password"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">確認密碼</label>
                  <input
                    type="password"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? '註冊中...' : '註冊'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-500"
                  onClick={() => setShowRegister(false)}
                >
                  已有帳戶？立即登入
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // 主應用程式界面
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 錯誤提示 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4 mt-4">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">×</button>
        </div>
      )}

      {/* 載入指示器 */}
      {loading && (
        <div className="fixed top-4 right-4 bg-blue-100 text-blue-700 px-4 py-2 rounded">
          載入中...
        </div>
      )}

      {/* 頂部導航 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">記帳應用程式</h1>
              {/* 邀請通知 */}
              {invitations.length > 0 && (
                <button
                  onClick={() => setShowInvitations(true)}
                  className="ml-4 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {invitations.length} 個邀請
                </button>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">歡迎，{user?.username}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要內容 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* 標籤導航 */}
        <div className="px-4 py-6 sm:px-0">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: '總覽' },
                { id: 'transactions', name: '交易記錄' },
                { id: 'categories', name: '分類管理' },
                { id: 'budget', name: '預算' },
                { id: 'groups', name: '群組' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 主要內容區域 */}
        <div className="px-4 py-6 sm:px-0">
          {/* 總覽內容 */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 統計卡片 */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-sm font-medium text-gray-500">總收入</h3>
                  <p className="text-2xl font-bold text-green-600">
                    ${showBalance ? totalIncome.toLocaleString() : '***'}
                  </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-sm font-medium text-gray-500">總支出</h3>
                  <p className="text-2xl font-bold text-red-600">
                    ${showBalance ? totalExpense.toLocaleString() : '***'}
                  </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-sm font-medium text-gray-500">餘額</h3>
                  <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${showBalance ? balance.toLocaleString() : '***'}
                  </p>
                </div>
              </div>

              {/* 支出分類圓餅圖 */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">支出分類</h2>
                  {expenseByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={expenseByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {expenseByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-gray-500">沒有支出數據</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 交易記錄內容 */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">交易記錄</h2>
                <button
                  onClick={() => setShowAddTransaction(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  新增交易
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          描述
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          金額
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          分類
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          日期
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          群組
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.description}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction.group || '個人'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 其他標籤內容 */}
          {activeTab === 'categories' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">分類管理</h2>
              <p className="text-gray-500">分類管理功能開發中...</p>
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">預算管理</h2>
              <p className="text-gray-500">預算管理功能開發中...</p>
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">群組管理</h2>
              <p className="text-gray-500">群組管理功能開發中...</p>
            </div>
          )}
        </div>
      </main>

      {/* 新增交易對話框 */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              新增交易
            </h3>
            <form onSubmit={handleAddTransaction}>
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <input
                  type="text"
                  id="description"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  金額
                </label>
                <input
                  type="number"
                  id="amount"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  分類
                </label>
                <select
                  id="category"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  日期
                </label>
                <input
                  type="date"
                  id="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md disabled:opacity-50"
                >
                  {loading ? '新增中...' : '新增'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTransaction(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
