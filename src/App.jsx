import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import GoogleLogin from './components/GoogleLogin';
import './App.css';

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

  // 發票載具狀態 - 暫時移除，需要CNS資安認證
  // const [invoiceCarriers, setInvoiceCarriers] = useState([]);
  // const [invoiceRecords, setInvoiceRecords] = useState([]);
  const [syncLogs, setSyncLogs] = useState([]);
  const [showAddCarrier, setShowAddCarrier] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [newCarrier, setNewCarrier] = useState({
    carrier_type: 'mobile_barcode',
    carrier_id: '',
    verification_code: '',
    carrier_name: ''
  });

  // 表單狀態
  const [loginForm, setLoginForm] = useState({ username_or_email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '', email: '', full_name: '', password: '', confirmPassword: '', phone: ''
  });
  const [newCategory, setNewCategory] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState('');
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

  // 轉換中文欄位名稱為英文的函數
  const convertChineseFieldsToEnglish = (transaction) => {
    return {
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
    };
  };

  // API 函數
  const apiCall = async (endpoint, options = {}) => {
    console.log(`API Call: ${options.method || 'GET'} ${endpoint}`, options.body ? JSON.parse(options.body) : '');
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: 'include', // 重要：包含 cookies 以維持會話
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // 檢查登入狀態
  const checkLoginStatus = async () => {
    try {
      const response = await apiCall('/api/auth/check-session');
      if (response.success && response.logged_in) {
        setUser(response.user);
        setIsLoggedIn(true);
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
  */

  // Google 登入成功處理
  const handleGoogleLoginSuccess = async (googleUser) => {
    try {
      setLoading(true);
      setError('');
      
      setUser(googleUser);
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
        console.error('Google登入後載入資料失敗:', loadError);
      }
    } catch (error) {
      setError(`Google登入處理失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  */

  // Google 登入錯誤處理
  const handleGoogleLoginError = (errorMessage) => {
    setError(`Google登入失敗: ${errorMessage}`);
  };

  // 用戶註冊
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      if (registerForm.password !== registerForm.confirmPassword) {
        setError('密碼確認不一致');
        return;
      }
      
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
        setShowRegister(false);
        setShowLogin(true);
        setRegisterForm({
          username: '', email: '', full_name: '', password: '', confirmPassword: '', phone: ''
        });
        setError('註冊成功，請登入');
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError(`註冊失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  */

  // 處理標籤切換
  const handleTabChange = async (tabId) => {
    setActiveTab(tabId);
    
    // 根據切換的標籤重新載入對應的資料
    try {
      switch (tabId) {
        case 'transactions':
          console.log('切換到交易記錄，重新載入交易資料...');
          await loadTransactions();
          break;
        case 'groups':
          console.log('切換到群組管理，重新載入群組資料...');
          await loadGroups();
          break;
        case 'overview':
          console.log('切換到總覽，重新載入所有資料...');
          await Promise.all([
            loadTransactions(),
            loadGroups()
          ]);
          break;
        case 'budgets':
          console.log('切換到預算管理，重新載入交易資料...');
          await loadTransactions();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('重新載入資料失敗:', error);
    }
  };

  // 用戶登出
  const handleLogout = async () => {
    try {
      await apiCall('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setIsLoggedIn(false);
      setTransactions([]);
      setGroups([]);
      setInvitations([]);
      setSelectedGroup('全部');
      setActiveTab('overview');
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  // 載入交易記錄
  const loadTransactions = async () => {
    if (!isLoggedIn) return;
    
    console.log('Loading transactions...');
    try {
      setLoading(true);
      let endpoint = '/api/transactions';
      if (selectedGroup !== '本人') {
        const selectedGroupObject = groups.find(g => g.name === selectedGroup);
        if (selectedGroupObject) {
          endpoint = `/api/transactions?group_id=${selectedGroupObject.id}`;
        }
      }
      const data = await apiCall(endpoint);
      console.log('Loaded transactions:', data);
      
      // 轉換中文欄位名稱為英文
      const convertedTransactions = (data.transactions || []).map(convertChineseFieldsToEnglish);
      console.log('Converted transactions:', convertedTransactions);
      
      setTransactions(convertedTransactions);
      setError('');
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setError(`載入交易失敗: ${error.message}`);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };
  */

  // 載入群組列表
  const loadGroups = async (retryCount = 0) => {
    if (!isLoggedIn) return;
    
    console.log("Loading groups...", retryCount > 0 ? `(重試 ${retryCount})` : '');
    try {
      setLoading(true);
      const data = await apiCall("/api/groups");
      console.log("Loaded groups:", data);
      
      // 確保groups是陣列
      const groupsArray = Array.isArray(data.groups) ? data.groups : [];
      setGroups(groupsArray);
      setError("");
      
      // 如果沒有群組且是第一次載入，顯示提示
      if (groupsArray.length === 0 && retryCount === 0) {
        console.log("沒有找到群組，您可以創建第一個群組");
      }
      
    } catch (error) {
      console.error("Failed to load groups:", error);
      
      // 如果是401錯誤且重試次數少於2次，嘗試重新檢查登入狀態
      if (error.message.includes('401') && retryCount < 2) {
        console.log("收到401錯誤，重新檢查登入狀態...");
        const loggedIn = await checkLoginStatus();
        if (loggedIn && retryCount < 2) {
          // 等待1秒後重試
          setTimeout(() => {
            loadGroups(retryCount + 1);
          }, 1000);
          return;
        }
      }
      
      setError(`載入群組失敗: ${error.message}`);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };
  */

  // 載入分類列表
  const loadCategories = async () => {
    if (!isLoggedIn) return;
    
    console.log("Loading categories...");
    try {
      const data = await apiCall("/api/categories");
      console.log("Loaded categories:", data);
      
      if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else {
        // 如果載入失敗，使用預設分類
        setCategories(['餐飲', '交通', '購物', '娛樂', '薪資', '投資']);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
      // 如果載入失敗，使用預設分類
      setCategories(['餐飲', '交通', '購物', '娛樂', '薪資', '投資']);
    }
  };

  // 載入邀請列表
  const loadInvitations = async () => {
    if (!isLoggedIn) return;
    
    try {
      const data = await apiCall("/api/invitations");
      setInvitations(data.invitations || []);
    } catch (error) {
      console.error("Failed to load invitations:", error);
    }
  };

  // 搜索用戶
  const searchUsersForInvite = async (query) => {
    if (!query || query.length < 2) {
      setSearchUsers([]);
      return;
    }
    
    try {
      const data = await apiCall(`/api/auth/search-users?q=${encodeURIComponent(query)}`);
      if (data.success) {
        setSearchUsers(data.users || []);
      }
    } catch (error) {
      console.error("搜索用戶失敗:", error);
    }
  };

  // 組件載入時檢查登入狀態
  useEffect(() => {
    const initApp = async () => {
      try {
        const loggedIn = await checkLoginStatus();
        if (loggedIn) {
          // 只有在確認登入後才載入資料
          await Promise.all([
            loadCategories(),
            loadGroups(),
            loadTransactions(),
            loadInvitations()
          ]);
        }
      } catch (error) {
        console.error('初始化應用程式失敗:', error);
        // 如果檢查登入狀態失敗，不載入任何資料
        setIsLoggedIn(false);
      }
    };

    initApp();
  }, []);

  // 當登入狀態改變時重新載入資料
  useEffect(() => {
    if (isLoggedIn) {
      const loadData = async () => {
        try {
          await Promise.all([
            loadCategories(),
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
  }, [isLoggedIn]  // 當切換到發票載具頁面時載入相關資料 - 暫時註釋
  // useEffect(() => {
  //   if (isLoggedIn && activeTab === 'invoice') {
  //     const loadInvoiceData = async () => {
  //       try {
  //         await Promise.all([
  //           loadInvoiceCarriers(),
  //           loadInvoiceRecords(),
  //           loadSyncLogs()
  //         ]);
  //       } catch (error) {
  //         console.error('載入發票資料失敗:', error);
  //       }
  //     };
  //     
  //     loadInvoiceData();
  //   }
  // }, [isLoggedIn, activeTab]); // 當選擇的群組改變時重新載入交易
  useEffect(() => {
    if (isLoggedIn) {
      loadTransactions();
    }
  }, [selectedGroup, isLoggedIn]);

  // 定期載入邀請通知
  useEffect(() => {
    if (!isLoggedIn) return;

    // 立即載入一次
    loadInvitations();

    // 每30秒檢查一次邀請
    const interval = setInterval(() => {
      loadInvitations();
    }, 30000);

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // 如果未登入，顯示登入/註冊界面
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">多人協作記帳系統</h1>
            <p className="mt-2 text-gray-600">家庭、朋友、情侶共同記帳的最佳選擇</p>
          </div>

          {/* 錯誤提示 */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* 登入表單 */}
          {showLogin && (
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <h2 className="text-xl font-semibold mb-4">登入</h2>
              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">用戶名或郵箱</label>
                  <input
                    type="text"
                    value={loginForm.username_or_email}
                    onChange={(e) => setLoginForm({...loginForm, username_or_email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowLogin(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? '登入中...' : '登入'}
                  </button>
                </div>
              </form>
              
              {/* Google 登入 */}
              <GoogleLogin 
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginError}
              />
            </div>
          )}

          {/* 註冊表單 */}
          {showRegister && (
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <h2 className="text-xl font-semibold mb-4">註冊</h2>
              <form onSubmit={handleRegister}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                  <input
                    type="text"
                    value={registerForm.full_name}
                    onChange={(e) => setRegisterForm({...registerForm, full_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例如：謝明融"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">用戶名</label>
                  <input
                    type="text"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例如：ming_rong"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件</label>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">手機號碼（選填）</label>
                  <input
                    type="tel"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">確認密碼</label>
                  <input
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowRegister(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? '註冊中...' : '註冊'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 登入/註冊選擇 */}
          {!showLogin && !showRegister && (
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="space-y-4">
                <button
                  onClick={() => setShowLogin(true)}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  登入
                </button>
                <button
                  onClick={() => setShowRegister(true)}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  註冊新帳號
                </button>
              </div>
              
              <div className="mt-6 text-center text-sm text-gray-500">
                <p>示範帳號：</p>
                <p>用戶名：demo，密碼：demo123</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 計算統計數據 - 修改為當月統計
  // 群組交易邏輯：當選擇群組時，顯示所有載入的交易（因為API已經根據群組過濾）
  const filteredTransactions = transactions;

  // 獲取當前月份的開始和結束日期
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // 過濾當月交易
  const currentMonthTransactions = filteredTransactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= currentMonthStart && transactionDate <= currentMonthEnd;
  });

  const totalBalance = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = currentMonthTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = Math.abs(currentMonthTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));

  // 趨勢圖數據 (動態顯示當下時間往前6個月)
  const generateTrendData = () => {
    const data = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = date.toLocaleString('zh-TW', { month: 'short' });
      const year = date.getFullYear();

      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthlyTransactions = filteredTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
      });

      const income = monthlyTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      const expense = Math.abs(monthlyTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
      const balance = income - expense;

      data.push({ month: `${monthName}${year.toString().slice(-2)}`, income, expense, balance });
    }
    return data;
  };

  const trendData = generateTrendData();

  // 支出分類統計 - 直接從交易數據中提取分類
  const expenseByCategory = (() => {
    const categoryMap = {};
    filteredTransactions
      .filter(t => t.amount < 0) // 只取支出交易
      .forEach(t => {
        const category = t.category;
        const amount = Math.abs(t.amount);
        if (!categoryMap[category]) {
          categoryMap[category] = 0;
        }
        categoryMap[category] += amount;
      });
    
    return Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value
    }));
  })();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // 處理新增交易
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    console.log('Attempting to add transaction:', newTransaction);
    
    if (newTransaction.description && newTransaction.amount && newTransaction.category) {
      try {
        setLoading(true);
        
        const transactionData = {
          description: newTransaction.description,
          amount: parseFloat(newTransaction.amount),
          category: newTransaction.category,
          date: newTransaction.date
        };
        
        console.log('Sending transaction data to backend:', transactionData);
        
        const response = await apiCall('/api/transactions', {
          method: 'POST',
          body: JSON.stringify(transactionData),
        });
        
        console.log('Transaction saved to backend:', response);
        
        // 重新載入交易記錄以更新列表
        await loadTransactions();
        
        // 重置表單
        setNewTransaction({
          description: '',
          amount: '',
          category: '餐飲',
          date: new Date().toISOString().split('T')[0]
        });
        setShowAddTransaction(false);
        setEditingTransaction(null);
        setError('');
        
      } catch (error) {
        console.error('Failed to add transaction via API:', error);
        setError(`新增交易失敗: ${error.message}`);
      } finally {
        setLoading(false);
      }
    } else {
      setError('請填寫所有必填欄位');
    }
  };

  // 處理編輯交易
  const handleEditTransaction = (transaction) => {
    console.log('Edit button clicked for transaction:', transaction);
    setEditingTransaction(transaction);
    setNewTransaction({
      description: transaction.description,
      amount: transaction.amount.toString(),
      category: transaction.category,
      date: transaction.date
    });
    setShowAddTransaction(true);
  };

  // 處理更新交易
  const handleUpdateTransaction = async (e) => {
    e.preventDefault();
    console.log('Attempting to update transaction:', editingTransaction, newTransaction);
    
    if (editingTransaction && newTransaction.description && newTransaction.amount && newTransaction.category) {
      try {
        setLoading(true);
        
        const transactionData = {
          description: newTransaction.description,
          amount: parseFloat(newTransaction.amount),
          category: newTransaction.category,
          date: newTransaction.date
        };
        
        console.log('Sending update data to backend:', transactionData);

        await apiCall(`/api/transactions/${editingTransaction.id}`, {
          method: 'PUT',
          body: JSON.stringify(transactionData),
        });
        
        console.log('Transaction updated in backend.');
        
        // 重新載入交易記錄
        await loadTransactions();
        
        setEditingTransaction(null);
        setNewTransaction({
          description: '',
          amount: '',
          category: '餐飲',
          date: new Date().toISOString().split('T')[0]
        });
        setShowAddTransaction(false);
        setError('');
        
      } catch (error) {
        console.error('Failed to update transaction via API:', error);
        setError(`更新交易失敗: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // 處理刪除交易
  const handleDeleteTransaction = async (id) => {
    console.log('Attempting to delete transaction:', id);
    
    try {
      setLoading(true);
      
      await apiCall(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
      
      console.log('Transaction deleted from backend.');
      
      // 重新載入交易記錄
      await loadTransactions();
      
      setError('');
    } catch (error) {
      console.error('Failed to delete transaction via API:', error);
      setError(`刪除交易失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  */

  // 處理新增分類
  const handleAddCategory = async () => {
    if (!newCategory || categories.includes(newCategory)) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiCall('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCategory })
      });
      
      if (response.success) {
        // 重新載入分類列表
        await loadCategories();
        setNewCategory('');
        setError('');
      } else {
        setError(response.message || '新增分類失敗');
      }
    } catch (error) {
      console.error('新增分類失敗:', error);
      setError(`新增分類失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  */

  // 處理刪除分類
  const handleDeleteCategory = async (category) => {
    try {
      setLoading(true);
      const response = await apiCall(`/api/categories/${encodeURIComponent(category)}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        // 重新載入分類列表
        await loadCategories();
        setError('');
      } else {
        setError(response.message || '刪除分類失敗');
      }
    } catch (error) {
      console.error('刪除分類失敗:', error);
      setError(`刪除分類失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  */

  // 處理新增群組
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (newGroupName) {
      try {
        setLoading(true);
        const response = await apiCall("/api/groups", {
          method: "POST",
          body: JSON.stringify({
            name: newGroupName,
            description: newGroupDescription,
            member_names: newGroupMembers
          }),
        });
        
        console.log("Group created:", response);
        
        if (response.success) {
          await loadGroups();
          await loadInvitations(); // 重新載入邀請通知
          setNewGroupName("");
          setNewGroupDescription("");
          setNewGroupMembers("");
          setShowCreateGroup(false);
          setError("");
          
          if (response.invited_users && response.invited_users.length > 0) {
            setError(`群組創建成功！已邀請 ${response.invited_users.length} 位成員`);
          }
        } else {
          setError(response.message);
        }
      } catch (error) {
        console.error("Failed to create group:", error);
        setError(`建立群組失敗: ${error.message}`);
      } finally {
        setLoading(false);
      }
    } else {
      setError("群組名稱不能為空");
    }
  };

  // 處理回應邀請
  const handleRespondInvitation = async (invitationId, accept) => {
    try {
      setLoading(true);
      const response = await apiCall(`/api/invitations/${invitationId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ accept })
      });
      
      if (response.success) {
        await loadInvitations();
        await loadGroups();
        setError(response.message);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError(`處理邀請失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  */

  // 處理邀請用戶
  const handleInviteUsers = async () => {
    if (selectedInvitees.length === 0) {
      setError('請選擇要邀請的用戶');
      return;
    }
    
    try {
      setLoading(true);
      
      for (const invitee of selectedInvitees) {
        await apiCall(`/api/groups/${currentGroup.id}/invite`, {
          method: 'POST',
          body: JSON.stringify({
            invitee_id: invitee.id,
            message: `${user.full_name} 邀請您加入群組 "${currentGroup.name}"`
          })
        });
      }
      
      setShowInviteUser(false);
      setSelectedInvitees([]);
      setSearchQuery('');
      setSearchUsers([]);
      setError(`已邀請 ${selectedInvitees.length} 位用戶`);
      
    } catch (error) {
      setError(`邀請用戶失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  */

  // 處理新增預算
  const handleAddBudget = () => {
    if (newBudget.category && newBudget.amount) {
      const budget = {
        id: Date.now(),
        category: newBudget.category,
        amount: parseFloat(newBudget.amount),
        spent: 0
      };
      setBudgets([...budgets, budget]);
      setNewBudget({ category: '', amount: '' });
      setShowAddBudget(false);
    }
  };

  // 發票載具相關函數 - 暫時註釋，需要CNS資安認證
  /*
  const loadInvoiceCarriers = async () => {
    try {
      const response = await apiCall('/api/invoice/carriers');
      if (response.success) {
        setInvoiceCarriers(response.data);
      }
    } catch (error) {
      console.error('載入發票載具失敗:', error);
    }
  };

  const loadInvoiceRecords = async () => {
    try {
      const response = await apiCall('/api/invoice/records');
      if (response.success) {
        setInvoiceRecords(response.data);
      }
    } catch (error) {
      console.error('載入發票紀錄失敗:', error);
    }
  };

  const loadSyncLogs = async () => {
    try {
      const response = await apiCall('/api/invoice/sync-logs');
      if (response.success) {
        setSyncLogs(response.data);
      }
    } catch (error) {
      console.error('載入同步記錄失敗:', error);
    }
  };

  const handleAddCarrier = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await apiCall('/api/invoice/carriers', {
        method: 'POST',
        body: JSON.stringify(newCarrier)
      });
      
      if (response.success) {
        await loadInvoiceCarriers();
        setNewCarrier({
          carrier_type: 'mobile_barcode',
          carrier_id: '',
          verification_code: '',
          carrier_name: ''
        });
        setShowAddCarrier(false);
        setError('載具新增成功');
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError(`新增載具失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  */

  const handleSyncCarrier = async (carrierId) => {
    try {
      setLoading(true);
      const response = await apiCall(`/api/invoice/sync/${carrierId}`, {
        method: 'POST'
      });
      
      if (response.success) {
        await Promise.all([
          loadInvoiceRecords(),
          loadSyncLogs()
        ]);
        setError(`同步完成：找到 ${response.data.invoices_found} 張發票，新增 ${response.data.invoices_new} 張`);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError(`同步失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  */

  const handleImportInvoices = async (invoiceIds) => {
    try {
      setLoading(true);
      const response = await apiCall('/api/invoice/auto-import', {
        method: 'POST',
        body: JSON.stringify({ invoice_record_ids: invoiceIds })
      });
      
      if (response.success) {
        await loadTransactions();
        await loadInvoiceRecords();
        setError(`成功匯入 ${response.data.imported_count} 筆發票紀錄`);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError(`匯入失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  */

  // 處理編輯預算
  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setNewBudget({
      category: budget.category,
      amount: budget.amount.toString()
    });
    setShowAddBudget(true);
  };

  // 處理更新預算
  const handleUpdateBudget = () => {
    if (editingBudget && newBudget.category && newBudget.amount) {
      const updatedBudgets = budgets.map(b => 
        b.id === editingBudget.id 
          ? { ...b, category: newBudget.category, amount: parseFloat(newBudget.amount) }
          : b
      );
      setBudgets(updatedBudgets);
      setEditingBudget(null);
      setNewBudget({ category: '', amount: '' });
      setShowAddBudget(false);
    }
  };

  // 處理刪除預算
  const handleDeleteBudget = (id) => {
    setBudgets(budgets.filter(b => b.id !== id));
  };

  // 處理管理成員
  const handleManageMembers = async (group) => {
    try {
      setLoading(true);
      
      // 獲取群組成員列表
      const response = await apiCall(`/api/groups/${group.id}/members`);
      
      if (response.success) {
        // 將成員資料添加到群組物件中
        const groupWithMembers = {
          ...group,
          members: response.members
        };
        setCurrentGroup(groupWithMembers);
        setShowManageMembers(true);
      } else {
        setError(response.message || '獲取群組成員失敗');
      }
    } catch (error) {
      console.error('獲取群組成員失敗:', error);
      setError(`獲取群組成員失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  */

  // 處理刪除群組
  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`確定要刪除群組「${group.name}」嗎？此操作無法復原。`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await apiCall(`/api/groups/${group.id}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        // 重新載入群組列表
        await loadGroups();
        setError(`群組「${group.name}」已成功刪除`);
      } else {
        setError(response.message || '刪除群組失敗');
      }
    } catch (error) {
      console.error('刪除群組失敗:', error);
      setError(`刪除群組失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  */

  // 關閉對話框
  const handleCloseDialog = () => {
    setShowAddTransaction(false);
    setEditingTransaction(null);
    setNewTransaction({
      description: '',
      amount: '',
      category: '餐飲',
      date: new Date().toISOString().split('T')[0]
    });
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 錯誤提示 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 mx-4 mt-4">
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => setError('')}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            ×
          </button>
        </div>
      )}

      {/* 載入指示器 */}
      {loading && (
        <div className="fixed top-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded z-50">
          載入中...
        </div>
      )}

      {/* 頂部導航 */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">多人協作記帳系統</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* 邀請通知 */}
              {invitations.length > 0 && (
                <button
                  onClick={() => setShowInvitations(true)}
                  className="relative px-3 py-2 text-sm text-blue-600 hover:text-blue-900"
                >
                  邀請通知
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {invitations.length}
                  </span>
                </button>
              )}
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">收支明細表選擇:</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="本人">本人</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.name}>{group.name}</option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {showBalance ? '隱藏' : '顯示'}餘額
              </button>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">歡迎，{user?.full_name}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-900"
                >
                  登出
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要內容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 標籤導航 */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: '總覽' },
              { id: 'transactions', name: '交易記錄' },
              { id: 'budgets', name: '預算管理' },
              { id: 'groups', name: '群組管理' },
              { id: 'categories', name: '分類管理' },
              // { id: 'invoice', name: '發票載具' } // 暫時隱藏，需要CNS資安認證
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要內容區域 */}
          <div className="lg:col-span-2">
            {/* 總覽內容 */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 統計卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">總餘額</p>
                        <p className={`text-2xl font-bold ${showBalance ? (totalBalance >= 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
                          {showBalance ? `$${totalBalance.toLocaleString()}` : '****'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">本月收入</p>
                        <p className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">本月支出</p>
                        <p className="text-2xl font-bold text-red-600">${totalExpense.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 趨勢圖 */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">收支趨勢</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="收入" />
                      <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} name="支出" />
                      <Line type="monotone" dataKey="balance" stroke="#3B82F6" strokeWidth={2} name="淨收入" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 分類管理內容 */}
            {activeTab === 'categories' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">分類管理</h2>
                  <button
                    onClick={() => setShowManageCategories(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    管理分類
                  </button>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categories.map(category => (
                      <div key={category} className="bg-gray-50 p-4 rounded-lg text-center">
                        <span className="text-sm font-medium text-gray-900">{category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 交易記錄內容 */}
            {activeTab === 'transactions' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">交易記錄</h2>
                  <button
                    onClick={() => setShowAddTransaction(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    新增交易
                  </button>
                </div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分類</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">記錄者</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            沒有交易記錄
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map(transaction => (
                          <tr key={transaction.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.category}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.user_name || transaction.username}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {transaction.user_id === user?.id && (
                                <>
                                  <button
                                    onClick={() => handleEditTransaction(transaction)}
                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                  >
                                    編輯
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTransaction(transaction.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    刪除
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 預算內容 */}
            {activeTab === 'budgets' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">預算列表</h2>
                  <button
                    onClick={() => setShowAddBudget(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    新增預算
                  </button>
                </div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分類</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">預算金額</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">已花費</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">剩餘</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {budgets.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            沒有預算記錄
                          </td>
                        </tr>
                      ) : (
                        budgets.map(budget => (
                          <tr key={budget.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{budget.category}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{budget.amount.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{budget.spent.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(budget.amount - budget.spent).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleEditBudget(budget)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                編輯
                              </button>
                              <button
                                onClick={() => handleDeleteBudget(budget.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                刪除
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 群組內容 */}
            {activeTab === 'groups' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">我的群組</h2>
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    建立群組
                  </button>
                </div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">群組名稱</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成員</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {groups.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            沒有群組記錄
                          </td>
                        </tr>
                      ) : (
                        groups.map(group => {
                          console.log('群組資料:', group); // 調試信息
                          return (
                          <tr key={group.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{group.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{group.description || '無描述'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{group.member_count} 人</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                group.user_role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {group.user_role === 'admin' ? '管理員' : '成員'} ({group.user_role})
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleManageMembers(group)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                管理成員
                              </button>
                              {/* 總是顯示管理員按鈕用於測試 */}
                              <button
                                onClick={() => {
                                  setCurrentGroup(group);
                                  setShowInviteUser(true);
                                }}
                                className="text-green-600 hover:text-green-900 mr-4"
                              >
                                邀請成員
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(group)}
                                className="text-red-600 hover:text-red-900"
                              >
                                刪除群組
                              </button>
                            </td>
                          </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 發票載具內容 - 暫時隱藏，需要CNS資安認證 */}
            {/* {activeTab === 'invoice' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🚧</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">發票載具功能開發中</h2>
                    <p className="text-gray-600 mb-4">
                      財政部發票API需要CNS資安認證資格，我們正在申請相關認證。
                    </p>
                    <p className="text-sm text-gray-500">
                      目前您可以手動輸入發票資訊到交易記錄中。
                    </p>
                  </div>
                </div>
              </div>
            )} */}
              </div>
            )}
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
      </div>

      {/* 新增/編輯交易對話框 */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingTransaction ? '編輯交易' : '新增交易 [v2.0 - 無群組]'}
            </h3>
            <form onSubmit={editingTransaction ? handleUpdateTransaction : handleAddTransaction}>
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <input
                  type="text"
                  id="description"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如: 午餐、薪資"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">金額</label>
                <input
                  type="number"
                  id="amount"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如: -100 (支出) 或 500 (收入)"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">分類</label>
                <select
                  id="category"
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-colors duration-200 hover:border-blue-400"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                <input
                  type="date"
                  id="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? '處理中...' : (editingTransaction ? '更新' : '新增')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 管理分類對話框 */}
      {showManageCategories && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">管理分類</h3>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="新增分類"
                />
                <button
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  新增
                </button>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-md font-medium text-gray-800 mb-2">現有分類</h4>
                <ul className="space-y-2">
                  {categories.map(cat => (
                    <li key={cat} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                      <span>{cat}</span>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="text-red-600 hover:text-red-900"
                      >
                        刪除
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowManageCategories(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 建立群組對話框 */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">建立群組</h3>
            <form onSubmit={handleCreateGroup}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">群組名稱</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：謝家、室友群組"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">群組描述（選填）</label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="描述這個群組的用途"
                  rows="2"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="newGroupMembers" className="block text-sm font-medium text-gray-700 mb-1">邀請成員（用姓名，逗號分隔）</label>
                <input
                  type="text"
                  id="newGroupMembers"
                  value={newGroupMembers}
                  onChange={(e) => setNewGroupMembers(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：謝明融，陳雅琳，謝秉均"
                />
                <p className="text-xs text-gray-500 mt-1">輸入已註冊用戶的真實姓名，系統會自動發送邀請</p>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? '處理中...' : '建立'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 邀請通知對話框 */}
      {showInvitations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">群組邀請</h3>
            {invitations.length === 0 ? (
              <p className="text-gray-500 text-center py-4">沒有待處理的邀請</p>
            ) : (
              <div className="space-y-4">
                {invitations.map(invitation => (
                  <div key={invitation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-2">
                      <h4 className="font-medium text-gray-900">{invitation.group_name}</h4>
                      <p className="text-sm text-gray-600">邀請者：{invitation.inviter_name}</p>
                      {invitation.message && (
                        <p className="text-sm text-gray-600 mt-1">訊息：{invitation.message}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRespondInvitation(invitation.id, true)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        disabled={loading}
                      >
                        接受
                      </button>
                      <button
                        onClick={() => handleRespondInvitation(invitation.id, false)}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        disabled={loading}
                      >
                        拒絕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowInvitations(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 邀請用戶對話框 */}
      {showInviteUser && currentGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">邀請用戶加入 "{currentGroup.name}"</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">搜索用戶</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsersForInvite(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="輸入姓名搜索用戶"
              />
            </div>

            {/* 搜索結果 */}
            {searchUsers.length > 0 && (
              <div className="mb-4 max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                {searchUsers.map(user => (
                  <div
                    key={user.id}
                    onClick={() => {
                      if (!selectedInvitees.find(u => u.id === user.id)) {
                        setSelectedInvitees([...selectedInvitees, user]);
                      }
                      setSearchQuery('');
                      setSearchUsers([]);
                    }}
                    className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium">{user.full_name}</div>
                    <div className="text-sm text-gray-500">@{user.username}</div>
                  </div>
                ))}
              </div>
            )}

            {/* 已選擇的用戶 */}
            {selectedInvitees.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">已選擇的用戶</label>
                <div className="space-y-2">
                  {selectedInvitees.map(user => (
                    <div key={user.id} className="flex items-center justify-between bg-blue-50 p-2 rounded-lg">
                      <span className="text-sm">{user.full_name} (@{user.username})</span>
                      <button
                        onClick={() => setSelectedInvitees(selectedInvitees.filter(u => u.id !== user.id))}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        移除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowInviteUser(false);
                  setSelectedInvitees([]);
                  setSearchQuery('');
                  setSearchUsers([]);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleInviteUsers}
                disabled={selectedInvitees.length === 0 || loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? '邀請中...' : `邀請 ${selectedInvitees.length} 位用戶`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增/編輯預算對話框 */}
      {showAddBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingBudget ? '編輯預算' : '新增預算'}
            </h3>
            <form onSubmit={editingBudget ? handleUpdateBudget : handleAddBudget}>
              <div className="mb-4">
                <label htmlFor="budgetCategory" className="block text-sm font-medium text-gray-700 mb-1">分類</label>
                <select
                  id="budgetCategory"
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">選擇分類</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="budgetAmount" className="block text-sm font-medium text-gray-700 mb-1">預算金額</label>
                <input
                  type="number"
                  id="budgetAmount"
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如: 5000"
                />
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBudget(false);
                    setEditingBudget(null);
                    setNewBudget({ category: '', amount: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? '處理中...' : (editingBudget ? '更新' : '新增')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 管理成員對話框 */}
      {showManageMembers && currentGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">管理群組成員: {currentGroup.name}</h3>
            
            <div className="space-y-3">
              {currentGroup.members && currentGroup.members.length > 0 ? (
                currentGroup.members.map(member => (
                  <div key={member.user_id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div>
                      <div className="font-medium">{member.full_name}</div>
                      <div className="text-sm text-gray-500">@{member.username}</div>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                        member.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.role === 'admin' ? '管理員' : '成員'}
                      </span>
                    </div>
                    {member.user_id !== user?.id && currentGroup.user_role === 'admin' && (
                      <button
                        onClick={() => {
                          // 這裡可以添加移除成員的功能
                          console.log('Remove member:', member.user_id);
                        }}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        移除
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">沒有成員資訊</p>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowManageMembers(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增載具對話框 */}
      {showAddCarrier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">新增發票載具</h3>
            <form onSubmit={handleAddCarrier}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">載具類型</label>
                <select
                  value={newCarrier.carrier_type}
                  onChange={(e) => setNewCarrier({ ...newCarrier, carrier_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="mobile_barcode">手機條碼</option>
                  <option value="member_card">會員卡</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">載具編號</label>
                <input
                  type="text"
                  value={newCarrier.carrier_id}
                  onChange={(e) => setNewCarrier({ ...newCarrier, carrier_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：/ABC123"
                  required
                />
              </div>
              {newCarrier.carrier_type === 'mobile_barcode' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">驗證碼</label>
                  <input
                    type="text"
                    value={newCarrier.verification_code}
                    onChange={(e) => setNewCarrier({ ...newCarrier, verification_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="手機條碼驗證碼"
                  />
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">載具名稱（選填）</label>
                <input
                  type="text"
                  value={newCarrier.carrier_name}
                  onChange={(e) => setNewCarrier({ ...newCarrier, carrier_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：我的手機條碼"
                />
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCarrier(false);
                    setNewCarrier({
                      carrier_type: 'mobile_barcode',
                      carrier_id: '',
                      verification_code: '',
                      carrier_name: ''
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? '新增中...' : '新增載具'}
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

