import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, List, PieChart as PieChartIcon, Grid, Plus, Settings, 
  ChevronLeft, ChevronRight, X, Cloud, CheckCircle2, Copy, Check, 
  Link as LinkIcon, PenLine, ChevronDown, ArrowUpDown, GripVertical,
  TrendingUp, CheckSquare, EyeOff, Activity, Download, Scissors, Search
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, setPersistence, browserLocalPersistence, inMemoryPersistence } from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, onSnapshot, collection, addDoc, 
  deleteDoc, updateDoc
} from 'firebase/firestore';
import { Preferences } from '@capacitor/preferences';
import { App as CapApp } from '@capacitor/app';

// Your live Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyA4kCFvaQYLVw9K1OxzkPjJ0YrqTrpNZOY",
  authDomain: "joint-ledger-6362c.firebaseapp.com",
  projectId: "joint-ledger-6362c",
  storageBucket: "joint-ledger-6362c.firebasestorage.app",
  messagingSenderId: "411028955617",
  appId: "1:411028955617:web:699aa9d03e14b5dbf0b2a0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "joint-ledger-6362c";

// Updated vibrant colors
const PIE_COLORS = ['#cddc39', '#f57c00', '#0288d1', '#e64a19', '#8bc34a', '#9c27b0', '#e91e63'];

const EXPENSE_EMOJIS = [
  '🍔', '🛒', '🍕', '☕', '🍽️', '🍻', '🏠', '🛋️️', '🧹', '🔧',
  '💡', '💧', '🔥', '🚗', '⛽', '🚌', '✈️', '🚆', '🏥', '💊',
  '🦷', '🐶', '🐱', '🛍️', '👕', '💄', '🧴', '🎮', '🎬', '🍿',
  '📚', '🎓', '🏖️', '🎟️', '🏋️', '💇', '👶', '🧸', '📱', '💻',
  '🔌', '🎁', '🎀', '🎉', '📦', '💸', '💳', '🧾', '🔒', '🛠',
  '🚲', '🪴', '🎸', '🎨', '🧵', '⚽', '🏕', '📷', '🥩', '🥦',
  '💼', '🪙', '💎', '🤑', '🤝', '🏆'
];

const INCOME_EMOJIS = [
  '💰', '📈', '🏢', '🏦', '💵', '💻'
];

const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Housing', type: 'expense', icon: '🏠', parentId: '', sortOrder: 0 },
  { id: '1-1', name: 'Rent/Mortgage', type: 'expense', icon: '🏠', parentId: '1' },
  { id: '1-2', name: 'Maintenance', type: 'expense', icon: '🔧', parentId: '1' },
  { id: '2', name: 'Utilities', type: 'expense', icon: '💡', parentId: '', sortOrder: 1 },
  { id: '2-1', name: 'Electricity', type: 'expense', icon: '💡', parentId: '2' },
  { id: '2-2', name: 'Water', type: 'expense', icon: '💧', parentId: '2' },
  { id: '2-3', name: 'Internet', type: 'expense', icon: '🌐', parentId: '2' },
  { id: '3', name: 'Food & Dining', type: 'expense', icon: '🍽️️', parentId: '', sortOrder: 2 },
  { id: '3-1', name: 'Groceries', type: 'expense', icon: '🛒', parentId: '3' },
  { id: '3-2', name: 'Dining Out', type: 'expense', icon: '🍕', parentId: '3' },
  { id: '3-3', name: 'Coffee', type: 'expense', icon: '☕', parentId: '3' },
  { id: '4', name: 'Transport', type: 'expense', icon: '🚗', parentId: '', sortOrder: 3 },
  { id: '4-1', name: 'Gas', type: 'expense', icon: '⛽', parentId: '4' },
  { id: '4-2', name: 'Public Transit', type: 'expense', icon: '🚌', parentId: '4' },
  { id: '5', name: 'Personal Care', type: 'expense', icon: '💇', parentId: '', sortOrder: 4 },
  { id: '6', name: 'Entertainment', type: 'expense', icon: '🎬', parentId: '', sortOrder: 5 },
  { id: '7', name: 'Pets', type: 'expense', icon: '🐶', parentId: '', sortOrder: 6 },
  { id: '8', name: 'Paycheck', type: 'income', icon: '💰', parentId: '' },
  { id: '9', name: 'Bonus', type: 'income', icon: '📈', parentId: '' },
  { id: '10', name: 'Side Hustle', type: 'income', icon: '💻', parentId: '' },
  { id: '11', name: 'Investments', type: 'income', icon: '🏦', parentId: '' },
];

const formatMoney = (amount, currency = 'USD') => {
  const symbols = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
  const num = Number(amount || 0);
  return `${symbols[currency] || '$'}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateString + 'T12:00:00').toLocaleDateString('en-US', options);
};

const getMonthKey = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const sortByDateAndTime = (txArray) => {
  return [...txArray].sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    if (dateA !== dateB) return dateA > dateB ? -1 : 1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
};

export default function JointLedgerApp() {
  const [user, setUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(true);
  
  // App State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentDate, setCurrentDate] = useState(new Date()); 
  
  // Data State
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({ name: 'SpendLink', startingBalance: 0, currency: 'USD', theme: 'dark', useManualDate: false, manualDate: '' });
  const [linkedLedgerId, setLinkedLedgerId] = useState('');
  
  // Modals & Sub-states
  const [showAddTx, setShowAddTx] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [defaultTxType, setDefaultTxType] = useState('expense');
  const [showSettings, setShowSettings] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [expandedTxs, setExpandedTxs] = useState([]);
  
  // Sorting & Reordering State
  const [sortMode, setSortMode] = useState('custom');
  const [isReordering, setIsReordering] = useState(false);
  const [reorderList, setReorderList] = useState([]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [txFilter, setTxFilter] = useState('all'); 

  // Infinite Carousel & Calendar State
  const [carouselIndex, setCarouselIndex] = useState(1);
  const [enableTransition, setEnableTransition] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null); 
  const [selectedCalDay, setSelectedCalDay] = useState(null);
  const [subToDelete, setSubToDelete] = useState(null);

  const activeDashTile = carouselIndex === 5 ? 0 : carouselIndex === 0 ? 3 : carouselIndex - 1;
  const [hoveredId, setHoveredId] = useState(null);
  const [hoveredTrend, setHoveredTrend] = useState(null);

  const getTodayDateString = () => {
    if (settings.useManualDate && settings.manualDate) return settings.manualDate;
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };
  const todayStr = getTodayDateString();
  const currentViewMonthKey = getMonthKey(currentDate);

  // Clear sub-views when navigating away
  useEffect(() => {
    setSelectedCalDay(null);
    setSubToDelete(null);
  }, [carouselIndex, currentViewMonthKey]);

  useEffect(() => {
    try {
      const savedLink = localStorage.getItem('joint_ledger_linked_id');
      if (savedLink) setLinkedLedgerId(savedLink);
    } catch (e) {}

    const initAuth = async () => {
      try { await setPersistence(auth, browserLocalPersistence); } 
      catch (error) { await setPersistence(auth, inMemoryPersistence); }
      try { await signInAnonymously(auth); } 
      catch (error) { console.error("Auth Error:", error); }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));

    const initDeepLinks = async () => {
      try {
        await CapApp.addListener('appUrlOpen', (data) => {
          if (data.url.includes('expense')) {
            setDefaultTxType('expense'); setEditingTx(null); setShowAddTx(true);
          } else if (data.url.includes('income')) {
            setDefaultTxType('income'); setEditingTx(null); setShowAddTx(true);
          }
        });
      } catch (e) {}
    };
    initDeepLinks();

    return () => { unsubscribe(); try { CapApp.removeAllListeners(); } catch (e) {} };
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    setIsSyncing(true);
    const activeLedgerId = linkedLedgerId || user.uid;
    const userRef = doc(db, 'artifacts', appId, 'users', activeLedgerId);
    
    const txUnsub = onSnapshot(collection(userRef, 'transactions'), (snapshot) => {
      setTransactions(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
      setIsSyncing(false);
    });

    const catUnsub = onSnapshot(collection(userRef, 'categories'), (snapshot) => {
      const cats = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      if (cats.length === 0 && !linkedLedgerId) {
        DEFAULT_CATEGORIES.forEach(cat => {
          const { id, ...catData } = cat; 
          addDoc(collection(userRef, 'categories'), catData);
        });
      } else setCategories(cats);
    });

    const settingsUnsub = onSnapshot(doc(userRef, 'settings', 'main'), (docSnap) => {
      if (docSnap.exists()) setSettings(prev => ({ ...prev, ...docSnap.data() }));
      else if (!linkedLedgerId) setDoc(doc(userRef, 'settings', 'main'), { name: 'SpendLink', startingBalance: 0, currency: 'USD', theme: 'dark' });
    });

    return () => { txUnsub(); catUnsub(); settingsUnsub(); };
  }, [user, linkedLedgerId]);

  const viewMonthChronologicalTx = useMemo(() => {
    return transactions.filter(t => (t.date || '').substring(0, 7) === currentViewMonthKey);
  }, [transactions, currentViewMonthKey]);

  const viewMonthBudgetTx = useMemo(() => {
    return transactions.filter(t => {
      if (t.isExcludedFromBudget && t.type === 'expense') return false; 
      if (t.type === 'bill') return false; // Isolate bills from math
      const txMonth = t.budgetMonth || (t.date ? t.date.substring(0, 7) : '');
      return txMonth === currentViewMonthKey;
    });
  }, [transactions, currentViewMonthKey]);

  const clearedViewMonthBudgetTx = useMemo(() => {
    return viewMonthBudgetTx.filter(t => t.date <= todayStr);
  }, [viewMonthBudgetTx, todayStr]);

  const previousMonthsData = useMemo(() => {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const sixMonthsData = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const mKey = getMonthKey(d);
      
      const monthTxs = transactions.filter(t => {
        if (t.isExcludedFromBudget && t.type === 'expense') return false; 
        if (t.type === 'bill') return false;
        const txMonth = t.budgetMonth || (t.date ? t.date.substring(0, 7) : '');
        if (txMonth !== mKey) return false;
        if (mKey === getMonthKey(new Date()) && t.date > todayStr) return false; 
        return true;
      });

      const inc = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const exp = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
      
      sixMonthsData.push({ name: d.toLocaleDateString('en-US', { month: 'short' }), Income: inc, Spent: exp });
    }
    return sixMonthsData;
  }, [transactions, currentDate, todayStr]);

  const summary = useMemo(() => {
    const income = clearedViewMonthBudgetTx.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const spent = clearedViewMonthBudgetTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    const chronologicalClearedTx = transactions.filter(t => t.date <= todayStr && t.type !== 'bill');
    const totalIncome = chronologicalClearedTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalSpent = chronologicalClearedTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalBalance = Number(settings.startingBalance || 0) + totalIncome - totalSpent;

    return { income, spent, net: income - spent, totalBalance };
  }, [clearedViewMonthBudgetTx, transactions, settings, todayStr]);

  useEffect(() => {
    const syncWidgetData = async () => {
      try {
        const balanceString = formatMoney(summary.totalBalance, settings.currency);
        await Preferences.set({ key: 'widget_balance', value: balanceString });
      } catch (error) {}
    };
    syncWidgetData();
  }, [summary.totalBalance, settings.currency]); 

  const { pieData, legendData, totalSpent } = useMemo(() => {
    const expensesByCategory = {};
    let total = 0;

    clearedViewMonthBudgetTx.filter(t => t.type === 'expense').forEach(t => {
      const processItem = (catId, amt) => {
        let cat = categories.find(c => c.id === catId) || { name: 'Uncategorized', icon: '❓' };
        if (cat.parentId) {
          const parent = categories.find(c => c.id === cat.parentId);
          if (parent) cat = parent;
        }
        if (!expensesByCategory[cat.name]) expensesByCategory[cat.name] = { amount: 0, icon: cat.icon };
        expensesByCategory[cat.name].amount += Number(amt || 0);
        total += Number(amt || 0);
      };

      if (t.isSplit) {
        (t.splits || []).forEach(s => processItem(s.categoryId, s.amount));
      } else {
        processItem(t.categoryId, t.amount);
      }
    });
    
    const sortedRaw = Object.entries(expensesByCategory)
      .map(([name, data]) => ({ name, value: data.amount, icon: data.icon }))
      .sort((a, b) => b.value - a.value)
      .map((item, idx) => ({ ...item, fill: PIE_COLORS[idx % PIE_COLORS.length] }));

    let legend = [];
    if (sortedRaw.length <= 5) legend = [...sortedRaw];
    else {
      legend = sortedRaw.slice(0, 4);
      const otherSum = sortedRaw.slice(4).reduce((sum, item) => sum + item.value, 0);
      legend.push({ name: 'All other spending', value: otherSum, fill: '#ffffff', icon: '⚪', isOther: true });
    }

    return { pieData: sortedRaw, legendData: legend, totalSpent: total };
  }, [clearedViewMonthBudgetTx, categories]);

  const toggleExpandTx = (id, e) => {
    e.stopPropagation();
    setExpandedTxs(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleExportCSV = () => {
    let csv = "Date,Type,Master Category,Sub Category,Note,Split Amount,Transaction Total\n";
    const sorted = sortByDateAndTime(transactions);
    
    const escapeCsv = (str) => `"${(str || '').toString().replace(/"/g, '""')}"`;

    sorted.forEach(t => {
      const processRow = (catId, amt, note) => {
         let masterName = 'Unknown';
         let subName = '';
         const cat = categories.find(c => c.id === catId);
         if (cat) {
           if (cat.parentId) {
              subName = cat.name;
              const master = categories.find(c => c.id === cat.parentId);
              if (master) masterName = master.name;
           } else {
              masterName = cat.name;
           }
         }
         csv += `${t.date},${t.type},${escapeCsv(masterName)},${escapeCsv(subName)},${escapeCsv(note)},${amt},${t.amount}\n`;
      };

      if (t.isSplit) {
         t.splits.forEach(s => processRow(s.categoryId, s.amount, s.note || t.note));
      } else {
         processRow(t.categoryId, t.amount, t.note);
      }
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'spendlink_transactions.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleAddTransaction = async (tx) => {
    if (!user || !db) return;
    const activeLedgerId = linkedLedgerId || user.uid;
    await addDoc(collection(db, 'artifacts', appId, 'users', activeLedgerId, 'transactions'), tx);
    setShowAddTx(false);
  };

  const handleUpdateTransaction = async (id, updatedTx) => {
    if (!user || !db) return;
    const activeLedgerId = linkedLedgerId || user.uid;
    await updateDoc(doc(db, 'artifacts', appId, 'users', activeLedgerId, 'transactions', id), updatedTx);
    setShowAddTx(false); setEditingTx(null);
  };

  const handleDeleteTransaction = async (id) => {
    if (!user || !db) return;
    const activeLedgerId = linkedLedgerId || user.uid;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', activeLedgerId, 'transactions', id));
  };

  const handleSaveSettings = async (newSettings) => {
    if (!user || !db) return;
    const activeLedgerId = linkedLedgerId || user.uid;
    await setDoc(doc(db, 'artifacts', appId, 'users', activeLedgerId, 'settings', 'main'), newSettings);
    setShowSettings(false);
  };

  const handlePostSubscription = (sub) => {
    const txData = {
       type: 'expense',
       amount: sub.amount,
       categoryId: sub.isSplit ? null : sub.categoryId,
       isSplit: sub.isSplit || false,
       splits: sub.splits || null,
       date: todayStr, 
       budgetMonth: currentViewMonthKey, 
       note: sub.note,
       subId: sub.id,
       isRecurring: true,
       createdAt: Date.now(),
       isExcludedFromBudget: false
    };
    handleAddTransaction(txData);
  };

  const handleMarkAsPaid = (tx) => {
    handleUpdateTransaction(tx.id, {
        ...tx,
        date: todayStr, 
        budgetMonth: tx.budgetMonth || tx.date.substring(0, 7),
        type: tx.type === 'bill' ? 'expense' : tx.type
    });
  };

  const handleSkipSub = (subId) => {
    const updatedSubs = (settings.subscriptions || []).map(s => {
        if (s.id === subId) {
            return { ...s, skippedMonths: [...(s.skippedMonths || []), currentViewMonthKey] };
        }
        return s;
    });
    handleSaveSettings({ ...settings, subscriptions: updatedSubs });
    setSubToDelete(null);
  };

  const handleDeleteConfirm = (subState) => {
    if (subState.type === 'sub') {
        const updatedSubs = (settings.subscriptions || []).filter(s => s.id !== subState.item.id);
        handleSaveSettings({ ...settings, subscriptions: updatedSubs });
    } else {
        handleDeleteTransaction(subState.item.id);
    }
    setSubToDelete(null);
  };

  const handleAddCategory = async (cat) => {
    if (!user || !db) return;
    const activeLedgerId = linkedLedgerId || user.uid;
    const masterCats = categories.filter(c => c.type === 'expense' && !c.parentId);
    if (!cat.parentId && cat.type === 'expense') cat.sortOrder = masterCats.length; 
    await addDoc(collection(db, 'artifacts', appId, 'users', activeLedgerId, 'categories'), cat);
    setShowAddCat(false);
  };

  const handleUpdateCategory = async (id, updatedCat) => {
    if (!user || !db) return;
    const activeLedgerId = linkedLedgerId || user.uid;
    const monthKey = getMonthKey(currentDate);
    
    if (updatedCat.budget !== undefined) {
      const currentCategory = categories.find(c => c.id === id);
      const existingBudgets = currentCategory?.budgets || {};
      updatedCat.budgets = { ...existingBudgets, [monthKey]: parseFloat(updatedCat.budget) || 0 };
      delete updatedCat.budget;
    }
    await updateDoc(doc(db, 'artifacts', appId, 'users', activeLedgerId, 'categories', id), updatedCat);
    setShowAddCat(false); setEditingCategory(null);
  };

  const handleDeleteCategory = async (id) => {
    if (!user || !db) return;
    const activeLedgerId = linkedLedgerId || user.uid;
    const subCats = categories.filter(c => c.parentId === id);
    await deleteDoc(doc(db, 'artifacts', appId, 'users', activeLedgerId, 'categories', id));
    for (const sub of subCats) { await deleteDoc(doc(db, 'artifacts', appId, 'users', activeLedgerId, 'categories', sub.id)); }
  };

  const getTodayDateObj = () => {
    if (settings.useManualDate && settings.manualDate) return new Date(settings.manualDate + 'T12:00:00'); 
    return new Date();
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const getBudgetForMonth = (category, targetDate) => {
    const subCats = categories.filter(c => c.parentId === category.id);
    if (subCats.length > 0) return subCats.reduce((sum, sub) => sum + getBudgetForMonth(sub, targetDate), 0);
    if (category.budget !== undefined && !category.budgets) return Number(category.budget) || 0;
    if (!category.budgets) return 0;

    let searchDate = new Date(targetDate);
    for (let i = 0; i < 24; i++) {
      const key = getMonthKey(searchDate);
      if (category.budgets[key] !== undefined) return Number(category.budgets[key]);
      searchDate.setMonth(searchDate.getMonth() - 1);
    }
    return 0; 
  };

  const handleTouchStart = (e) => { 
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY }); 
    setIsDragging(true); 
    setDragOffset(0); 
    setEnableTransition(false);
    setSwipeDirection(null); 
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !touchStart) return;
    
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    const deltaX = currentX - touchStart.x;
    const deltaY = currentY - touchStart.y;

    let dir = swipeDirection;
    if (!dir) {
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        dir = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
        setSwipeDirection(dir);
      }
    }

    if (dir === 'vertical') return;

    if (dir === 'horizontal') {
      let offset = deltaX;
      setDragOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setEnableTransition(true);
    
    if (swipeDirection === 'horizontal') {
      if (dragOffset < -50) setCarouselIndex(prev => prev + 1);
      else if (dragOffset > 50) setCarouselIndex(prev => prev - 1);
    }
    
    setDragOffset(0);
    setSwipeDirection(null);
  };

  const handleTransitionEnd = (e) => {
    if (e.propertyName !== 'transform') return; 
    
    if (carouselIndex === 5) {
      setEnableTransition(false); 
      setCarouselIndex(1); 
    } else if (carouselIndex === 0) {
      setEnableTransition(false);
      setCarouselIndex(4); 
    }
  };

  const renderDashboard = () => {
    let activeCenterDisplay = { icon: <TrendingUp size={28} className="mb-2 text-[#e3ece7]" />, title: "Total amount", amount: totalSpent };
    if (hoveredId === 'ALL_OTHER') {
      activeCenterDisplay = { icon: <div className="text-3xl mb-1">⚪</div>, title: "All other spending", amount: legendData.find(d => d.isOther)?.value || 0 };
    } else if (hoveredId !== null) {
      const activeEntry = pieData.find(d => d.name === hoveredId);
      if (activeEntry) activeCenterDisplay = { icon: <div className="text-3xl mb-1">{activeEntry.icon}</div>, title: activeEntry.name, amount: activeEntry.value };
    }

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDisplayDate = (currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear()) 
      ? new Date() 
      : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); 
    const chartDateString = `${startOfMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDisplayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    const todayDay = parseInt(todayStr.split('-')[2], 10);
    const todayDateObj = new Date(todayStr + 'T12:00:00');
    const isCurrentMonth = currentDate.getMonth() === todayDateObj.getMonth() && currentDate.getFullYear() === todayDateObj.getFullYear();
    const isFutureMonth = currentDate > todayDateObj && !isCurrentMonth;

    let effectiveTodayDay = todayDay;
    if (isFutureMonth) effectiveTodayDay = 0;
    if (!isCurrentMonth && !isFutureMonth) effectiveTodayDay = 32;

    const viewedYear = currentDate.getFullYear();
    const viewedMonth = currentDate.getMonth();
    const daysInViewedMonth = new Date(viewedYear, viewedMonth + 1, 0).getDate();
    const startDayOfWeek = new Date(viewedYear, viewedMonth, 1).getDay(); 

    // Subscription & Bills logic for Calendar
    const unpostedSubs = (settings.subscriptions || []).filter(sub => {
       const startStr = sub.startMonth || '0000-00';
       if (currentViewMonthKey < startStr) return false;
       if ((sub.skippedMonths || []).includes(currentViewMonthKey)) return false;
       return !viewMonthBudgetTx.some(t => t.subId === sub.id);
    });

    const unpaidBills = transactions.filter(t => t.type === 'bill');
    const calendarItemsByDay = {};
    for(let i = 1; i <= daysInViewedMonth; i++) calendarItemsByDay[i] = [];

    unpostedSubs.forEach(sub => {
       const d = sub.billingDay <= daysInViewedMonth ? sub.billingDay : daysInViewedMonth;
       calendarItemsByDay[d].push({ ...sub, isSub: true });
    });

    unpaidBills.forEach(b => {
       if (b.date.startsWith(currentViewMonthKey)) {
           const dNum = parseInt(b.date.split('-')[2], 10);
           calendarItemsByDay[dNum].push({ ...b, isBill: true });
       }
    });

    const totalIncomeBudgetForPacing = categories.filter(c => c.type === 'income').reduce((sum, cat) => sum + getBudgetForMonth(cat, currentDate), 0);
    const totalExpenseBudgetForPacing = categories.filter(c => c.type === 'expense' && !c.parentId).reduce((sum, cat) => sum + getBudgetForMonth(cat, currentDate), 0);
    
    const incomePercent = totalIncomeBudgetForPacing > 0 ? Math.min((summary.income / totalIncomeBudgetForPacing) * 100, 100) : 0;
    const spentPercent = totalExpenseBudgetForPacing > 0 ? Math.min((summary.spent / totalExpenseBudgetForPacing) * 100, 100) : 0;
    const isSpentOver = totalExpenseBudgetForPacing > 0 && summary.spent > totalExpenseBudgetForPacing;

    let activeDay = todayDateObj.getDate();
    if (viewedYear < todayDateObj.getFullYear() || (viewedYear === todayDateObj.getFullYear() && viewedMonth < todayDateObj.getMonth())) {
      activeDay = daysInViewedMonth; 
    } else if (viewedYear > todayDateObj.getFullYear() || (viewedYear === todayDateObj.getFullYear() && viewedMonth > todayDateObj.getMonth())) {
      activeDay = 0; 
    }
    
    const monthPercent = (activeDay / daysInViewedMonth) * 100;
    const isTotalOverPacing = spentPercent > monthPercent;

    const pacingCats = categories.filter(c => c.type === 'expense' && !c.parentId).map(master => {
      const subCats = categories.filter(c => c.parentId === master.id);
      const masterBudget = getBudgetForMonth(master, currentDate);
      const masterSpent = clearedViewMonthBudgetTx.reduce((sum, t) => {
        if (t.isSplit) {
           return sum + t.splits.filter(s => s.categoryId === master.id || subCats.some(sub => sub.id === s.categoryId)).reduce((s, sp) => s + Number(sp.amount || 0), 0);
        } else {
           if (t.categoryId === master.id || subCats.some(sub => sub.id === t.categoryId)) return sum + Number(t.amount || 0);
           return sum;
        }
      }, 0);
      const sPercent = masterBudget > 0 ? (masterSpent / masterBudget) * 100 : 0;
      return { ...master, budget: masterBudget, spent: masterSpent, spentPercent: sPercent, isOverPacing: sPercent > monthPercent };
    }).filter(cat => cat.budget > 0).sort((a,b) => b.spentPercent - a.spentPercent);

    const getIconForItem = (item) => {
        if (item.isSplit) return '✂️';
        return categories.find(c => c.id === item.categoryId)?.icon || '❓';
    };

    const renderDashItem = (item) => {
        const iconStr = getIconForItem(item);
        let typeLabel = item.isSub ? 'Subscription' : 'Bill';
        const name = item.isSplit ? `Split ${typeLabel}` : (categories.find(c => c.id === item.categoryId)?.name || 'Unknown');
        const itemDateStr = item.isSub ? `${currentViewMonthKey}-${String(item.billingDay).padStart(2, '0')}` : item.date;
        const isPastDue = itemDateStr <= todayStr;
        
        return (
            <div key={item.id} onClick={() => { if(!item.isSub) { setEditingTx(item); setShowAddTx(true); } }} className={`flex items-center justify-between bg-[#121614] p-3 rounded-xl border ${isPastDue ? 'border-[#e18b71]/50 shadow-lg shadow-black/20' : 'border-[#2a332d] opacity-90 shadow-sm shadow-black/10'} mb-2 cursor-pointer hover:border-[#5bb98c]/50 transition-colors`}>
               <div className="flex items-center">
                  <div className="w-9 h-9 rounded-xl bg-[#1a201c] flex items-center justify-center text-lg mr-3 border border-[#2a332d]">{iconStr}</div>
                  <div>
                     <div className="text-sm font-semibold text-[#e3ece7]">{item.note || name}</div>
                     <div className={`text-[10px] ${isPastDue ? 'text-[#e18b71]' : 'text-[#8b9a91]'}`}>
                        {item.isSub ? `Repeats on the ${item.billingDay}` : `Due ${formatDate(item.date)}`}
                     </div>
                  </div>
               </div>
               <div className="flex flex-col items-end">
                  <span className="font-mono text-sm text-[#e3ece7]">{formatMoney(item.amount, settings.currency)}</span>
                  <div className="flex items-center space-x-2 mt-1.5">
                      <button onClick={(e) => { e.stopPropagation(); setSubToDelete({ type: item.isSub ? 'sub' : 'bill', item }); }} className="p-1 text-[#8b9a91] hover:text-red-400"><X size={14}/></button>
                      <button
                        onClick={(e) => { 
                           e.stopPropagation(); 
                           if (item.isSub) handlePostSubscription(item);
                           else handleMarkAsPaid(item);
                        }}
                        className={`text-[10px] px-3 py-1.5 rounded-lg font-bold active:scale-95 transition-all shadow-md flex items-center space-x-1 ${isPastDue ? 'bg-[#5bb98c] text-[#121614] hover:bg-white shadow-[#5bb98c]/20' : 'bg-[#2a332d] text-[#e3ece7] hover:bg-white hover:text-[#121614]'}`}
                      >
                        <CheckSquare size={12}/> <span>MARK AS PAID</span>
                      </button>
                  </div>
               </div>
            </div>
        )
    };

    const renderTile0 = () => (
      <div className="w-full flex-shrink-0 p-5 flex flex-col h-[420px] overflow-y-auto custom-scrollbar">
        <h3 className="text-sm font-semibold text-[#e3ece7] text-center mb-6 flex-shrink-0">{chartDateString}</h3>
        <div className="relative h-56 w-full flex items-center justify-center flex-shrink-0">
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
             <div className="animate-in fade-in zoom-in duration-200 flex flex-col items-center">
                {activeCenterDisplay.icon}
                <div className="text-xs text-[#8b9a91] font-medium mb-0.5">{activeCenterDisplay.title}</div>
                <div className="text-2xl font-bold text-[#e3ece7] tracking-tight">{formatMoney(activeCenterDisplay.amount, settings.currency)}</div>
             </div>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={105} paddingAngle={4} dataKey="value" stroke="none"
                  onMouseEnter={(_, index) => setHoveredId(pieData[index].name)} onMouseLeave={() => setHoveredId(null)}
                  onClick={(_, index) => setHoveredId(hoveredId === pieData[index].name ? null : pieData[index].name)}
                >
                  {pieData.map((entry, index) => {
                    const isHovered = hoveredId === null || hoveredId === entry.name || (hoveredId === 'ALL_OTHER' && index >= 4);
                    return (
                      <Cell key={`cell-${index}`} fill={entry.fill} opacity={isHovered ? 1 : 0.25} className="transition-opacity duration-300 outline-none cursor-pointer" />
                    );
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-[#8b9a91] text-sm z-10">No expenses this month</div>
          )}
        </div>

        {legendData.length > 0 && (
          <div className="mt-8 space-y-3 px-2 max-w-sm mx-auto w-full">
            {legendData.map((item, idx) => {
              const itemId = item.isOther ? 'ALL_OTHER' : item.name;
              const isHighlighted = hoveredId === itemId;
              const isDimmed = hoveredId !== null && hoveredId !== itemId;
              return (
                <div 
                  key={item.name} onMouseEnter={() => setHoveredId(itemId)} onMouseLeave={() => setHoveredId(null)}
                  onClick={() => setHoveredId(hoveredId === itemId ? null : itemId)}
                  className={`flex justify-between items-center text-sm cursor-pointer transition-all duration-200 ${isDimmed ? 'opacity-30' : 'opacity-100'} ${isHighlighted ? 'scale-[1.02]' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }}></div>
                    <span className={`transition-colors duration-200 ${isHighlighted ? 'text-white font-bold' : 'text-[#e3ece7] font-medium'}`}>{item.name}</span>
                  </div>
                  <div className={`font-mono transition-colors duration-200 ${isHighlighted ? 'text-white font-bold' : 'text-[#e3ece7]'}`}>
                    {formatMoney(item.value, settings.currency)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );

    const renderTile1 = () => {
      const calendarDays = [];
      for(let i = 0; i < startDayOfWeek; i++) calendarDays.push(null); 
      for(let i = 1; i <= daysInViewedMonth; i++) calendarDays.push(i);

      if (selectedCalDay) {
         const dayItems = calendarItemsByDay[selectedCalDay] || [];
         return (
           <div className="w-full flex-shrink-0 p-5 flex flex-col h-[420px] relative animate-in slide-in-from-right-4 duration-200">
             <div className="flex justify-between items-center mb-4 border-b border-[#2a332d] pb-3">
                <div className="flex items-center space-x-3">
                   <button onClick={() => setSelectedCalDay(null)} className="p-2 bg-[#1a201c] rounded-full text-[#8b9a91] hover:text-white border border-[#2a332d] transition-colors"><ChevronLeft size={16}/></button>
                   <div>
                      <h3 className="text-sm font-semibold text-[#e3ece7]">
                        {new Date(viewedYear, viewedMonth, selectedCalDay).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </h3>
                      <div className="text-[10px] text-[#8b9a91]">{dayItems.length} items scheduled</div>
                   </div>
                </div>
             </div>
             
             <div className="overflow-y-auto custom-scrollbar flex-1 pb-4">
                {dayItems.length === 0 ? (
                   <div className="text-center text-[#8b9a91] text-xs py-10">Nothing scheduled for this day.</div>
                ) : (
                   <div className="space-y-3">
                      {dayItems.map(item => renderDashItem(item))}
                   </div>
                )}
             </div>
             
             {subToDelete && (
                <div className="absolute inset-0 bg-[#0b0e0c]/90 backdrop-blur-sm flex items-center justify-center z-20 animate-in fade-in rounded-2xl p-4">
                   <div className="bg-[#1a201c] border border-[#2a332d] p-5 rounded-2xl w-full max-w-[280px] shadow-2xl">
                      <h4 className="text-sm font-bold text-[#e3ece7] mb-2">
                        {subToDelete.type === 'sub' ? 'Manage Subscription' : 'Delete Bill?'}
                      </h4>
                      <p className="text-xs text-[#8b9a91] mb-5 leading-relaxed">
                        {subToDelete.type === 'sub' 
                          ? 'Do you want to skip this month or permanently delete the recurring series?' 
                          : 'This will permanently delete this unpaid bill.'}
                      </p>
                      <div className="flex flex-col space-y-2">
                         {subToDelete.type === 'sub' && (
                           <button onClick={() => handleSkipSub(subToDelete.item.id)} className="w-full py-2.5 bg-[#2a332d] text-[#e3ece7] text-xs font-bold rounded-xl hover:bg-[#5bb98c] hover:text-[#121614] transition-colors">Skip this month</button>
                         )}
                         <button onClick={() => handleDeleteConfirm(subToDelete)} className="w-full py-2.5 bg-[#e18b71]/10 text-[#e18b71] border border-[#e18b71]/20 text-xs font-bold rounded-xl hover:bg-[#e18b71] hover:text-[#121614] transition-colors">
                           {subToDelete.type === 'sub' ? 'Delete series' : 'Delete bill'}
                         </button>
                         <button onClick={() => setSubToDelete(null)} className="w-full py-2.5 text-[#8b9a91] text-xs font-bold rounded-xl hover:text-white transition-colors">Cancel</button>
                      </div>
                   </div>
                </div>
             )}
           </div>
         )
      }

      return (
        <div className="w-full flex-shrink-0 p-5 flex flex-col h-[420px] relative">
          <h3 className="text-sm font-semibold text-[#8b9a91] mb-4 flex-shrink-0">Calendar & Bills</h3>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
             {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-bold text-[#4a5550]">{d}</div>
             ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1 flex-1 content-start">
             {calendarDays.map((day, idx) => {
                if (day === null) return <div key={`pad-${idx}`} className="h-10 sm:h-12 rounded-xl"></div>;
                
                const isToday = (viewedYear === todayDateObj.getFullYear() && viewedMonth === todayDateObj.getMonth() && day === todayDateObj.getDate());
                const dayItems = calendarItemsByDay[day] || [];
                const hasItems = dayItems.length > 0;
                
                return (
                  <div 
                    key={day} 
                    onClick={() => setSelectedCalDay(day)}
                    className={`relative flex flex-col items-center p-1 h-10 sm:h-12 rounded-xl border cursor-pointer transition-colors ${isToday ? 'border-[#5bb98c] bg-[#5bb98c]/10' : 'border-[#2a332d] bg-[#121614] hover:border-[#5bb98c]/50'} ${hasItems ? 'shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]' : ''}`}
                  >
                     <span className={`text-[10px] font-bold ${isToday ? 'text-[#5bb98c]' : 'text-[#e3ece7]'}`}>{day}</span>
                     <div className="flex space-x-0.5 mt-auto overflow-hidden justify-center items-center h-4 w-full">
                        {dayItems.slice(0, 3).map((item, i) => (
                           <span key={i} className="text-[10px] leading-none">{getIconForItem(item)}</span>
                        ))}
                     </div>
                     {dayItems.length > 3 && <div className="absolute top-0.5 right-1 text-[7px] text-[#8b9a91] font-bold">+{dayItems.length - 3}</div>}
                  </div>
                );
             })}
          </div>
        </div>
      );
    };

    const renderTile2 = () => (
      <div className="w-full flex-shrink-0 p-5 flex flex-col h-[420px]">
        <h3 className="text-sm font-semibold text-[#8b9a91] mb-4 flex-shrink-0">Income vs. spending — last 6 months</h3>
        <div className="w-full flex-1 flex flex-col min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={previousMonthsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8b9a91', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8b9a91', fontSize: 12 }} tickFormatter={(val) => `$${Number(val).toLocaleString()}`} />
              <Tooltip 
                cursor={{ fill: '#2a332d', opacity: 0.4 }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#121614] border border-[#2a332d] p-3 rounded-xl shadow-xl">
                        <div className="text-[#8b9a91] font-medium text-xs mb-2 border-b border-[#2a332d] pb-2">{label}</div>
                        {payload.map((entry, index) => {
                          const isHovered = hoveredTrend === null || hoveredTrend === entry.name;
                          return (
                            <div key={index} className={`flex items-center justify-between space-x-4 mb-1 text-sm transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-30'}`}>
                              <div className="flex items-center">
                                <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
                                <span className="text-[#e3ece7]">{entry.name}</span>
                              </div>
                              <span className="font-mono font-bold" style={{ color: entry.color }}>
                                {formatMoney(entry.value, settings.currency)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="Income" fill="#5bb98c" radius={[4, 4, 0, 0]} maxBarSize={40} fillOpacity={hoveredTrend === 'Spent' ? 0.3 : 1}
                className="transition-all duration-300 outline-none cursor-pointer" onMouseEnter={() => setHoveredTrend('Income')} onMouseLeave={() => setHoveredTrend(null)} onClick={() => setHoveredTrend(hoveredTrend === 'Income' ? null : 'Income')}
              />
              <Bar 
                dataKey="Spent" fill="#e18b71" radius={[4, 4, 0, 0]} maxBarSize={40} fillOpacity={hoveredTrend === 'Income' ? 0.3 : 1}
                className="transition-all duration-300 outline-none cursor-pointer" onMouseEnter={() => setHoveredTrend('Spent')} onMouseLeave={() => setHoveredTrend(null)} onClick={() => setHoveredTrend(hoveredTrend === 'Spent' ? null : 'Spent')}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 flex justify-center space-x-6 flex-shrink-0">
          {['Income', 'Spent'].map((key) => {
            const isHovered = hoveredTrend === key;
            const isDimmed = hoveredTrend !== null && hoveredTrend !== key;
            const color = key === 'Income' ? '#5bb98c' : '#e18b71';
            return (
              <div 
                key={key} onMouseEnter={() => setHoveredTrend(key)} onMouseLeave={() => setHoveredTrend(null)} onClick={() => setHoveredTrend(hoveredTrend === key ? null : key)}
                className={`flex items-center text-sm cursor-pointer transition-all duration-200 ${isDimmed ? 'opacity-30' : 'opacity-100'} ${isHovered ? 'scale-[1.02]' : ''}`}
              >
                <div className="w-3.5 h-3.5 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: color }}></div>
                <span className={`transition-colors duration-200 ${isHovered ? 'text-white font-bold' : 'text-[#e3ece7] font-medium'}`}>{key}</span>
              </div>
            );
          })}
        </div>
      </div>
    );

    const renderTile3 = () => (
      <div className="w-full flex-shrink-0 p-5 flex flex-col h-[420px] overflow-y-auto custom-scrollbar">
        <h3 className="text-sm font-semibold text-[#8b9a91] mb-4 flex-shrink-0">Burn Rate vs. Calendar</h3>

        <div className="bg-[#121614] p-4 rounded-2xl border border-[#2a332d] mb-6 flex-shrink-0">
          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="text-xs text-[#8b9a91] font-medium mb-0.5">Total Budget Pacing</div>
              <div className="text-lg font-bold text-[#e3ece7]">{formatMoney(summary.spent, settings.currency)} <span className="text-xs font-normal text-[#8b9a91]">of {formatMoney(totalExpenseBudgetForPacing, settings.currency)}</span></div>
            </div>
            <div className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[#1a201c] border border-[#2a332d] text-[#e3ece7]">
              {Math.round(monthPercent)}% of month
            </div>
          </div>
          <div className="relative h-3 w-full bg-[#1a201c] rounded-full mt-4">
            <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${isTotalOverPacing ? 'bg-[#e18b71]' : 'bg-[#5bb98c]'}`} style={{ width: `${Math.min(spentPercent, 100)}%` }}></div>
            <div className="absolute w-1 h-5 bg-white rounded-full -top-1 z-10 shadow-[0_0_4px_rgba(0,0,0,0.5)] transition-all duration-500" style={{ left: `calc(${monthPercent}% - 2px)` }}></div>
          </div>
          <div className="text-center mt-3 text-[10px] text-[#8b9a91]">
            {totalExpenseBudgetForPacing === 0 ? "Set a budget to track pacing." : (isTotalOverPacing ? "You are spending faster than the calendar is passing." : "You are on track or spending slower than the calendar is passing.")}
          </div>
        </div>

        <h3 className="text-[11px] font-semibold text-[#8b9a91] tracking-wider uppercase mb-3 flex-shrink-0">Category Pacing</h3>
        <div className="space-y-3 pb-2">
          {pacingCats.map(cat => (
            <div key={cat.id} className="bg-[#121614] p-3 rounded-xl border border-[#2a332d]">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-base">{cat.icon}</span>
                  <span className="text-xs font-medium text-[#e3ece7]">{cat.name}</span>
                </div>
                <div className="text-[10px]">
                  <span className={cat.isOverPacing ? 'text-[#e18b71] font-bold' : 'text-[#e3ece7]'}>{Math.round(cat.spentPercent)}%</span>
                  <span className="text-[#8b9a91]"> spent</span>
                </div>
              </div>
              <div className="relative h-1.5 w-full bg-[#1a201c] rounded-full mt-2 mb-1">
                <div className={`absolute top-0 left-0 h-full rounded-full ${cat.isOverPacing ? 'bg-[#e18b71]' : 'bg-[#5bb98c]'}`} style={{ width: `${Math.min(cat.spentPercent, 100)}%` }}></div>
                <div className="absolute w-0.5 h-3 bg-white/80 rounded-full -top-[3px] z-10" style={{ left: `calc(${monthPercent}% - 1px)` }}></div>
              </div>
            </div>
          ))}
          {pacingCats.length === 0 && (
            <div className="text-center text-[#8b9a91] text-[10px] py-4">No budgets set for this month.</div>
          )}
        </div>
      </div>
    );

    const carouselItems = [
      { id: 'clone-3', content: renderTile3() },
      { id: 'real-0', content: renderTile0() },
      { id: 'real-1', content: renderTile1() },
      { id: 'real-2', content: renderTile2() },
      { id: 'real-3', content: renderTile3() },
      { id: 'clone-0', content: renderTile0() }
    ];

    return (
      <div className="space-y-6 pb-24 animate-in fade-in duration-300">
        
        <div className="bg-[#1a201c] p-4 rounded-2xl border border-[#2a332d] mb-6 flex-shrink-0 animate-in fade-in slide-in-from-top-2">
          <h3 className="text-sm font-semibold text-[#e3ece7] mb-4">Month at a glance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-end mb-1.5">
                <div className="text-[10px] font-semibold text-[#8b9a91] uppercase tracking-wider">Income</div>
                <div className="text-xs">
                  <span className="text-[#5bb98c] font-bold">{formatMoney(summary.income, settings.currency)}</span>
                  <span className="text-[#8b9a91]"> / {formatMoney(totalIncomeBudgetForPacing, settings.currency)}</span>
                </div>
              </div>
              <div className="h-2 w-full bg-[#121614] rounded-full overflow-hidden border border-[#2a332d]">
                <div className="h-full rounded-full bg-[#5bb98c] transition-all duration-500" style={{ width: `${incomePercent}%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-end mb-1.5">
                <div className="text-[10px] font-semibold text-[#8b9a91] uppercase tracking-wider">Spent</div>
                <div className="text-xs">
                  <span className={isSpentOver ? 'text-[#e18b71] font-bold' : 'text-[#e3ece7] font-bold'}>{formatMoney(summary.spent, settings.currency)}</span>
                  <span className="text-[#8b9a91]"> / {formatMoney(totalExpenseBudgetForPacing, settings.currency)}</span>
                </div>
              </div>
              <div className="h-2 w-full bg-[#121614] rounded-full overflow-hidden border border-[#2a332d]">
                <div className={`h-full rounded-full transition-all duration-500 ${isSpentOver ? 'bg-[#e18b71]' : 'bg-[#5bb98c]'}`} style={{ width: `${spentPercent}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-1">
          <div className="relative flex items-center bg-[#1a201c] border border-[#2a332d] rounded-xl px-3 py-2.5 hover:border-[#5bb98c]/50 transition-colors">
            <select 
              value={activeDashTile} 
              onChange={(e) => {
                setEnableTransition(true);
                setCarouselIndex(Number(e.target.value) + 1);
              }}
              className="bg-transparent text-xs font-semibold text-[#e3ece7] focus:outline-none appearance-none cursor-pointer pr-6 color-scheme-dark"
            >
              <option className="bg-[#121614] text-[#e3ece7]" value={0}>Where it went</option>
              <option className="bg-[#121614] text-[#e3ece7]" value={1}>Calendar & Bills</option>
              <option className="bg-[#121614] text-[#e3ece7]" value={2}>6-Month Trend</option>
              <option className="bg-[#121614] text-[#e3ece7]" value={3}>Burn Rate Pacing</option>
            </select>
            <ChevronDown size={14} className="text-[#8b9a91] absolute right-3 pointer-events-none" />
          </div>
          
          <div className="flex space-x-1.5 pr-2">
             {[0, 1, 2, 3].map(i => (
                <div 
                  key={i}
                  onClick={() => { setEnableTransition(true); setCarouselIndex(i + 1); }}
                  className={`w-1.5 h-1.5 rounded-full transition-colors cursor-pointer ${activeDashTile === i ? 'bg-[#5bb98c]' : 'bg-[#2a332d]'}`} 
                />
             ))}
          </div>
        </div>

        <div 
          onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
          className="bg-[#0b0e0c] sm:bg-[#1a201c] rounded-2xl border border-[#2a332d] relative overflow-hidden touch-pan-y" 
        >
          <div 
            className="flex w-full will-change-transform"
            onTransitionEnd={handleTransitionEnd}
            style={{ 
              transform: `translateX(calc(-${carouselIndex * 100}% + ${dragOffset}px))`,
              transitionProperty: 'transform', 
              transitionDuration: isDragging || !enableTransition ? '0ms' : '300ms', 
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {carouselItems.map(item => (
               <React.Fragment key={item.id}>
                 {item.content}
               </React.Fragment>
            ))}
          </div>
        </div>

        {/* Pinned Recent Activity */}
        <div>
          <div className="flex justify-between items-center mb-3 mt-6">
            <h3 className="text-sm font-semibold text-[#8b9a91]">Recent activity</h3>
            <button onClick={() => setActiveTab('transactions')} className="text-xs text-[#5bb98c] hover:underline">See all</button>
          </div>
          <div className="bg-[#1a201c] rounded-2xl border border-[#2a332d] overflow-hidden">
            {sortByDateAndTime(transactions.filter(t => t.date <= todayStr && t.type !== 'bill')).slice(0, 5).map((tx, idx) => {
              const isInc = tx.type === 'income';
              const isHidden = tx.isExcludedFromBudget && !isInc;
              const isSplit = tx.isSplit;
              const icon = isSplit ? <Scissors size={18} className="text-[#8b9a91]"/> : (categories.find(c => c.id === tx.categoryId)?.icon || '❓');
              const name = isSplit ? 'Split Transaction' : (categories.find(c => c.id === tx.categoryId)?.name || 'Unknown');

              return (
                <div key={tx.id} onClick={() => { setEditingTx(tx); setShowAddTx(true); }} className={`flex items-center p-4 ${idx !== 0 ? 'border-t border-[#2a332d]' : ''} hover:bg-[#2a332d]/30 transition-colors cursor-pointer`}>
                  <div className="w-10 h-10 rounded-xl bg-[#121614] flex items-center justify-center text-xl mr-4 border border-[#2a332d]">
                    {icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-[#e3ece7] flex items-center space-x-2">
                       <span>{name}</span>
                       {isHidden && <EyeOff size={12} className="text-[#e18b71]" />}
                    </div>
                    <div className="text-xs text-[#8b9a91] truncate max-w-[150px] sm:max-w-xs">{formatDate(tx.date)} {tx.note ? `· ${tx.note}` : ''}</div>
                  </div>
                  <div className={`font-mono font-medium ${isInc ? 'text-[#5bb98c]' : (isHidden ? 'text-[#e18b71]/70' : 'text-[#f2f5f3]')}`}>
                    {isInc ? '+' : '-'}{formatMoney(tx.amount, settings.currency)}
                  </div>
                </div>
              );
            })}
            {transactions.filter(t => t.date <= todayStr && t.type !== 'bill').length === 0 && (
               <div className="p-6 text-center text-[#8b9a91] text-sm">No recent transactions</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTransactions = () => {
    let filteredTransactions = viewMonthChronologicalTx.filter(t => t.type !== 'bill'); 
    
    const isSearching = searchTerm.trim().length > 0 || txFilter !== 'all';
    if (isSearching) {
       const term = searchTerm.toLowerCase();
       filteredTransactions = sortByDateAndTime(transactions).filter(t => {
          if (txFilter !== 'all' && t.type !== txFilter) return false;
          if (txFilter === 'all' && t.type === 'bill' && !term) return false; 
          
          if (term) {
             const catName = (categories.find(c => c.id === t.categoryId)?.name || '').toLowerCase();
             const noteMatch = (t.note || '').toLowerCase().includes(term);
             const catMatch = catName.includes(term);
             const amtMatch = t.amount.toString().includes(term);
             let splitMatch = false;
             if (t.isSplit) {
                splitMatch = t.splits.some(s => {
                   const sCat = (categories.find(c => c.id === s.categoryId)?.name || '').toLowerCase();
                   return sCat.includes(term) || (s.note || '').toLowerCase().includes(term) || s.amount.toString().includes(term);
                });
             }
             return noteMatch || catMatch || amtMatch || splitMatch;
          }
          return true;
       });
    }

    const grouped = sortByDateAndTime(filteredTransactions).reduce((acc, tx) => {
      const dateStr = formatDate(tx.date);
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(tx);
      return acc;
    }, {});

    return (
      <div className="space-y-6 pb-24 animate-in fade-in duration-300">
        
        {/* Search & Filter Header */}
        <div className="mb-4">
           <div className="relative mb-3">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b9a91]" size={16} />
              <input 
                 type="text" 
                 placeholder="Search by merchant, category, or amount..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full bg-[#1a201c] border border-[#2a332d] rounded-2xl py-3.5 pl-11 pr-10 text-sm text-[#e3ece7] focus:outline-none focus:border-[#5bb98c] shadow-sm shadow-black/10"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8b9a91] hover:text-white transition-colors">
                  <X size={16}/>
                </button>
              )}
           </div>
           <div className="flex space-x-2 overflow-x-auto custom-scrollbar pb-2">
              {['all', 'expense', 'income', 'bill'].map(f => (
                 <button 
                    key={f} onClick={() => setTxFilter(f)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-colors border ${txFilter === f ? 'bg-[#5bb98c] text-[#121614] border-[#5bb98c] shadow-md shadow-[#5bb98c]/20' : 'bg-[#1a201c] text-[#8b9a91] border-[#2a332d] hover:border-[#8b9a91]'}`}
                 >
                    {f === 'all' ? 'All' : f === 'expense' ? 'Expenses' : f === 'income' ? 'Income' : 'Unpaid Bills'}
                 </button>
              ))}
           </div>
        </div>

        {Object.keys(grouped).length === 0 ? (
           <div className="text-center text-[#8b9a91] py-10">
             {isSearching ? "No transactions found matching your search." : "No transactions cleared this month."}
           </div>
        ) : (
          Object.entries(grouped).map(([dateLabel, dayTxs]) => (
            <div key={dateLabel}>
              <div className="text-xs font-semibold text-[#8b9a91] mb-2 px-1">{dateLabel}</div>
              <div className="bg-[#1a201c] rounded-2xl border border-[#2a332d] overflow-hidden">
                {dayTxs.map((tx, idx) => {
                  const isInc = tx.type === 'income';
                  const isBill = tx.type === 'bill';
                  const diffBudget = tx.budgetMonth && tx.budgetMonth !== (tx.date || '').substring(0,7);
                  const isHidden = tx.isExcludedFromBudget && !isInc;
                  const isSplit = tx.isSplit;
                  const isExpanded = expandedTxs.includes(tx.id);

                  if (isSplit) {
                     return (
                       <div key={tx.id} className={`flex flex-col ${idx !== 0 ? 'border-t border-[#2a332d]' : ''}`}>
                         <div onClick={() => { setEditingTx(tx); setShowAddTx(true); }} className="flex items-center p-4 hover:bg-[#2a332d]/30 transition-colors cursor-pointer">
                           <div className="w-10 h-10 rounded-xl bg-[#121614] flex items-center justify-center mr-4 border border-[#2a332d]">
                              <Scissors size={18} className="text-[#8b9a91]"/>
                           </div>
                           <div className="flex-1">
                              <div className="font-semibold text-[#e3ece7] flex items-center">
                                 Split Transaction 
                                 {isBill && <span className="text-[9px] bg-[#e18b71]/20 text-[#e18b71] px-1.5 py-0.5 rounded ml-2 uppercase font-bold tracking-wider">Unpaid</span>}
                                 {isHidden && !isBill && <EyeOff size={12} className="text-[#e18b71] ml-2" />}
                              </div>
                              <div className="text-xs text-[#8b9a91]">
                                 {tx.splits.length} categories • {tx.note || 'No global note'}
                                 {diffBudget && !isHidden && <span className="text-[#5bb98c] ml-1 opacity-80">(Budgets to {tx.budgetMonth})</span>}
                              </div>
                           </div>
                           <div className="flex flex-col items-end">
                              <div className={`font-mono font-medium ${isHidden || isBill ? 'text-[#e18b71]/70' : 'text-[#f2f5f3]'}`}>
                                 -{formatMoney(tx.amount, settings.currency)}
                              </div>
                              <button onClick={(e) => toggleExpandTx(tx.id, e)} className="text-[10px] text-[#5bb98c] mt-1 font-semibold uppercase hover:underline">
                                 {isExpanded ? 'Hide splits' : 'Show splits'}
                              </button>
                           </div>
                         </div>
                         {isExpanded && (
                            <div className="pl-14 pr-4 pb-3 space-y-2 bg-[#121614]/40 border-t border-[#2a332d] pt-3 animate-in fade-in slide-in-from-top-2">
                              {tx.splits.map((s, i) => {
                                 const scat = categories.find(c => c.id === s.categoryId) || {name:'Unknown', icon:'❓'};
                                 return (
                                   <div key={i} className="flex justify-between items-center text-xs">
                                     <div className="flex items-center space-x-2 text-[#8b9a91]">
                                       <span className="text-sm">{scat.icon}</span> <span>{scat.name}</span>
                                       {s.note && <span className="italic opacity-60 ml-1">· {s.note}</span>}
                                     </div>
                                     <span className="font-mono text-[#e3ece7]">{formatMoney(s.amount, settings.currency)}</span>
                                   </div>
                                 )
                              })}
                            </div>
                         )}
                       </div>
                     )
                  }

                  const cat = categories.find(c => c.id === tx.categoryId) || { name: 'Unknown', icon: '❓' };
                  return (
                    <div key={tx.id} onClick={() => { setEditingTx(tx); setShowAddTx(true); }} className={`flex items-center p-4 ${idx !== 0 ? 'border-t border-[#2a332d]' : ''} hover:bg-[#2a332d]/30 transition-colors cursor-pointer`}>
                      <div className="w-10 h-10 rounded-xl bg-[#121614] flex items-center justify-center text-xl mr-4 border border-[#2a332d]">
                        {cat.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-[#e3ece7] flex items-center">
                           {cat.name}
                           {isBill && <span className="text-[9px] bg-[#e18b71]/20 text-[#e18b71] px-1.5 py-0.5 rounded ml-2 uppercase font-bold tracking-wider">Unpaid</span>}
                           {isHidden && !isBill && <span className="text-xs text-[#e18b71] ml-2"><EyeOff size={12}/></span>}
                        </div>
                        <div className="text-xs text-[#8b9a91]">
                           {tx.note || (tx.isRecurring ? 'Recurring Subscription' : 'No note')}
                           {diffBudget && !isHidden && <span className="text-[#5bb98c] ml-1 opacity-80">(Budgets to {tx.budgetMonth})</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className={`font-mono font-medium ${isInc ? 'text-[#5bb98c]' : (isHidden || isBill ? 'text-[#e18b71]/70' : 'text-[#f2f5f3]')}`}>
                          {isInc ? '+' : '-'}{formatMoney(tx.amount, settings.currency)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderTracker = () => {
    const expenseMasterCats = categories.filter(c => c.type === 'expense' && !c.parentId);
    const totalBudget = expenseMasterCats.reduce((sum, cat) => sum + getBudgetForMonth(cat, currentDate), 0);
    const totalSpent = summary.spent;

    const sortedMasterCats = [...expenseMasterCats].sort((a, b) => {
      const budgetA = getBudgetForMonth(a, currentDate);
      const budgetB = getBudgetForMonth(b, currentDate);
      if (sortMode === 'amount-desc') return budgetB - budgetA;
      if (sortMode === 'amount-asc') return budgetA - budgetB;
      if (sortMode === 'alpha') return (a.name || '').localeCompare(b.name || '');
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });

    return (
      <div className="space-y-6 pb-24 animate-in fade-in duration-300">
        <div className="flex justify-between items-end border-b border-dashed border-[#2a332d] pb-4 mb-4">
          <div>
            <div className="text-xs text-[#8b9a91] font-medium mb-1">Budgeted this month</div>
            <div className="text-2xl font-serif font-bold text-[#e3ece7]">{formatMoney(totalBudget, settings.currency)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#8b9a91] font-medium mb-1">Spent</div>
            <div className="text-2xl font-serif font-bold text-[#e3ece7]">{formatMoney(totalSpent, settings.currency)}</div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="relative flex items-center bg-[#1a201c] border border-[#2a332d] rounded-xl px-3 py-2.5 hover:border-[#5bb98c]/50 transition-colors">
            <ArrowUpDown size={14} className="text-[#8b9a91] mr-2" />
            <select 
              value={sortMode} onChange={(e) => setSortMode(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#e3ece7] focus:outline-none appearance-none cursor-pointer pr-6 color-scheme-dark"
            >
              <option className="bg-[#121614] text-[#e3ece7]" value="custom">Custom Order</option>
              <option className="bg-[#121614] text-[#e3ece7]" value="amount-desc">Amount: Highest</option>
              <option className="bg-[#121614] text-[#e3ece7]" value="amount-asc">Amount: Lowest</option>
              <option className="bg-[#121614] text-[#e3ece7]" value="alpha">Alphabetical</option>
            </select>
            <ChevronDown size={14} className="text-[#8b9a91] absolute right-3 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-4">
          {sortedMasterCats.map((master) => {
            const subCats = categories.filter(c => c.parentId === master.id);
            const masterBudget = getBudgetForMonth(master, currentDate);
            
            const masterSpent = clearedViewMonthBudgetTx.reduce((sum, t) => {
              if (t.isSplit) {
                 return sum + t.splits.filter(s => s.categoryId === master.id || subCats.some(sub => sub.id === s.categoryId)).reduce((s, sp) => s + Number(sp.amount || 0), 0);
              } else {
                 if (t.categoryId === master.id || subCats.some(sub => sub.id === t.categoryId)) return sum + Number(t.amount || 0);
                 return sum;
              }
            }, 0);

            const masterPercent = masterBudget > 0 ? Math.min((masterSpent / masterBudget) * 100, 100) : 0;
            const isMasterOver = masterBudget > 0 && masterSpent > masterBudget;

            const masterTxs = sortByDateAndTime(clearedViewMonthBudgetTx.filter(t => {
               if (t.isSplit) return t.splits.some(s => s.categoryId === master.id);
               return t.categoryId === master.id;
            }));

            return (
              <div key={master.id} className="bg-[#1a201c] p-5 rounded-2xl border border-[#2a332d] space-y-4 transition-all">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{master.icon}</div>
                    <div>
                      <div className="font-semibold text-[#e3ece7] text-base">{master.name}</div>
                      {subCats.length > 0 && <div className="text-[10px] text-[#8b9a91]">Master Category</div>}
                    </div>
                  </div>
                  <div className="text-sm text-right">
                    <span className={isMasterOver ? 'text-[#e18b71] font-semibold' : 'text-[#e3ece7]'}>{formatMoney(masterSpent, settings.currency)}</span>
                    <span className="text-[#8b9a91]"> / {formatMoney(masterBudget, settings.currency)}</span>
                  </div>
                </div>

                <div className="h-2 w-full bg-[#121614] rounded-full overflow-hidden border border-[#2a332d]">
                  <div className={`h-full rounded-full transition-all duration-500 ${isMasterOver ? 'bg-[#e18b71]' : 'bg-[#5bb98c]'}`} style={{ width: `${masterPercent}%` }}></div>
                </div>
                
                {subCats.length === 0 && masterTxs.length > 0 && (
                  <div className="mt-4 space-y-2 pt-2 border-t border-[#2a332d]">
                    {masterTxs.map(tx => {
                      const amt = tx.isSplit ? tx.splits.filter(s => s.categoryId === master.id).reduce((s, sp) => s + Number(sp.amount), 0) : tx.amount;
                      const splitNote = tx.isSplit ? tx.splits.find(s => s.categoryId === master.id)?.note : null;
                      return (
                        <div key={tx.id} onClick={() => { setEditingTx(tx); setShowAddTx(true); }} className="flex justify-between items-center bg-[#121614] p-3 rounded-xl border border-[#2a332d] hover:border-[#5bb98c]/50 transition-colors cursor-pointer">
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-1">
                               {tx.isSplit && <Scissors size={10} className="text-[#8b9a91]" />}
                               <span className="text-xs text-[#e3ece7] font-medium truncate max-w-[200px]">{splitNote || tx.note || 'No note'}</span>
                            </div>
                            <span className="text-[10px] text-[#8b9a91]">{formatDate(tx.date)}</span>
                          </div>
                          <span className="font-mono text-sm text-[#e3ece7]">{formatMoney(amt, settings.currency)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {subCats.length > 0 && (
                  <div className="pt-2 border-t border-[#2a332d] space-y-3">
                    <div className="text-[11px] font-semibold text-[#8b9a91] tracking-wider uppercase">Sub-budgets</div>
                    
                    {masterTxs.length > 0 && (
                      <div className="mb-4 space-y-2">
                        <div className="text-[10px] text-[#8b9a91] italic">Logged directly to {master.name}</div>
                        {masterTxs.map(tx => {
                          const amt = tx.isSplit ? tx.splits.filter(s => s.categoryId === master.id).reduce((s, sp) => s + Number(sp.amount), 0) : tx.amount;
                          const splitNote = tx.isSplit ? tx.splits.find(s => s.categoryId === master.id)?.note : null;
                          return (
                            <div key={tx.id} onClick={() => { setEditingTx(tx); setShowAddTx(true); }} className="flex justify-between items-center bg-[#121614] p-3 rounded-xl border border-[#2a332d] hover:border-[#5bb98c]/50 transition-colors cursor-pointer">
                              <div className="flex flex-col">
                                <div className="flex items-center space-x-1">
                                   {tx.isSplit && <Scissors size={10} className="text-[#8b9a91]" />}
                                   <span className="text-xs text-[#e3ece7] font-medium truncate max-w-[200px]">{splitNote || tx.note || 'No note'}</span>
                                </div>
                                <span className="text-[10px] text-[#8b9a91]">{formatDate(tx.date)}</span>
                              </div>
                              <span className="font-mono text-sm text-[#e3ece7]">{formatMoney(amt, settings.currency)}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {subCats.map(sub => {
                      const subTxs = sortByDateAndTime(clearedViewMonthBudgetTx.filter(t => {
                         if (t.isSplit) return t.splits.some(s => s.categoryId === sub.id);
                         return t.categoryId === sub.id;
                      }));
                      const subSpent = subTxs.reduce((sum, t) => {
                         if (t.isSplit) return sum + t.splits.filter(s => s.categoryId === sub.id).reduce((s, sp) => s + Number(sp.amount), 0);
                         return sum + Number(t.amount);
                      }, 0);
                      const subBudget = getBudgetForMonth(sub, currentDate);
                      const subPercent = subBudget > 0 ? Math.min((subSpent / subBudget) * 100, 100) : 0;
                      const isSubOver = subBudget > 0 && subSpent > subBudget;

                      return (
                        <div key={sub.id} className="bg-[#121614] p-3 rounded-xl border border-[#2a332d]">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{sub.icon}</span>
                              <span className="text-xs font-medium text-[#e3ece7]">{sub.name}</span>
                            </div>
                            <div className="text-xs">
                              <span className={isSubOver ? 'text-[#e18b71] font-semibold' : 'text-[#e3ece7]'}>{formatMoney(subSpent, settings.currency)}</span>
                              <span className="text-[#8b9a91]"> / {formatMoney(subBudget, settings.currency)}</span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full bg-[#1a201c] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${isSubOver ? 'bg-[#e18b71]' : 'bg-[#5bb98c]'}`} style={{ width: `${subPercent}%` }}></div>
                          </div>
                          
                          {subTxs.length > 0 && (
                            <div className="mt-3 space-y-2 pt-2 border-t border-[#1a201c]">
                              {subTxs.map(tx => {
                                const amt = tx.isSplit ? tx.splits.filter(s => s.categoryId === sub.id).reduce((s, sp) => s + Number(sp.amount), 0) : tx.amount;
                                const splitNote = tx.isSplit ? tx.splits.find(s => s.categoryId === sub.id)?.note : null;
                                return (
                                  <div key={tx.id} onClick={() => { setEditingTx(tx); setShowAddTx(true); }} className="flex justify-between items-center bg-[#1a201c] p-2 rounded-lg hover:border-[#5bb98c]/50 border border-transparent transition-colors cursor-pointer">
                                    <div className="flex flex-col">
                                      <div className="flex items-center space-x-1">
                                        {tx.isSplit && <Scissors size={8} className="text-[#8b9a91]" />}
                                        <span className="text-[11px] text-[#e3ece7] font-medium truncate max-w-[180px]">{splitNote || tx.note || 'No note'}</span>
                                      </div>
                                      <span className="text-[9px] text-[#8b9a91]">{formatDate(tx.date)}</span>
                                    </div>
                                    <span className="font-mono text-xs text-[#e3ece7]">{formatMoney(amt, settings.currency)}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const enterReorderMode = () => {
    const expenseMasterCats = categories.filter(c => c.type === 'expense' && !c.parentId);
    const startingList = [...expenseMasterCats].sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    setReorderList(startingList); setIsReordering(true);
  };

  const saveReorder = async () => {
    if (!user || !db) return;
    const activeLedgerId = linkedLedgerId || user.uid;
    for (let i = 0; i < reorderList.length; i++) {
      const cat = reorderList[i];
      if (cat.sortOrder !== i) await updateDoc(doc(db, 'artifacts', appId, 'users', activeLedgerId, 'categories', cat.id), { sortOrder: i });
    }
    setIsReordering(false);
  };

  const handleDragStart = (e, index) => { if (!isReordering) return; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', index); };
  const handleDragOver = (e) => { if (!isReordering) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e, targetIndex) => {
    if (!isReordering) return; e.preventDefault();
    const sourceIndex = Number(e.dataTransfer.getData('text/plain'));
    if (sourceIndex === targetIndex) return;
    const newList = [...reorderList];
    const [movedItem] = newList.splice(sourceIndex, 1);
    newList.splice(targetIndex, 0, movedItem);
    setReorderList(newList);
  };

  const renderSetup = () => {
    const totalIncomeBudget = categories.filter(c => c.type === 'income').reduce((sum, cat) => sum + getBudgetForMonth(cat, currentDate), 0);
    const totalExpenseBudget = categories.filter(c => c.type === 'expense' && !c.parentId).reduce((sum, cat) => sum + getBudgetForMonth(cat, currentDate), 0);
    const leftToBudget = totalIncomeBudget - totalExpenseBudget;
    const allocationPercent = totalIncomeBudget > 0 ? Math.min((totalExpenseBudget / totalIncomeBudget) * 100, 100) : 0;
    const isOverAllocated = totalExpenseBudget > totalIncomeBudget;

    const expenseMaster = categories.filter(c => c.type === 'expense' && !c.parentId);
    
    const sortedMasterCats = [...expenseMaster].sort((a, b) => {
      const budgetA = getBudgetForMonth(a, currentDate);
      const budgetB = getBudgetForMonth(b, currentDate);
      if (sortMode === 'amount-desc') return budgetB - budgetA;
      if (sortMode === 'amount-asc') return budgetA - budgetB;
      if (sortMode === 'alpha') return (a.name || '').localeCompare(b.name || '');
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });

    const incomeCats = categories.filter(c => c.type === 'income');
    const displayCats = isReordering ? reorderList : sortedMasterCats;

    return (
      <div className="space-y-8 pb-24 animate-in fade-in duration-300">
        
        <div className="bg-[#1a201c] p-4 rounded-2xl border border-[#2a332d] flex-shrink-0">
          <h3 className="text-sm font-semibold text-[#e3ece7] mb-4">Budget Plan</h3>
          <div className="space-y-4">
            <div>
               <div className="flex justify-between items-end mb-1.5">
                 <div className="text-[10px] font-semibold text-[#8b9a91] uppercase tracking-wider">Planned Income</div>
                 <div className="text-xs font-bold text-[#5bb98c]">{formatMoney(totalIncomeBudget, settings.currency)}</div>
               </div>
            </div>
            <div>
               <div className="flex justify-between items-end mb-1.5">
                 <div className="text-[10px] font-semibold text-[#8b9a91] uppercase tracking-wider">Allocated Expenses</div>
                 <div className="text-xs font-bold text-[#e3ece7]">{formatMoney(totalExpenseBudget, settings.currency)}</div>
               </div>
               <div className="h-2 w-full bg-[#121614] rounded-full overflow-hidden border border-[#2a332d]">
                 <div className={`h-full rounded-full transition-all duration-500 ${isOverAllocated ? 'bg-[#e18b71]' : 'bg-[#5bb98c]'}`} style={{ width: `${allocationPercent}%` }}></div>
               </div>
            </div>
            <div className="pt-3 border-t border-[#2a332d] flex justify-between items-center">
               <div className="text-[10px] font-semibold text-[#8b9a91] uppercase tracking-wider">Left to Budget</div>
               <div className={`text-sm font-bold ${leftToBudget < 0 ? 'text-[#e18b71]' : 'text-[#e3ece7]'}`}>
                 {leftToBudget < 0 ? '' : '+'}{formatMoney(leftToBudget, settings.currency)}
               </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-[#e3ece7]">Budget Categories & Setup</h3>
            <button 
              onClick={() => { setEditingCategory(null); setShowAddCat(true); }}
              className="px-3 py-1.5 bg-[#e3ece7] text-[#121614] text-xs font-semibold rounded-xl flex items-center space-x-1 hover:bg-white transition-colors"
            >
              <Plus size={14} />
              <span>Add Category</span>
            </button>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="relative flex items-center bg-[#1a201c] border border-[#2a332d] rounded-xl px-3 py-2.5 hover:border-[#5bb98c]/50 transition-colors">
              <ArrowUpDown size={14} className="text-[#8b9a91] mr-2" />
              <select 
                value={sortMode} onChange={(e) => setSortMode(e.target.value)} disabled={isReordering}
                className="bg-transparent text-xs font-semibold text-[#e3ece7] focus:outline-none appearance-none cursor-pointer pr-6 color-scheme-dark"
              >
                <option className="bg-[#121614] text-[#e3ece7]" value="custom">Custom Order</option>
                <option className="bg-[#121614] text-[#e3ece7]" value="amount-desc">Amount: Highest</option>
                <option className="bg-[#121614] text-[#e3ece7]" value="amount-asc">Amount: Lowest</option>
                <option className="bg-[#121614] text-[#e3ece7]" value="alpha">Alphabetical</option>
              </select>
              <ChevronDown size={14} className="text-[#8b9a91] absolute right-3 pointer-events-none" />
            </div>

            {sortMode === 'custom' && !isReordering && (
              <button 
                onClick={enterReorderMode} 
                className="text-[10px] uppercase tracking-wider font-bold bg-[#1a201c] border border-[#2a332d] text-[#e3ece7] px-4 py-2.5 rounded-xl hover:bg-[#2a332d] transition-colors"
              >
                Reorder
              </button>
            )}

            {isReordering && (
              <div className="flex space-x-2 animate-in fade-in zoom-in-95 duration-200">
                <button onClick={() => setIsReordering(false)} className="text-[10px] uppercase tracking-wider font-bold border border-[#2a332d] text-[#8b9a91] px-4 py-2.5 rounded-xl hover:bg-[#1a201c] transition-colors">Cancel</button>
                <button onClick={saveReorder} className="text-[10px] uppercase tracking-wider font-bold bg-[#5bb98c] text-[#121614] px-4 py-2.5 rounded-xl shadow-lg shadow-[#5bb98c]/20 hover:bg-white transition-colors">Save</button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {displayCats.map((master, index) => {
              const subCats = categories.filter(c => c.parentId === master.id);
              
              const masterBudgetAmount = subCats.length > 0 
                ? subCats.reduce((sum, s) => sum + getBudgetForMonth(s, currentDate), 0)
                : getBudgetForMonth(master, currentDate);

              return (
                <div 
                  key={master.id} draggable={isReordering} onDragStart={(e) => handleDragStart(e, index)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, index)}
                  className={`bg-[#1a201c] p-4 rounded-2xl border border-[#2a332d] transition-all ${isReordering ? 'cursor-grab active:cursor-grabbing border-[#5bb98c]/40 ring-2 ring-[#5bb98c]/20 scale-[1.01] shadow-lg' : ''}`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-3 cursor-pointer flex-1" onClick={() => { if(!isReordering) { setEditingCategory(master); setShowAddCat(true); }}}>
                      {isReordering && <GripVertical size={20} className="text-[#8b9a91]" />}
                      <span className="text-2xl">{master.icon}</span>
                      <div>
                        <div className="font-semibold text-[#e3ece7] text-sm">{master.name}</div>
                        <div className="text-[10px] text-[#8b9a91]">Master Category</div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end pl-2">
                       <span className="text-xs text-[#8b9a91] mb-0.5">Budget</span>
                       <span className="font-mono text-sm text-[#e3ece7]">{formatMoney(masterBudgetAmount, settings.currency)}</span>
                       {!isReordering && subCats.length === 0 && (
                          <button onClick={() => { setEditingCategory(master); setShowAddCat(true); }} className="text-[10px] text-[#5bb98c] hover:text-white mt-1 flex items-center">
                             <PenLine size={10} className="mr-1" /> Edit
                          </button>
                       )}
                    </div>
                  </div>

                  {subCats.length > 0 && (
                    <div className={`pl-6 border-l-2 border-[#2a332d] space-y-2 mt-3 ${isReordering ? 'opacity-40 pointer-events-none' : ''}`}>
                      {subCats.map(sub => (
                        <div 
                          key={sub.id} onClick={() => { if(!isReordering) { setEditingCategory(sub); setShowAddCat(true); } }}
                          className="flex justify-between items-center bg-[#121614] p-3 rounded-xl border border-[#2a332d] hover:border-[#5bb98c]/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{sub.icon}</span>
                            <span className="text-xs font-medium text-[#e3ece7]">{sub.name}</span>
                          </div>
                          <div className="text-right flex items-center space-x-3">
                             <span className="font-mono text-xs text-[#e3ece7]">{formatMoney(getBudgetForMonth(sub, currentDate), settings.currency)}</span>
                             <PenLine size={12} className="text-[#8b9a91]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#e3ece7] mb-4">Income categories</h3>
          <div className="space-y-4">
            {incomeCats.map(cat => {
              const catBudgetAmount = getBudgetForMonth(cat, currentDate);
              return (
                <div 
                  key={cat.id} 
                  className="bg-[#1a201c] p-4 rounded-2xl border border-[#2a332d] transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3 cursor-pointer flex-1" onClick={() => { if(!isReordering) { setEditingCategory(cat); setShowAddCat(true); }}}>
                      <span className="text-2xl">{cat.icon}</span>
                      <div>
                        <div className="font-semibold text-[#e3ece7] text-sm">{cat.name}</div>
                        <div className="text-[10px] text-[#8b9a91]">Income Source</div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end pl-2">
                       <span className="text-xs text-[#8b9a91] mb-0.5">Expected</span>
                       <span className="font-mono text-sm text-[#5bb98c]">{formatMoney(catBudgetAmount, settings.currency)}</span>
                       {!isReordering && (
                          <button onClick={() => { setEditingCategory(cat); setShowAddCat(true); }} className="text-[10px] text-[#5bb98c] hover:text-white mt-1 flex items-center">
                             <PenLine size={10} className="mr-1" /> Edit
                          </button>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const TransactionModal = () => {
    const isEditing = !!editingTx;
    const [type, setType] = useState(isEditing ? editingTx.type : defaultTxType);
    const [amount, setAmount] = useState(isEditing ? editingTx.amount : '');
    const [categoryId, setCategoryId] = useState(isEditing ? (editingTx.categoryId || '') : '');
    const [date, setDate] = useState(isEditing ? (editingTx.date || todayStr) : todayStr);
    const [budgetMonth, setBudgetMonth] = useState(isEditing ? (editingTx.budgetMonth || '') : '');
    const [note, setNote] = useState(isEditing ? (editingTx.note || '') : '');
    const [isRecurring, setIsRecurring] = useState(isEditing ? !!editingTx.isRecurring : false);
    const [isExcluded, setIsExcluded] = useState(isEditing ? !!editingTx.isExcludedFromBudget : false);
    
    const [isSplit, setIsSplit] = useState(isEditing ? !!editingTx.isSplit : false);
    const [splits, setSplits] = useState(isEditing && editingTx.isSplit ? editingTx.splits : [{id: Date.now(), categoryId: '', amount: '', note: ''}]);

    let initialBillingDay = parseInt((isEditing ? (editingTx.date || todayStr) : todayStr).split('-')[2], 10);
    if (isEditing && editingTx.subId && settings.subscriptions) {
        const sub = settings.subscriptions.find(s => s.id === editingTx.subId);
        if (sub && sub.billingDay) initialBillingDay = sub.billingDay;
    }
    const [billingDay, setBillingDay] = useState(initialBillingDay);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const totalAmount = parseFloat(amount) || 0;
    const assignedAmount = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
    const remainder = totalAmount - assignedAmount;

    const handleSubmit = (e) => {
      e.preventDefault();
      
      let txData = { 
         type, 
         amount: totalAmount, 
         date, 
         note, 
         budgetMonth: type === 'bill' ? '' : budgetMonth,
         isExcludedFromBudget: isExcluded,
         createdAt: isEditing ? (editingTx.createdAt || Date.now()) : Date.now()
      };

      if (isSplit && (type === 'expense' || type === 'bill')) {
         if (Math.abs(remainder) > 0.01) { alert("Split amounts must equal the total transaction amount."); return; }
         if (splits.some(s => !s.categoryId || !s.amount)) { alert("Please select a category and amount for all splits."); return; }
         txData.isSplit = true;
         txData.splits = splits.map(s => ({ ...s, amount: parseFloat(s.amount) }));
         txData.categoryId = null;
      } else {
         if (!categoryId || !totalAmount) { alert("Amount and Category are required."); return; }
         txData.isSplit = false;
         txData.categoryId = categoryId;
         txData.splits = null;
      }

      if (isRecurring) {
         txData.isRecurring = true;
         if (!isEditing || !editingTx.subId) {
             const subId = Date.now().toString();
             txData.subId = subId;

             const newSub = {
                id: subId,
                amount: totalAmount,
                categoryId: txData.categoryId,
                isSplit: txData.isSplit,
                splits: txData.splits,
                note: note || 'Subscription',
                billingDay: parseInt(billingDay, 10) || 1,
                startMonth: date.substring(0, 7),
                skippedMonths: []
             };
             handleSaveSettings({
                ...settings,
                subscriptions: [...(settings.subscriptions || []), newSub]
             });
         } else {
             txData.subId = editingTx.subId;
             const updatedSubs = (settings.subscriptions || []).map(s => {
                 if (s.id === editingTx.subId) {
                     return { ...s, amount: totalAmount, categoryId: txData.categoryId, isSplit: txData.isSplit, splits: txData.splits, note: note || s.note, billingDay: parseInt(billingDay, 10) || s.billingDay };
                 }
                 return s;
             });
             handleSaveSettings({ ...settings, subscriptions: updatedSubs });
         }
      } else {
         txData.isRecurring = false;
         txData.subId = null;
      }

      if (isEditing) handleUpdateTransaction(editingTx.id, txData);
      else handleAddTransaction(txData);
    };

    const updateSplit = (id, field, val) => setSplits(splits.map(s => s.id === id ? { ...s, [field]: val } : s));
    const addSplit = () => setSplits([...splits, { id: Date.now(), categoryId: '', amount: '', note: '' }]);
    const removeSplit = (id) => setSplits(splits.filter(s => s.id !== id));
    const close = () => { setShowAddTx(false); setEditingTx(null); };

    const filteredCats = categories.filter(c => {
      const targetType = type === 'bill' ? 'expense' : type;
      if (c.type !== targetType) return false;
      if (targetType === 'expense') {
        if (c.parentId) return categories.some(p => p.id === c.parentId && !p.parentId);
        else return !categories.some(sub => sub.parentId === c.id);
      }
      return true;
    });

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
        <div className="bg-[#121614] w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-[#2a332d] flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-center p-5 border-b border-[#2a332d]">
            <h2 className="text-xl font-serif font-bold text-[#e3ece7]">{isEditing ? 'Edit Transaction' : 'Add transaction'}</h2>
            <button onClick={close} className="text-[#8b9a91] hover:text-white"><X /></button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 custom-scrollbar">
            <div className="flex bg-[#1a201c] p-1 rounded-xl border border-[#2a332d]">
              <button type="button" onClick={() => { setType('expense'); setCategoryId(''); }} className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors ${type === 'expense' ? 'bg-[#e3ece7] text-[#121614]' : 'text-[#8b9a91]'}`}>Expense</button>
              <button type="button" onClick={() => { setType('income'); setCategoryId(''); setIsRecurring(false); setIsExcluded(false); setIsSplit(false); }} className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors ${type === 'income' ? 'bg-[#e3ece7] text-[#121614]' : 'text-[#8b9a91]'}`}>Income</button>
              <button type="button" onClick={() => { setType('bill'); setCategoryId(''); setIsSplit(false); }} className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors ${type === 'bill' ? 'bg-[#e3ece7] text-[#121614]' : 'text-[#8b9a91]'}`}>Upcoming Bill</button>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8b9a91] block mb-2">Total Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#8b9a91]">$</span>
                <input 
                  type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#1a201c] border border-[#2a332d] rounded-xl py-4 pl-10 pr-4 text-2xl font-mono text-white focus:outline-none focus:border-[#5bb98c]" 
                  placeholder="0.00" required autoFocus
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-[#8b9a91]">Category</label>
                {(type === 'expense' || type === 'bill') && (
                  <button type="button" onClick={() => setIsSplit(!isSplit)} className="text-[10px] text-[#5bb98c] font-bold uppercase tracking-wider bg-[#1a201c] px-2 py-1 rounded-md border border-[#2a332d] flex items-center">
                     <Scissors size={10} className="mr-1" /> {isSplit ? 'Single Category' : 'Split Expense'}
                  </button>
                )}
              </div>
              
              {!isSplit ? (
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {filteredCats.map(cat => (
                    <button
                      key={cat.id} type="button" onClick={() => setCategoryId(cat.id)}
                      className={`flex flex-col items-center p-2 rounded-xl border transition-colors ${categoryId === cat.id ? 'bg-[#e3ece7] bg-opacity-10 border-[#e3ece7]' : 'border-transparent hover:bg-[#1a201c]'}`}
                    >
                      <span className="text-2xl mb-1">{cat.icon}</span>
                      <span className="text-[10px] text-center text-[#8b9a91] w-full truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 bg-[#1a201c] border border-[#2a332d] rounded-xl p-3 animate-in fade-in slide-in-from-top-2">
                   <div className="flex justify-between items-center border-b border-[#2a332d] pb-2 mb-2">
                      <span className="text-xs text-[#8b9a91]">Remaining to assign:</span>
                      <span className={`font-mono text-sm font-bold ${Math.abs(remainder) < 0.01 ? 'text-[#5bb98c]' : 'text-[#e18b71]'}`}>
                        {formatMoney(remainder, settings.currency)}
                      </span>
                   </div>
                   {splits.map((split) => (
                      <div key={split.id} className="flex flex-col space-y-2 pb-3 border-b border-[#2a332d] last:border-0 last:pb-0">
                        <div className="flex space-x-2">
                          <select 
                            value={split.categoryId} onChange={(e) => updateSplit(split.id, 'categoryId', e.target.value)} 
                            className="flex-1 bg-[#121614] border border-[#2a332d] rounded-lg p-2 text-xs text-[#e3ece7] focus:outline-none focus:border-[#5bb98c] color-scheme-dark"
                          >
                            <option value="">Category...</option>
                            {filteredCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                          </select>
                          <input 
                            type="number" step="0.01" value={split.amount} onChange={(e) => updateSplit(split.id, 'amount', e.target.value)}
                            placeholder="0.00" className="w-24 bg-[#121614] border border-[#2a332d] rounded-lg p-2 text-xs font-mono text-[#e3ece7] focus:outline-none focus:border-[#5bb98c]"
                          />
                          <button type="button" onClick={() => removeSplit(split.id)} className="p-2 text-[#e18b71] hover:bg-[#e18b71]/10 rounded-lg transition-colors"><X size={14}/></button>
                        </div>
                        <input type="text" placeholder="Item note (optional)" value={split.note} onChange={(e) => updateSplit(split.id, 'note', e.target.value)} className="w-full bg-[#121614] border border-transparent rounded-lg p-2 text-[10px] text-[#e3ece7] focus:border-[#2a332d] focus:outline-none placeholder-[#4a5550]"/>
                      </div>
                   ))}
                   <button type="button" onClick={addSplit} className="w-full py-2 flex items-center justify-center text-[10px] text-[#8b9a91] font-bold tracking-wider uppercase hover:text-[#e3ece7] transition-colors"><Plus size={12} className="mr-1"/> Add Split</button>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <div className="flex-1">
                <label className="text-xs font-semibold text-[#8b9a91] block mb-2">{type === 'bill' ? 'Due Date' : 'Transaction Date'}</label>
                <input 
                  type="date" value={date} onChange={(e) => {
                    setDate(e.target.value);
                    if(!isEditing) setBillingDay(parseInt(e.target.value.split('-')[2], 10) || 1);
                  }} required
                  className="w-full bg-[#1a201c] border border-[#2a332d] rounded-xl p-3 text-[#e3ece7] focus:outline-none focus:border-[#5bb98c] color-scheme-dark"
                />
              </div>
              {type !== 'bill' && (
                <div className="flex-1">
                  <label className="text-xs font-semibold text-[#8b9a91] block mb-2">Count for Budget</label>
                  <input 
                    type="month" value={budgetMonth} onChange={(e) => setBudgetMonth(e.target.value)}
                    className="w-full bg-[#1a201c] border border-[#2a332d] rounded-xl p-3 text-[#e3ece7] focus:outline-none focus:border-[#5bb98c] color-scheme-dark"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8b9a91] block mb-2">Global Note (optional)</label>
              <input 
                type="text" value={note} onChange={(e) => setNote(e.target.value)}
                className="w-full bg-[#1a201c] border border-[#2a332d] rounded-xl p-4 text-[#e3ece7] focus:outline-none focus:border-[#5bb98c] placeholder-[#4a5550]"
                placeholder="What was this for?"
              />
            </div>

            {(type === 'expense' || type === 'bill') && (
              <div className="space-y-4 pt-4 border-t border-[#2a332d]">
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" checked={isExcluded} onChange={(e) => setIsExcluded(e.target.checked)} id="exclude-check"
                    className="w-5 h-5 rounded border-[#2a332d] text-[#e18b71] focus:ring-[#e18b71] bg-[#1a201c] accent-[#e18b71]"
                  />
                  <label htmlFor="exclude-check" className="text-sm font-semibold text-[#e3ece7]">
                    Exclude from budget limit charts (e.g. emergencies)
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} id="recurring-check"
                    className="w-5 h-5 rounded border-[#2a332d] text-[#5bb98c] focus:ring-[#5bb98c] bg-[#1a201c] accent-[#5bb98c]"
                  />
                  <label htmlFor="recurring-check" className="text-sm font-semibold text-[#e3ece7]">
                    Save as monthly subscription
                  </label>
                </div>
                
                {isRecurring && (
                  <div className="pl-8 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="text-xs font-semibold text-[#8b9a91] block mb-2">Repeats on day of month (1-31)</label>
                    <input 
                      type="number" min="1" max="31" value={billingDay} onChange={(e) => setBillingDay(e.target.value)}
                      className="w-full bg-[#1a201c] border border-[#2a332d] rounded-xl p-3 text-[#e3ece7] focus:outline-none focus:border-[#5bb98c]"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-3 pt-4 border-t border-[#2a332d]">
              <button type="button" onClick={close} className="flex-1 py-4 rounded-xl border border-[#2a332d] text-[#e3ece7] font-semibold hover:bg-[#1a201c]">Cancel</button>
              <button type="submit" className="flex-1 py-4 rounded-xl bg-[#e3ece7] text-[#121614] font-semibold hover:bg-white transition-colors">Save</button>
            </div>
            
            {isEditing && (
              <div className="pt-2">
                {!showConfirmDelete ? (
                  <button 
                    type="button" onClick={() => setShowConfirmDelete(true)} 
                    className="w-full py-4 rounded-xl border border-red-500/30 text-red-400 font-semibold hover:bg-red-500/10 transition-colors"
                  >
                    Delete {type === 'bill' ? 'Bill' : 'Transaction'}
                  </button>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex flex-col items-center mt-2">
                    <span className="text-sm font-semibold text-red-400 mb-3 text-center">Delete this entry?</span>
                    <div className="flex space-x-3 w-full">
                      <button type="button" onClick={() => setShowConfirmDelete(false)} className="flex-1 py-3 rounded-xl border border-[#2a332d] text-[#e3ece7] font-semibold hover:bg-[#1a201c]">Cancel</button>
                      <button type="button" onClick={() => { handleDeleteTransaction(editingTx.id); close(); }} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors">Confirm Delete</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    );
  };

  const CategoryModal = () => {
    const isEditing = !!editingCategory;
    const [type, setType] = useState(isEditing ? editingCategory.type : 'expense');
    const [name, setName] = useState(isEditing ? editingCategory.name : '');
    const [icon, setIcon] = useState(isEditing ? editingCategory.icon : '📦');
    
    const [isMaster, setIsMaster] = useState(isEditing ? !editingCategory.parentId : true);
    const [parentId, setParentId] = useState(isEditing ? (editingCategory.parentId || '') : '');

    const initialBudget = isEditing ? getBudgetForMonth(editingCategory, currentDate) : '';
    const [budget, setBudget] = useState(initialBudget);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const hasSubCats = isEditing && !editingCategory.parentId && categories.some(c => c.parentId === editingCategory.id);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!name) return;
      
      const monthKey = getMonthKey(currentDate);
      const catData = { type, name, icon, parentId: type === 'expense' && !isMaster ? parentId : '' };

      if (type === 'income' || (type === 'expense' && (!isMaster || (isMaster && !hasSubCats)))) {
        catData.budget = parseFloat(budget) || 0;
        catData.budgets = { ...(isEditing && editingCategory.budgets ? editingCategory.budgets : {}), [monthKey]: parseFloat(budget) || 0 };
      }
      
      if (isEditing) handleUpdateCategory(editingCategory.id, catData);
      else handleAddCategory(catData);
    };

    const close = () => { setShowAddCat(false); setEditingCategory(null); };

    const masterExpenseCats = categories.filter(c => c.type === 'expense' && !c.parentId && (!isEditing || c.id !== editingCategory.id));
    const currentEmojis = type === 'income' ? INCOME_EMOJIS : EXPENSE_EMOJIS;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#121614] w-full max-w-sm rounded-3xl border border-[#2a332d] overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-5 border-b border-[#2a332d] flex justify-between items-center">
            <h2 className="text-xl font-serif font-bold text-[#e3ece7]">{isEditing ? 'Edit Category' : 'New Category'}</h2>
            <button onClick={close} className="text-[#8b9a91]"><X /></button>
          </div>
          <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar">
            <div className="flex bg-[#1a201c] p-1 rounded-xl border border-[#2a332d]">
              <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 text-sm font-medium rounded-lg ${type === 'expense' ? 'bg-[#e3ece7] text-[#121614]' : 'text-[#8b9a91]'}`}>Expense</button>
              <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 text-sm font-medium rounded-lg ${type === 'income' ? 'bg-[#e3ece7] text-[#121614]' : 'text-[#8b9a91]'}`}>Income</button>
            </div>
            
            {type === 'expense' && (
              <div className="flex bg-[#1a201c] p-1 rounded-xl border border-[#2a332d]">
                <button type="button" onClick={() => setIsMaster(true)} className={`flex-1 py-2 text-xs font-medium rounded-lg ${isMaster ? 'bg-[#5bb98c] text-[#121614]' : 'text-[#8b9a91]'}`}>Master Category</button>
                <button 
                  type="button" disabled={hasSubCats} onClick={() => !hasSubCats && setIsMaster(false)} 
                  className={`flex-1 py-2 text-xs font-medium rounded-lg ${!isMaster ? 'bg-[#5bb98c] text-[#121614]' : 'text-[#8b9a91]'} ${hasSubCats ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Sub-Budget
                </button>
              </div>
            )}

            {type === 'expense' && !isMaster && (
              <div>
                <label className="text-xs font-semibold text-[#8b9a91] block mb-2">Assign to Master Category</label>
                <select 
                  value={parentId} onChange={e => setParentId(e.target.value)} 
                  className="w-full bg-[#1a201c] border border-[#2a332d] rounded-xl p-3 text-[#e3ece7] focus:outline-none color-scheme-dark"
                  required
                >
                  <option className="bg-[#121614]" value="">Select Master Category...</option>
                  {masterExpenseCats.map(m => ( <option className="bg-[#121614]" key={m.id} value={m.id}>{m.icon} {m.name}</option> ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-[#8b9a91] block mb-2">Category Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#1a201c] border border-[#2a332d] rounded-xl p-3 text-[#e3ece7]" placeholder="E.g. Groceries" required />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8b9a91] block mb-2">Select Icon</label>
              <div className="bg-[#1a201c] border border-[#2a332d] rounded-xl p-3">
                <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                  {currentEmojis.map(e => (
                    <button 
                      key={e} type="button" onClick={() => setIcon(e)}
                      className={`h-10 text-xl flex items-center justify-center rounded-lg transition-colors ${icon === e ? 'bg-[#e3ece7] bg-opacity-20 border border-[#e3ece7]' : 'hover:bg-[#121614]'}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {(type === 'income' || (type === 'expense' && (!isMaster || (isMaster && !hasSubCats)))) && (
              <div>
                <label className="text-xs font-semibold text-[#8b9a91] block mb-2">Monthly Budget Limit (Optional)</label>
                <input type="number" value={budget} onChange={e => setBudget(e.target.value)} className="w-full bg-[#1a201c] border border-[#2a332d] rounded-xl p-3 text-[#e3ece7]" placeholder="0.00" />
                {type === 'expense' && !isMaster && <p className="text-[10px] text-[#8b9a91] mt-1">Master category budget will automatically sum up this amount.</p>}
              </div>
            )}
            
            <button type="button" onClick={handleSubmit} className="w-full py-4 rounded-xl bg-[#e3ece7] text-[#121614] font-semibold mt-4 hover:bg-white transition-colors">
              {isEditing ? 'Save Changes' : 'Save Category'}
            </button>

            {isEditing && (
              <div className="pt-2">
                {!showConfirmDelete ? (
                  <button 
                    type="button" onClick={() => setShowConfirmDelete(true)} 
                    className="w-full py-4 rounded-xl border border-red-500/30 text-red-400 font-semibold mt-2 hover:bg-red-500/10 transition-colors"
                  >
                    Delete Category
                  </button>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex flex-col items-center mt-2">
                    <span className="text-sm font-semibold text-red-400 mb-3 text-center">Delete this category? Transactions using it will show 'Unknown'.</span>
                    <div className="flex space-x-3 w-full">
                      <button type="button" onClick={() => setShowConfirmDelete(false)} className="flex-1 py-3 rounded-xl border border-[#2a332d] text-[#e3ece7] font-semibold hover:bg-[#1a201c]">Cancel</button>
                      <button type="button" onClick={() => { handleDeleteCategory(editingCategory.id); close(); }} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const SettingsModal = () => {
    const [localName, setLocalName] = useState(settings.name || 'SpendLink');
    const [localStart, setLocalStart] = useState(settings.startingBalance || 0);
    const [localCurrency, setLocalCurrency] = useState(settings.currency || 'USD');
    const [localTheme, setLocalTheme] = useState(settings.theme || 'dark');
    const [localUseManualDate, setLocalUseManualDate] = useState(settings.useManualDate || false);
    const [localManualDate, setLocalManualDate] = useState(settings.manualDate || todayStr);
    
    const [activeTab, setActiveTab] = useState('general');
    const [shareCodeInput, setShareCodeInput] = useState(linkedLedgerId || '');
    const [copied, setCopied] = useState(false);

    const handleSave = (e) => {
      e.preventDefault();
      handleSaveSettings({ 
        ...settings, 
        name: localName, 
        startingBalance: parseFloat(localStart) || 0, 
        currency: localCurrency, 
        theme: localTheme,
        useManualDate: localUseManualDate,
        manualDate: localManualDate
      });
    };

    const handleCopy = () => {
      if (user) {
        navigator.clipboard.writeText(user.uid);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };

    const handleApplyLink = () => { handleLinkLedger(shareCodeInput); };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#121614] w-full max-w-md rounded-3xl border border-[#2a332d] overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-5 border-b border-[#2a332d] flex justify-between items-center">
            <h2 className="text-xl font-serif font-bold text-[#e3ece7]">Settings</h2>
            <button onClick={() => setShowSettings(false)} className="text-[#8b9a91] hover:text-white transition-colors"><X /></button>
          </div>
          
          <div className="flex bg-[#1a201c] p-1 mx-5 mt-5 rounded-xl border border-[#2a332d]">
            <button type="button" onClick={() => setActiveTab('general')} className={`flex-1 py-2 text-sm font-medium rounded-lg ${activeTab === 'general' ? 'bg-[#e3ece7] text-[#121614]' : 'text-[#8b9a91]'}`}>General</button>
            <button type="button" onClick={() => setActiveTab('sync')} className={`flex-1 py-2 text-sm font-medium rounded-lg ${activeTab === 'sync' ? 'bg-[#e3ece7] text-[#121614]' : 'text-[#8b9a91]'}`}>Account & Data</button>
          </div>

          <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
            {activeTab === 'general' ? (
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-[#8b9a91] block mb-2">Household name</label>
                  <input type="text" value={localName} onChange={e => setLocalName(e.target.value)} className="w-full bg-[#1a201c] border border-[#2a332d] rounded-xl p-3 text-[#e3ece7]" required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8b9a91] block mb-2">Starting balance</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9a91]">$</span>
                    <input type="number" value={localStart} onChange={e => setLocalStart(e.target.value)} className="w-full bg-[#1a201c] border border-[#2a332d] rounded-xl py-3 pl-8 pr-3 text-[#e3ece7]" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8b9a91] block mb-2">Currency</label>
                  <select value={localCurrency} onChange={e => setLocalCurrency(e.target.value)} className="w-full bg-[#1a201c] border border-[#2a332d] rounded-xl p-3 text-[#e3ece7] focus:outline-none appearance-none color-scheme-dark">
                    <option className="bg-[#121614]" value="USD">USD ($)</option>
                    <option className="bg-[#121614]" value="EUR">EUR (€)</option>
                    <option className="bg-[#121614]" value="GBP">GBP (£)</option>
                    <option className="bg-[#121614]" value="JPY">JPY (¥)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8b9a91] block mb-2">Appearance</label>
                  <div className="flex bg-[#1a201c] rounded-xl border border-[#2a332d] overflow-hidden">
                     <button type="button" onClick={() => setLocalTheme('light')} className={`flex-1 py-3 text-sm font-medium ${localTheme === 'light' ? 'bg-[#e3ece7] text-[#121614]' : 'text-[#8b9a91]'}`}>Light</button>
                     <button type="button" onClick={() => setLocalTheme('dark')} className={`flex-1 py-3 text-sm font-medium ${localTheme === 'dark' ? 'bg-[#e3ece7] text-[#121614]' : 'text-[#8b9a91]'}`}>Dark</button>
                     <button type="button" onClick={() => setLocalTheme('auto')} className={`flex-1 py-3 text-sm font-medium ${localTheme === 'auto' ? 'bg-[#e3ece7] text-[#121614]' : 'text-[#8b9a91]'}`}>Auto</button>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#2a332d]">
                  <h3 className="text-sm font-semibold text-[#e3ece7] mb-3">System Date Override</h3>
                  <label className="flex items-center space-x-3 cursor-pointer mb-3">
                    <input 
                      type="checkbox" checked={!localUseManualDate} onChange={(e) => setLocalUseManualDate(!e.target.checked)}
                      className="w-full max-w-[20px] h-5 rounded border-[#2a332d] text-[#5bb98c] focus:ring-[#5bb98c] bg-[#1a201c] accent-[#5bb98c]"
                    />
                    <span className="text-xs text-[#e3ece7]">Use automatic system date</span>
                  </label>
                  {localUseManualDate && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="text-xs font-semibold text-[#8b9a91] block mb-2">Manual Date Override</label>
                      <input 
                        type="date" value={localManualDate} onChange={e => setLocalManualDate(e.target.value)} 
                        className="w-full bg-[#1a201c] border border-[#2a332d] rounded-xl p-3 text-[#e3ece7] color-scheme-dark focus:outline-none focus:border-[#5bb98c]" 
                      />
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-2">
                  <button type="button" onClick={() => setShowSettings(false)} className="flex-1 py-4 rounded-xl border border-[#2a332d] text-[#e3ece7] font-semibold hover:bg-[#1a201c]">Cancel</button>
                  <button type="submit" className="flex-1 py-4 rounded-xl bg-[#e3ece7] text-[#121614] font-semibold hover:bg-white transition-colors">Save</button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="bg-[#1a201c] p-4 rounded-2xl border border-[#2a332d]">
                  <h3 className="text-sm font-semibold text-[#e3ece7] mb-2 flex items-center"><LinkIcon size={16} className="mr-2"/> Your Ledger Sync Code</h3>
                  <p className="text-xs text-[#8b9a91] mb-4">Share this code with your partner to give them live access to sync to this ledger.</p>
                  <div className="flex items-center space-x-2">
                    <input type="text" readOnly value={user?.uid || ''} className="w-full bg-[#121614] border border-[#2a332d] rounded-xl p-3 text-[#e3ece7] text-xs font-mono" />
                    <button onClick={handleCopy} className="p-3 bg-[#e3ece7] text-[#121614] rounded-xl font-medium flex items-center hover:bg-white transition-colors">
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div className="bg-[#1a201c] p-4 rounded-2xl border border-[#2a332d]">
                  <h3 className="text-sm font-semibold text-[#e3ece7] mb-2">Connect to Partner's Ledger</h3>
                  <p className="text-xs text-[#8b9a91] mb-4">Paste a partner's Share Code here to link your app to their ledger.</p>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" value={shareCodeInput} onChange={e => setShareCodeInput(e.target.value)} placeholder="Paste Share Code..."
                      className="w-full bg-[#121614] border border-[#2a332d] rounded-xl p-3 text-[#e3ece7] text-xs font-mono" 
                    />
                    <button onClick={handleApplyLink} className="p-3 bg-transparent border border-[#5bb98c] text-[#5bb98c] rounded-xl font-medium text-sm hover:bg-[#5bb98c] hover:text-[#121614] transition-colors whitespace-nowrap">
                      Apply
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#2a332d]">
                  <h3 className="text-sm font-semibold text-[#e3ece7] mb-2 flex items-center"><Download size={16} className="mr-2"/> Export Data</h3>
                  <p className="text-xs text-[#8b9a91] mb-4">Download a complete CSV of all your transactions, compatible with Excel and Google Sheets.</p>
                  <button onClick={handleExportCSV} className="w-full py-3 bg-[#2a332d] text-[#e3ece7] rounded-xl font-semibold flex items-center justify-center hover:bg-[#1a201c] transition-colors border border-[#2a332d]">
                     <Download size={16} className="mr-2"/> Download CSV
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#121614] text-[#f2f5f3] font-sans selection:bg-[#5bb98c] selection:text-[#121614]">
      <header className="sticky top-0 z-10 bg-[#121614]/95 backdrop-blur-md border-b border-[#2a332d] px-5 py-3 shadow-md shadow-black/20">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-serif font-bold text-[#e3ece7] truncate max-w-[200px]">{settings.name}</h1>
              <div className={`flex items-center text-[10px] space-x-1 ${isSyncing ? 'text-yellow-500' : 'text-[#5bb98c]'}`}>
                {isSyncing ? <Cloud size={12} /> : <CheckCircle2 size={12} />}
                <span className="hidden sm:inline">{isSyncing ? 'syncing' : (linkedLedgerId ? 'linked' : 'synced')}</span>
              </div>
            </div>
            <button onClick={() => setShowSettings(true)} className="text-[#8b9a91] hover:text-[#e3ece7] transition-colors relative p-1">
              <Settings size={18} />
              {linkedLedgerId && <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500 rounded-full border-2 border-[#121614]"></div>}
            </button>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <div className="text-[10px] font-medium text-[#8b9a91] mb-1">Account balance</div>
              <div className={`text-3xl font-serif font-bold leading-none tracking-tight ${summary.totalBalance < 0 ? 'text-[#e18b71]' : 'text-[#e3ece7]'}`}>
                {summary.totalBalance < 0 ? '-' : ''}{formatMoney(Math.abs(summary.totalBalance), settings.currency)}
              </div>
            </div>

            <div className="flex items-center bg-[#1a201c] border border-[#2a332d] rounded-full p-0.5">
              <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-full text-[#8b9a91] hover:text-white hover:bg-[#2a332d] transition-colors"><ChevronLeft size={14} /></button>
              <button onClick={() => setCurrentDate(getTodayDateObj())} className="text-xs font-semibold px-3 text-[#e3ece7] hover:text-white transition-colors">
                {currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </button>
              <button onClick={() => changeMonth(1)} className="p-1.5 rounded-full text-[#8b9a91] hover:text-white hover:bg-[#2a332d] transition-colors"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-5 max-w-2xl mx-auto">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'transactions' && renderTransactions()}
        {activeTab === 'budget' && renderTracker()}
        {activeTab === 'categories' && renderSetup()}
      </main>

      <button 
        onClick={() => { setEditingTx(null); setShowAddTx(true); }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#e3ece7] rounded-full flex items-center justify-center text-[#121614] shadow-lg shadow-black/50 hover:scale-105 active:scale-95 transition-all z-20"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <nav className="fixed bottom-0 w-full bg-[#121614]/90 backdrop-blur-lg border-t border-[#2a332d] pb-safe z-30">
        <div className="flex justify-around items-center p-2 max-w-2xl mx-auto">
          {[
            { id: 'dashboard', icon: Home, label: 'Dashboard' },
            { id: 'transactions', icon: List, label: 'Transactions' },
            { id: 'budget', icon: Activity, label: 'Tracker' },
            { id: 'categories', icon: Grid, label: 'Setup' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center w-16 py-2 rounded-2xl transition-all ${isActive ? 'bg-[#1a201c] text-[#5bb98c]' : 'text-[#8b9a91] hover:text-[#e3ece7]'}`}
              >
                <Icon size={20} className="mb-1" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {showAddTx && <TransactionModal />}
      {showAddCat && <CategoryModal />}
      {showSettings && <SettingsModal />}

      <style dangerouslySetInnerHTML={{__html: `
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2a332d; border-radius: 4px; }
        .color-scheme-dark { color-scheme: dark; }
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; margin: 0; 
        }
      `}} />
    </div>
  );
}