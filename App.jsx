import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, List, PieChart as PieChartIcon, Grid, Plus, Settings, 
  ChevronLeft, ChevronRight, X, Cloud, CheckCircle2, Copy, Check, 
  Link as LinkIcon, PenLine, ChevronDown, ArrowUpDown, GripVertical,
  TrendingUp
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

// Updated vibrant colors matching the user's reference image
const PIE_COLORS = ['#cddc39', '#f57c00', '#0288d1', '#e64a19', '#8bc34a', '#9c27b0', '#e91e63'];

const EXPENSE_EMOJIS = [
  '🍔', '🛒', '🍕', '☕', '🍽️', '🍻', '🏠', '🛋️', '🧹', '🔧',
  '💡', '💧', '🔥', '🚗', '⛽', '🚌', '✈️', '🚆', '🏥', '💊',
  '🦷', '🐶', '🐱', '🛍️', '👕', '💄', '🧴', '🎮', '🎬', '🍿',
  '📚', '🎓', '🏖️', '🎟️', '🏋️', '💇', '👶', '🧸', '📱', '💻',
  '🔌', '🎁', '🎀', '🎉', '📦', '💸', '💳', '🧾', '🔒', '🛠️',
  '🚲', '🪴', '🎸', '🎨', '🧵', '⚽', '🏕️', '📷', '🥩', '🥦',
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
  { id: '3', name: 'Food & Dining', type: 'expense', icon: '🍽️', parentId: '', sortOrder: 2 },
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
  return new Date(dateString).toLocaleDateString('en-US', options);
};

const getMonthKey = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
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
  const [settings, setSettings] = useState({ name: 'Our Ledger', startingBalance: 0, currency: 'USD', theme: 'dark', useManualDate: false, manualDate: '' });
  const [linkedLedgerId, setLinkedLedgerId] = useState('');
  
  // Modals & Sub-states
  const [showAddTx, setShowAddTx] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [defaultTxType, setDefaultTxType] = useState('expense'); // State for deep linking tx types
  const [showSettings, setShowSettings] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Sorting & Reordering State
  const [sortMode, setSortMode] = useState('custom');
  const [isReordering, setIsReordering] = useState(false);
  const [reorderList, setReorderList] = useState([]);

  // Dashboard Tile State
  const [activeDashTile, setActiveDashTile] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Hover state for the interactive pie chart
  const [hoveredId, setHoveredId] = useState(null);
  const [hoveredTrend, setHoveredTrend] = useState(null);

  useEffect(() => {
    try {
      const savedLink = localStorage.getItem('joint_ledger_linked_id');
      if (savedLink) setLinkedLedgerId(savedLink);
    } catch (e) {
      console.warn("Local storage unavailable for linked ID");
    }

    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        await setPersistence(auth, inMemoryPersistence);
      }
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth Error:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));

    // Capacitor App Deep Link Listener
    const initDeepLinks = async () => {
      try {
        await CapApp.addListener('appUrlOpen', (data) => {
          if (data.url.includes('expense')) {
            setDefaultTxType('expense');
            setEditingTx(null);
            setShowAddTx(true);
          } else if (data.url.includes('income')) {
            setDefaultTxType('income');
            setEditingTx(null);
            setShowAddTx(true);
          }
        });
      } catch (e) {
        console.warn("Capacitor App plugin not available for deep linking", e);
      }
    };
    initDeepLinks();

    return () => {
      unsubscribe();
      try { CapApp.removeAllListeners(); } catch (e) {}
    };
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    
    setIsSyncing(true);
    const activeLedgerId = linkedLedgerId || user.uid;
    const userRef = doc(db, 'artifacts', appId, 'users', activeLedgerId);
    
    const txUnsub = onSnapshot(collection(userRef, 'transactions'), (snapshot) => {
      setTransactions(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
      setIsSyncing(false);
    }, (err) => console.error("Tx sync error:", err));

    const catUnsub = onSnapshot(collection(userRef, 'categories'), (snapshot) => {
      const cats = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      if (cats.length === 0 && !linkedLedgerId) {
        DEFAULT_CATEGORIES.forEach(cat => {
          const { id, ...catData } = cat; 
          addDoc(collection(userRef, 'categories'), catData);
        });
      } else {
        setCategories(cats);
      }
    }, (err) => console.error("Cat sync error:", err));

    const settingsUnsub = onSnapshot(doc(userRef, 'settings', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(prev => ({ ...prev, ...docSnap.data() }));
      } else if (!linkedLedgerId) {
        setDoc(doc(userRef, 'settings', 'main'), { name: 'Our Ledger', startingBalance: 0, currency: 'USD', theme: 'dark' });
      }
    }, (err) => console.error("Settings sync error:", err));

    return () => { txUnsub(); catUnsub(); settingsUnsub(); };
  }, [user, linkedLedgerId]);

  const { currentMonthTx, previousMonthsData } = useMemo(() => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const current = transactions.filter(t => {
      if (!t.date) return false;
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const sixMonthsData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      
      const monthTxs = transactions.filter(t => {
        if (!t.date) return false;
        const td = new Date(t.date);
        return td.getMonth() === m && td.getFullYear() === y;
      });

      const inc = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const exp = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
      
      sixMonthsData.push({
        name: d.toLocaleDateString('en-US', { month: 'short' }),
        Income: inc,
        Spent: exp
      });
    }

    return { currentMonthTx: current, previousMonthsData: sixMonthsData };
  }, [transactions, currentDate]);

  const summary = useMemo(() => {
    const income = currentMonthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const spent = currentMonthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalSpent = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalBalance = Number(settings.startingBalance || 0) + totalIncome - totalSpent;

    return { income, spent, net: income - spent, totalBalance };
  }, [currentMonthTx, transactions, settings]);

  // --- CAPACITOR BRIDGE WIDGET SYNC ---
  useEffect(() => {
    const syncWidgetData = async () => {
      try {
        const balanceString = formatMoney(summary.totalBalance, settings.currency);
        await Preferences.set({ key: 'widget_balance', value: balanceString });
      } catch (error) {
        console.error("Failed to sync balance to widget storage:", error);
      }
    };
    syncWidgetData();
  }, [summary.totalBalance, settings.currency]); 
  // -----------------------------------------------

  const { pieData, legendData, totalSpent } = useMemo(() => {
    const expensesByCategory = {};
    let total = 0;

    // Aggregate spending, rolling up to Masters
    currentMonthTx.filter(t => t.type === 'expense').forEach(t => {
      let cat = categories.find(c => c.id === t.categoryId) || { name: 'Uncategorized', icon: '❓' };
      if (cat.parentId) {
        const parent = categories.find(c => c.id === cat.parentId);
        if (parent) cat = parent;
      }
      
      if (!expensesByCategory[cat.name]) {
        expensesByCategory[cat.name] = { amount: 0, icon: cat.icon };
      }
      expensesByCategory[cat.name].amount += Number(t.amount || 0);
      total += Number(t.amount || 0);
    });
    
    // Sort and assign colors
    const sortedRaw = Object.entries(expensesByCategory)
      .map(([name, data]) => ({ name, value: data.amount, icon: data.icon }))
      .sort((a, b) => b.value - a.value)
      .map((item, idx) => ({ ...item, fill: PIE_COLORS[idx % PIE_COLORS.length] }));

    // Prepare Custom Legend Data (Top 4 + "All other spending")
    let legend = [];
    if (sortedRaw.length <= 5) {
      legend = [...sortedRaw];
    } else {
      legend = sortedRaw.slice(0, 4);
      const otherSum = sortedRaw.slice(4).reduce((sum, item) => sum + item.value, 0);
      legend.push({
        name: 'All other spending',
        value: otherSum,
        fill: '#ffffff', // Explicitly white/grey for the "other" slice marker
        icon: '⚪',
        isOther: true
      });
    }

    return { pieData: sortedRaw, legendData: legend, totalSpent: total };
  }, [currentMonthTx, categories]);

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
    setShowAddTx(false);
    setEditingTx(null);
  };

  const handleDeleteTransaction = async (id) => {
    if (!user || !db) return;
    const activeLedgerId = linkedLedgerId || user.uid;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', activeLedgerId, 'transactions', id));
  };

  const handleAddCategory = async (cat) => {
    if (!user || !db) return;
    const activeLedgerId = linkedLedgerId || user.uid;
    const masterCats = categories.filter(c => c.type === 'expense' && !c.parentId);
    if (!cat.parentId && cat.type === 'expense') {
      cat.sortOrder = masterCats.length; 
    }
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
      updatedCat.budgets = {
        ...existingBudgets,
        [monthKey]: parseFloat(updatedCat.budget) || 0
      };
      delete updatedCat.budget;
    }

    await updateDoc(doc(db, 'artifacts', appId, 'users', activeLedgerId, 'categories', id), updatedCat);
    setShowAddCat(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (id) => {
    if (!user || !db) return;
    const activeLedgerId = linkedLedgerId || user.uid;
    const subCats = categories.filter(c => c.parentId === id);
    
    await deleteDoc(doc(db, 'artifacts', appId, 'users', activeLedgerId, 'categories', id));
    
    for (const sub of subCats) {
       await deleteDoc(doc(db, 'artifacts', appId, 'users', activeLedgerId, 'categories', sub.id));
    }
  };

  const handleSaveSettings = async (newSettings) => {
    if (!user || !db) return;
    const activeLedgerId = linkedLedgerId || user.uid;
    await setDoc(doc(db, 'artifacts', appId, 'users', activeLedgerId, 'settings', 'main'), newSettings);
    setShowSettings(false);
  };

  const handleLinkLedger = (code) => {
    if (code.trim() === '') {
      try { localStorage.removeItem('joint_ledger_linked_id'); } catch(e){}
      setLinkedLedgerId('');
    } else {
      try { localStorage.setItem('joint_ledger_linked_id', code.trim()); } catch(e){}
      setLinkedLedgerId(code.trim());
    }
  };

  const getTodayDateObj = () => {
    if (settings.useManualDate && settings.manualDate) {
      return new Date(settings.manualDate + 'T12:00:00'); 
    }
    return new Date();
  };

  const getTodayDateString = () => {
    if (settings.useManualDate && settings.manualDate) {
      return settings.manualDate;
    }
    return new Date().toISOString().split('T')[0];
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const getBudgetForMonth = (category, targetDate) => {
    const subCats = categories.filter(c => c.parentId === category.id);
    if (subCats.length > 0) {
      return subCats.reduce((sum, sub) => sum + getBudgetForMonth(sub, targetDate), 0);
    }
    if (category.budget !== undefined && !category.budgets) {
      return Number(category.budget) || 0;
    }
    if (!category.budgets) return 0;

    let searchDate = new Date(targetDate);
    for (let i = 0; i < 24; i++) {
      const key = getMonthKey(searchDate);
      if (category.budgets[key] !== undefined) {
        return Number(category.budgets[key]);
      }
      searchDate.setMonth(searchDate.getMonth() - 1);
    }
    return 0; 
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentX = e.targetTouches[0].clientX;
    let offset = currentX - touchStart;
    
    if (activeDashTile === 0 && offset > 0) offset = offset * 0.3;
    if (activeDashTile === 1 && offset < 0) offset = offset * 0.3;
    
    setDragOffset(offset);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (dragOffset < -50) setActiveDashTile(prev => Math.min(prev + 1, 1));
    if (dragOffset > 50) setActiveDashTile(prev => Math.max(prev - 1, 0));
    
    setDragOffset(0);
  };

  // Determine what to show in the center of the Donut chart
  let activeCenterDisplay = {
    icon: <TrendingUp size={28} className="mb-2 text-[#e3ece7]" />,
    title: "Total amount",
    amount: totalSpent
  };

  if (hoveredId === 'ALL_OTHER') {
    activeCenterDisplay = {
      icon: <div className="text-3xl mb-1">⚪</div>,
      title: "All other spending",
      amount: legendData.find(d => d.isOther)?.value || 0
    };
  } else if (hoveredId !== null) {
    const activeEntry = pieData.find(d => d.name === hoveredId);
    if (activeEntry) {
      activeCenterDisplay = {
        icon: <div className="text-3xl mb-1">{activeEntry.icon}</div>,
        title: activeEntry.name,
        amount: activeEntry.value
      };
    }
  }

  // Create formatting for the "Sep 1 - Sep 22" style header for the chart
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endDisplayDate = (currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear()) 
    ? new Date() 
    : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Last day of month
    
  const chartDateString = `${startOfMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDisplayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const TrendTooltip = ({ active, payload, label }) => {
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
  };

  const renderDashboard = () => (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      
      {/* Dashboard Tile Controls */}
      <div className="flex justify-between items-center mb-1">
        <div className="relative flex items-center bg-[#1a201c] border border-[#2a332d] rounded-xl px-3 py-2.5 hover:border-[#5bb98c]/50 transition-colors">
          <select 
            value={activeDashTile}
            onChange={(e) => setActiveDashTile(Number(e.target.value))}
            className="bg-transparent text-xs font-semibold text-[#e3ece7] focus:outline-none appearance-none cursor-pointer pr-6 color-scheme-dark"
          >
            <option className="bg-[#121614] text-[#e3ece7]" value={0}>Where it went</option>
            <option className="bg-[#121614] text-[#e3ece7]" value={1}>6-Month Trend</option>
          </select>
          <ChevronDown size={14} className="text-[#8b9a91] absolute right-3 pointer-events-none" />
        </div>
        
        {/* Visual Dots Indicator */}
        <div className="flex space-x-1.5 pr-2">
           <div className={`w-1.5 h-1.5 rounded-full transition-colors ${activeDashTile === 0 ? 'bg-[#5bb98c]' : 'bg-[#2a332d]'}`} />
           <div className={`w-1.5 h-1.5 rounded-full transition-colors ${activeDashTile === 1 ? 'bg-[#5bb98c]' : 'bg-[#2a332d]'}`} />
        </div>
      </div>

      {/* Swipeable Tile Area */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="bg-[#0b0e0c] sm:bg-[#1a201c] rounded-2xl border border-[#2a332d] relative overflow-hidden touch-pan-y" 
      >
        <div 
          className="flex w-full will-change-transform"
          style={{ 
            transform: `translateX(calc(-${activeDashTile * 100}% + ${dragOffset}px))`,
            transitionProperty: 'transform',
            transitionDuration: isDragging ? '0ms' : '300ms',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Tile 0 - Interactive Donut Chart */}
          <div className="w-full flex-shrink-0 p-6">
            <h3 className="text-sm font-semibold text-[#e3ece7] text-center mb-6">{chartDateString}</h3>
            
            <div className="relative h-64 w-full flex items-center justify-center">
              {/* Center Interactive Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                 <div className="animate-in fade-in zoom-in duration-200 flex flex-col items-center">
                    {activeCenterDisplay.icon}
                    <div className="text-xs text-[#8b9a91] font-medium mb-0.5">{activeCenterDisplay.title}</div>
                    <div className="text-2xl font-bold text-[#e3ece7] tracking-tight">{formatMoney(activeCenterDisplay.amount, settings.currency)}</div>
                 </div>
              </div>

              {/* The Donut Chart */}
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80} // Thinner ring matches reference
                      outerRadius={105}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      onMouseEnter={(_, index) => setHoveredId(pieData[index].name)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={(_, index) => setHoveredId(hoveredId === pieData[index].name ? null : pieData[index].name)}
                    >
                      {pieData.map((entry, index) => {
                        const isHovered = hoveredId === null || 
                                          hoveredId === entry.name || 
                                          (hoveredId === 'ALL_OTHER' && index >= 4);

                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.fill} 
                            opacity={isHovered ? 1 : 0.25}
                            className="transition-opacity duration-300 outline-none cursor-pointer"
                          />
                        );
                      })}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                 <div className="h-full flex items-center justify-center text-[#8b9a91] text-sm z-10">No expenses this month</div>
              )}
            </div>

            {/* Custom Interactive Legend */}
            {legendData.length > 0 && (
              <div className="mt-8 space-y-3 px-2 max-w-sm mx-auto">
                {legendData.map((item, idx) => {
                  const itemId = item.isOther ? 'ALL_OTHER' : item.name;
                  const isHighlighted = hoveredId === itemId;
                  const isDimmed = hoveredId !== null && hoveredId !== itemId;

                  return (
                    <div 
                      key={item.name}
                      onMouseEnter={() => setHoveredId(itemId)}
                      onMouseLeave={() => setHoveredId(null)}
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

          {/* Tile 1 - 6 Month Trend */}
          <div className="w-full flex-shrink-0 p-5 bg-[#1a201c] flex flex-col">
            <h3 className="text-sm font-semibold text-[#8b9a91] mb-4">Income vs. spending — last 6 months</h3>
            
            <div className="w-full min-h-[250px] flex-1 flex flex-col">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={previousMonthsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8b9a91', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8b9a91', fontSize: 12 }} tickFormatter={(val) => `$${Number(val).toLocaleString()}`} />
                  <Tooltip 
                    cursor={{ fill: '#2a332d', opacity: 0.4 }}
                    content={<TrendTooltip />}
                  />
                  <Bar 
                    dataKey="Income" 
                    fill="#5bb98c" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={40} 
                    fillOpacity={hoveredTrend === 'Spent' ? 0.3 : 1}
                    className="transition-all duration-300 outline-none cursor-pointer"
                    onMouseEnter={() => setHoveredTrend('Income')}
                    onMouseLeave={() => setHoveredTrend(null)}
                    onClick={() => setHoveredTrend(hoveredTrend === 'Income' ? null : 'Income')}
                  />
                  <Bar 
                    dataKey="Spent" 
                    fill="#e18b71" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={40} 
                    fillOpacity={hoveredTrend === 'Income' ? 0.3 : 1}
                    className="transition-all duration-300 outline-none cursor-pointer"
                    onMouseEnter={() => setHoveredTrend('Spent')}
                    onMouseLeave={() => setHoveredTrend(null)}
                    onClick={() => setHoveredTrend(hoveredTrend === 'Spent' ? null : 'Spent')}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Interactive Legend for Trend */}
            <div className="mt-6 flex justify-center space-x-6">
              {['Income', 'Spent'].map((key) => {
                const isHovered = hoveredTrend === key;
                const isDimmed = hoveredTrend !== null && hoveredTrend !== key;
                const color = key === 'Income' ? '#5bb98c' : '#e18b71';
                return (
                  <div 
                    key={key}
                    onMouseEnter={() => setHoveredTrend(key)}
                    onMouseLeave={() => setHoveredTrend(null)}
                    onClick={() => setHoveredTrend(hoveredTrend === key ? null : key)}
                    className={`flex items-center text-sm cursor-pointer transition-all duration-200 ${isDimmed ? 'opacity-30' : 'opacity-100'} ${isHovered ? 'scale-[1.02]' : ''}`}
                  >
                    <div className="w-3.5 h-3.5 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: color }}></div>
                    <span className={`transition-colors duration-200 ${isHovered ? 'text-white font-bold' : 'text-[#e3ece7] font-medium'}`}>{key}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Recent Activity */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-[#8b9a91]">Recent activity</h3>
          <button onClick={() => setActiveTab('register')} className="text-xs text-[#5bb98c] hover:underline">See all</button>
        </div>
        <div className="bg-[#1a201c] rounded-2xl border border-[#2a332d] overflow-hidden">
          {currentMonthTx.slice(0, 5).sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0)).map((tx, idx) => {
            const cat = categories.find(c => c.id === tx.categoryId) || { name: 'Unknown', icon: '❓' };
            const isInc = tx.type === 'income';
            return (
              <div key={tx.id} onClick={() => { setEditingTx(tx); setShowAddTx(true); }} className={`flex items-center p-4 ${idx !== 0 ? 'border-t border-[#2a332d]' : ''} hover:bg-[#2a332d]/30 transition-colors cursor-pointer`}>
                <div className="w-10 h-10 rounded-xl bg-[#121614] flex items-center justify-center text-xl mr-4 border border-[#2a332d]">
                  {cat.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[#e3ece7]">{cat.name}</div>
                  <div className="text-xs text-[#8b9a91] truncate max-w-[150px] sm:max-w-xs">{formatDate(tx.date)} {tx.note ? `· ${tx.note}` : ''}</div>
                </div>
                <div className={`font-mono font-medium ${isInc ? 'text-[#5bb98c]' : 'text-[#f2f5f3]'}`}>
                  {isInc ? '+' : '-'}{formatMoney(tx.amount, settings.currency)}
                </div>
              </div>
            );
          })}
          {currentMonthTx.length === 0 && (
             <div className="p-6 text-center text-[#8b9a91] text-sm">No recent transactions</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderRegister = () => {
    const grouped = currentMonthTx.sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0)).reduce((acc, tx) => {
      const dateStr = formatDate(tx.date);
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(tx);
      return acc;
    }, {});

    return (
      <div className="space-y-6 pb-24 animate-in fade-in duration-300">
        {Object.keys(grouped).length === 0 ? (
           <div className="text-center text-[#8b9a91] py-10">No transactions this month</div>
        ) : (
          Object.entries(grouped).map(([dateLabel, dayTxs]) => (
            <div key={dateLabel}>
              <div className="text-xs font-semibold text-[#8b9a91] mb-2 px-1">{dateLabel}</div>
              <div className="bg-[#1a201c] rounded-2xl border border-[#2a332d] overflow-hidden">
                {dayTxs.map((tx, idx) => {
                  const cat = categories.find(c => c.id === tx.categoryId) || { name: 'Unknown', icon: '❓' };
                  const isInc = tx.type === 'income';
                  return (
                    <div key={tx.id} onClick={() => { setEditingTx(tx); setShowAddTx(true); }} className={`flex items-center p-4 ${idx !== 0 ? 'border-t border-[#2a332d]' : ''} hover:bg-[#2a332d]/30 transition-colors cursor-pointer`}>
                      <div className="w-10 h-10 rounded-xl bg-[#121614] flex items-center justify-center text-xl mr-4 border border-[#2a332d]">
                        {cat.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-[#e3ece7]">{cat.name}</div>
                        <div className="text-xs text-[#8b9a91]">{tx.note || 'No note'}</div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className={`font-mono font-medium ${isInc ? 'text-[#5bb98c]' : 'text-[#f2f5f3]'}`}>
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

  const enterReorderMode = () => {
    const expenseMasterCats = categories.filter(c => c.type === 'expense' && !c.parentId);
    const startingList = [...expenseMasterCats].sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    setReorderList(startingList);
    setIsReordering(true);
  };

  const saveReorder = async () => {
    if (!user || !db) return;
    const activeLedgerId = linkedLedgerId || user.uid;
    
    for (let i = 0; i < reorderList.length; i++) {
      const cat = reorderList[i];
      if (cat.sortOrder !== i) {
        await updateDoc(doc(db, 'artifacts', appId, 'users', activeLedgerId, 'categories', cat.id), { sortOrder: i });
      }
    }
    setIsReordering(false);
  };

  const handleDragStart = (e, index) => {
    if (!isReordering) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    if (!isReordering) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    if (!isReordering) return;
    e.preventDefault();
    const sourceIndex = Number(e.dataTransfer.getData('text/plain'));
    if (sourceIndex === targetIndex) return;

    const newList = [...reorderList];
    const [movedItem] = newList.splice(sourceIndex, 1);
    newList.splice(targetIndex, 0, movedItem);
    setReorderList(newList);
  };

  const renderBudget = () => {
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

    const displayCats = isReordering ? reorderList : sortedMasterCats;

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
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              disabled={isReordering}
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
            const masterBudget = getBudgetForMonth(master, currentDate);
            
            const masterSpent = currentMonthTx
              .filter(t => t.categoryId === master.id || subCats.some(sub => sub.id === t.categoryId))
              .reduce((sum, t) => sum + Number(t.amount || 0), 0);

            const masterPercent = masterBudget > 0 ? Math.min((masterSpent / masterBudget) * 100, 100) : 0;
            const isMasterOver = masterBudget > 0 && masterSpent > masterBudget;

            return (
              <div 
                key={master.id} 
                draggable={isReordering}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`bg-[#1a201c] p-5 rounded-2xl border border-[#2a332d] space-y-4 transition-all ${isReordering ? 'cursor-grab active:cursor-grabbing border-[#5bb98c]/40 ring-2 ring-[#5bb98c]/20 scale-[1.01] shadow-lg' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    {isReordering && <GripVertical size={20} className="text-[#8b9a91]" />}
                    <div className="text-2xl">{master.icon}</div>
                    <div>
                      <div className="font-semibold text-[#e3ece7] text-base">{master.name}</div>
                      {subCats.length > 0 && <div className="text-[10px] text-[#8b9a91]">Master Category (Auto-calculated)</div>}
                    </div>
                  </div>
                  <div className="text-sm text-right">
                    <span className={isMasterOver ? 'text-[#e18b71] font-semibold' : 'text-[#e3ece7]'}>{formatMoney(masterSpent, settings.currency)}</span>
                    <span className="text-[#8b9a91]"> / {formatMoney(masterBudget, settings.currency)}</span>
                  </div>
                </div>

                <div className="h-2 w-full bg-[#121614] rounded-full overflow-hidden border border-[#2a332d]">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${isMasterOver ? 'bg-[#e18b71]' : 'bg-[#5bb98c]'}`}
                    style={{ width: `${masterPercent}%` }}
                  ></div>
                </div>
                
                {subCats.length === 0 && (
                   <div 
                     onClick={() => { if(!isReordering) { setEditingCategory(master); setShowAddCat(true); } }}
                     className={`bg-[#121614] border border-[#2a332d] rounded-xl p-3 text-sm text-[#8b9a91] flex justify-between items-center transition-colors ${!isReordering ? 'cursor-pointer hover:border-[#5bb98c]/50' : 'opacity-50'}`}
                   >
                     <span>{masterBudget > 0 ? 'Edit monthly budget' : 'Set monthly budget'}</span>
                     <PenLine size={14} className="text-[#8b9a91]" />
                   </div>
                )}

                {subCats.length > 0 && (
                  <div className={`pt-2 border-t border-[#2a332d] space-y-3 ${isReordering ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div className="text-[11px] font-semibold text-[#8b9a91] tracking-wider uppercase">Sub-budgets</div>
                    {subCats.map(sub => {
                      const subSpent = currentMonthTx.filter(t => t.categoryId === sub.id).reduce((sum, t) => sum + Number(t.amount || 0), 0);
                      const subBudget = getBudgetForMonth(sub, currentDate);
                      const subPercent = subBudget > 0 ? Math.min((subSpent / subBudget) * 100, 100) : 0;
                      const isSubOver = subBudget > 0 && subSpent > subBudget;

                      return (
                        <div 
                          key={sub.id}
                          onClick={() => { if(!isReordering) { setEditingCategory(sub); setShowAddCat(true); } }}
                          className="bg-[#121614] p-3 rounded-xl border border-[#2a332d] hover:border-[#5bb98c]/50 transition-colors cursor-pointer"
                        >
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
                          <div className="h-1.5 w-full bg-[#1a201c] rounded-full overflow-hidden mb-2">
                            <div 
                              className={`h-full rounded-full ${isSubOver ? 'bg-[#e18b71]' : 'bg-[#5bb98c]'}`}
                              style={{ width: `${subPercent}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-[#8b9a91]">
                            <span>Tap to edit sub-budget</span>
                            <PenLine size={12} />
                          </div>
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

  const renderCategories = () => {
    const expenseMaster = categories.filter(c => c.type === 'expense' && !c.parentId).sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const incomeCats = categories.filter(c => c.type === 'income');

    return (
      <div className="space-y-8 pb-24 animate-in fade-in duration-300">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-[#e3ece7]">Master & Sub Categories</h3>
            <button 
              onClick={() => { setEditingCategory(null); setShowAddCat(true); }}
              className="px-3 py-1.5 bg-[#e3ece7] text-[#121614] text-xs font-semibold rounded-xl flex items-center space-x-1"
            >
              <Plus size={14} />
              <span>Add Category</span>
            </button>
          </div>

          <div className="space-y-4">
            {expenseMaster.map(master => {
              const subCats = categories.filter(c => c.parentId === master.id);
              return (
                <div key={master.id} className="bg-[#1a201c] p-4 rounded-2xl border border-[#2a332d]">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setEditingCategory(master); setShowAddCat(true); }}>
                      <span className="text-2xl">{master.icon}</span>
                      <div>
                        <div className="font-semibold text-[#e3ece7] text-sm">{master.name}</div>
                        <div className="text-[10px] text-[#8b9a91]">Master Category</div>
                      </div>
                    </div>
                    <button onClick={() => { setEditingCategory(master); setShowAddCat(true); }} className="text-xs text-[#8b9a91] hover:text-white">
                      <PenLine size={14} />
                    </button>
                  </div>

                  {subCats.length > 0 && (
                    <div className="pl-6 border-l-2 border-[#2a332d] space-y-2 mt-3">
                      {subCats.map(sub => (
                        <div 
                          key={sub.id} 
                          onClick={() => { setEditingCategory(sub); setShowAddCat(true); }}
                          className="flex justify-between items-center bg-[#121614] p-3 rounded-xl border border-[#2a332d] hover:border-[#5bb98c]/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{sub.icon}</span>
                            <span className="text-xs font-medium text-[#e3ece7]">{sub.name}</span>
                          </div>
                          <PenLine size={12} className="text-[#8b9a91]" />
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
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {incomeCats.map(cat => (
              <button 
                key={cat.id} 
                onClick={() => { setEditingCategory(cat); setShowAddCat(true); }}
                className="bg-[#1a201c] flex flex-col items-center justify-center p-4 rounded-2xl border border-[#2a332d] hover:bg-[#2a332d]/30 transition-colors"
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <div className="text-[10px] font-semibold text-[#e3ece7] text-center w-full truncate">{cat.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const TransactionModal = () => {
    const isEditing = !!editingTx;
    // We use defaultTxType from deep links if we aren't editing an existing tx
    const [type, setType] = useState(isEditing ? editingTx.type : defaultTxType);
    const [amount, setAmount] = useState(isEditing ? editingTx.amount : '');
    const [categoryId, setCategoryId] = useState(isEditing ? editingTx.categoryId : '');
    const [date, setDate] = useState(isEditing ? editingTx.date : getTodayDateString());
    const [note, setNote] = useState(isEditing ? (editingTx.note || '') : '');
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!amount || !categoryId) return;
      const txData = { type, amount: parseFloat(amount), categoryId, date, note };
      if (isEditing) handleUpdateTransaction(editingTx.id, txData);
      else handleAddTransaction(txData);
    };

    const close = () => {
      setShowAddTx(false);
      setEditingTx(null);
    };

    const filteredCats = categories.filter(c => {
      if (c.type !== type) return false;
      if (type === 'expense') {
        if (c.parentId) {
          return categories.some(p => p.id === c.parentId && !p.parentId);
        } else {
          const hasSubCats = categories.some(sub => sub.parentId === c.id);
          return !hasSubCats;
        }
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
          
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5">
            <div className="flex bg-[#1a201c] p-1 rounded-xl border border-[#2a332d]">
              <button type="button" onClick={() => { setType('expense'); setCategoryId(''); }} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${type === 'expense' ? 'bg-[#e3ece7] text-[#121614]' : 'text-[#8b9a91]'}`}>Expense</button>
              <button type="button" onClick={() => { setType('income'); setCategoryId(''); }} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${type === 'income' ? 'bg-[#e3ece7] text-[#121614]' : 'text-[#8b9a91]'}`}>Income</button>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8b9a91] block mb-2">Amount</label>
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
              <label className="text-xs font-semibold text-[#8b9a91] block mb-2">Category</label>
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
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8b9a91] block mb-2">Date</label>
              <input 
                type="date" value={date} onChange={(e) => setDate(e.target.value)} required
                className="w-full bg-[#1a201c] border border-[#2a332d] rounded-xl p-4 text-[#e3ece7] focus:outline-none focus:border-[#5bb98c] color-scheme-dark"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8b9a91] block mb-2">Note (optional)</label>
              <input 
                type="text" value={note} onChange={(e) => setNote(e.target.value)}
                className="w-full bg-[#1a201c] border border-[#2a332d] rounded-xl p-4 text-[#e3ece7] focus:outline-none focus:border-[#5bb98c] placeholder-[#4a5550]"
                placeholder="What was this for?"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button type="button" onClick={close} className="flex-1 py-4 rounded-xl border border-[#2a332d] text-[#e3ece7] font-semibold hover:bg-[#1a201c]">Cancel</button>
              <button type="submit" className="flex-1 py-4 rounded-xl bg-[#e3ece7] text-[#121614] font-semibold hover:bg-white transition-colors">Save</button>
            </div>
            
            {isEditing && (
              <div className="pt-2 border-t border-[#2a332d]">
                {!showConfirmDelete ? (
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmDelete(true)} 
                    className="w-full py-4 rounded-xl border border-red-500/30 text-red-400 font-semibold hover:bg-red-500/10 transition-colors"
                  >
                    Delete Transaction
                  </button>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex flex-col items-center mt-2">
                    <span className="text-sm font-semibold text-red-400 mb-3">Are you sure you want to delete this?</span>
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
        catData.budgets = {
          ...(isEditing && editingCategory.budgets ? editingCategory.budgets : {}),
          [monthKey]: parseFloat(budget) || 0
        };
      }
      
      if (isEditing) handleUpdateCategory(editingCategory.id, catData);
      else handleAddCategory(catData);
    };

    const close = () => {
      setShowAddCat(false);
      setEditingCategory(null);
    };

    const masterExpenseCats = categories.filter(c => c.type === 'expense' && !c.parentId && (!isEditing || c.id !== editingCategory.id));
    const currentEmojis = type === 'income' ? INCOME_EMOJIS : EXPENSE_EMOJIS;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#121614] w-full max-w-sm rounded-3xl border border-[#2a332d] overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-5 border-b border-[#2a332d] flex justify-between items-center">
            <h2 className="text-xl font-serif font-bold text-[#e3ece7]">{isEditing ? 'Edit Category' : 'New Category'}</h2>
            <button onClick={close} className="text-[#8b9a91]"><X /></button>
          </div>
          <div className="p-5 overflow-y-auto space-y-5">
            <div className="flex bg-[#1a201c] p-1 rounded-xl border border-[#2a332d]">
              <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 text-sm font-medium rounded-lg ${type === 'expense' ? 'bg-[#e3ece7] text-[#121614]' : 'text-[#8b9a91]'}`}>Expense</button>
              <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 text-sm font-medium rounded-lg ${type === 'income' ? 'bg-[#e3ece7] text-[#121614]' : 'text-[#8b9a91]'}`}>Income</button>
            </div>
            
            {type === 'expense' && (
              <div className="flex bg-[#1a201c] p-1 rounded-xl border border-[#2a332d]">
                <button type="button" onClick={() => setIsMaster(true)} className={`flex-1 py-2 text-xs font-medium rounded-lg ${isMaster ? 'bg-[#5bb98c] text-[#121614]' : 'text-[#8b9a91]'}`}>Master Category</button>
                <button 
                  type="button" 
                  disabled={hasSubCats} 
                  onClick={() => !hasSubCats && setIsMaster(false)} 
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
                  value={parentId} 
                  onChange={e => setParentId(e.target.value)} 
                  className="w-full bg-[#1a201c] border border-[#2a332d] rounded-xl p-3 text-[#e3ece7] focus:outline-none color-scheme-dark"
                  required
                >
                  <option className="bg-[#121614]" value="">Select Master Category...</option>
                  {masterExpenseCats.map(m => (
                    <option className="bg-[#121614]" key={m.id} value={m.id}>{m.icon} {m.name}</option>
                  ))}
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
                    type="button" 
                    onClick={() => setShowConfirmDelete(true)} 
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
    const [localName, setLocalName] = useState(settings.name || 'Our Ledger');
    const [localStart, setLocalStart] = useState(settings.startingBalance || 0);
    const [localCurrency, setLocalCurrency] = useState(settings.currency || 'USD');
    const [localTheme, setLocalTheme] = useState(settings.theme || 'dark');
    const [localUseManualDate, setLocalUseManualDate] = useState(settings.useManualDate || false);
    const [localManualDate, setLocalManualDate] = useState(settings.manualDate || new Date().toISOString().split('T')[0]);
    
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

    const handleApplyLink = () => {
      handleLinkLedger(shareCodeInput);
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#121614] w-full max-w-md rounded-3xl border border-[#2a332d] overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-5 border-b border-[#2a332d] flex justify-between items-center">
            <h2 className="text-xl font-serif font-bold text-[#e3ece7]">Settings</h2>
            <button onClick={() => setShowSettings(false)} className="text-[#8b9a91] hover:text-white transition-colors"><X /></button>
          </div>
          
          <div className="flex bg-[#1a201c] p-1 mx-5 mt-5 rounded-xl border border-[#2a332d]">
            <button type="button" onClick={() => setActiveTab('general')} className={`flex-1 py-2 text-sm font-medium rounded-lg ${activeTab === 'general' ? 'bg-[#e3ece7] text-[#121614]' : 'text-[#8b9a91]'}`}>General</button>
            <button type="button" onClick={() => setActiveTab('sync')} className={`flex-1 py-2 text-sm font-medium rounded-lg ${activeTab === 'sync' ? 'bg-[#e3ece7] text-[#121614]' : 'text-[#8b9a91]'}`}>Account & Sync</button>
          </div>

          <div className="p-5 overflow-y-auto flex-1">
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
                      type="checkbox" 
                      checked={!localUseManualDate} 
                      onChange={(e) => setLocalUseManualDate(!e.target.checked)}
                      className="w-4 h-4 rounded border-[#2a332d] text-[#5bb98c] focus:ring-[#5bb98c] bg-[#1a201c] accent-[#5bb98c]"
                    />
                    <span className="text-xs text-[#e3ece7]">Use automatic system date</span>
                  </label>
                  {localUseManualDate && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="text-xs font-semibold text-[#8b9a91] block mb-2">Manual Date Override</label>
                      <input 
                        type="date" 
                        value={localManualDate} 
                        onChange={e => setLocalManualDate(e.target.value)} 
                        className="w-full bg-[#1a201c] border border-[#2a332d] rounded-xl p-3 text-[#e3ece7] color-scheme-dark focus:outline-none focus:border-[#5bb98c]" 
                      />
                      <p className="text-[10px] text-[#8b9a91] mt-2 leading-tight">This locks the "Today" button and new transactions to this exact date to fix timezone or syncing errors.</p>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-[#8b9a91] text-center">
                  Account balance = starting balance + all income - all expenses logged here.
                </div>
                <div className="flex space-x-3 pt-2">
                  <button type="button" onClick={() => setShowSettings(false)} className="flex-1 py-4 rounded-xl border border-[#2a332d] text-[#e3ece7] font-semibold hover:bg-[#1a201c]">Cancel</button>
                  <button type="submit" className="flex-1 py-4 rounded-xl bg-[#e3ece7] text-[#121614] font-semibold hover:bg-white transition-colors">Save</button>
                </div>
                
                <div className="mt-8 border-t border-[#2a332d] pt-6 space-y-3">
                  <h3 className="text-sm font-semibold text-[#e3ece7] mb-2">Your data</h3>
                  <button type="button" className="w-full py-4 rounded-xl border border-[#2a332d] text-[#e3ece7] font-semibold hover:bg-[#1a201c] transition-colors">Export as CSV</button>
                  <button type="button" className="w-full py-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold hover:bg-red-500/20 transition-colors">Clear all data</button>
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
                  <p className="text-xs text-[#8b9a91] mb-4">Paste a partner's Share Code here to link your app to their ledger. Leave blank and apply to disconnect.</p>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      value={shareCodeInput} 
                      onChange={e => setShareCodeInput(e.target.value)} 
                      placeholder="Paste Share Code..."
                      className="w-full bg-[#121614] border border-[#2a332d] rounded-xl p-3 text-[#e3ece7] text-xs font-mono" 
                    />
                    <button onClick={handleApplyLink} className="p-3 bg-transparent border border-[#5bb98c] text-[#5bb98c] rounded-xl font-medium text-sm hover:bg-[#5bb98c] hover:text-[#121614] transition-colors whitespace-nowrap">
                      Apply
                    </button>
                  </div>
                  {linkedLedgerId && (
                    <div className="mt-3 text-xs text-yellow-500 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
                      You are currently viewing a linked partner's ledger.
                    </div>
                  )}
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
      {/* Header */}
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

          <div className="flex justify-between items-end mb-1">
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

          {activeTab === 'dashboard' && (
            <div className="flex justify-between items-center border-t border-[#2a332d] pt-3 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex-1 text-center">
                <div className="text-[10px] text-[#8b9a91] font-medium mb-1 uppercase tracking-wider">Income</div>
                <div className="text-sm font-semibold text-[#5bb98c]">{formatMoney(summary.income, settings.currency)}</div>
              </div>
              <div className="w-px h-8 bg-[#2a332d]"></div>
              <div className="flex-1 text-center">
                <div className="text-[10px] text-[#8b9a91] font-medium mb-1 uppercase tracking-wider">Spent</div>
                <div className="text-sm font-semibold text-[#e18b71]">{formatMoney(summary.spent, settings.currency)}</div>
              </div>
              <div className="w-px h-8 bg-[#2a332d]"></div>
              <div className="flex-1 text-center">
                <div className="text-[10px] text-[#8b9a91] font-medium mb-1 uppercase tracking-wider">Net</div>
                <div className={`text-sm font-semibold ${summary.net >= 0 ? 'text-[#5bb98c]' : 'text-[#e18b71]'}`}>
                  {summary.net > 0 ? '+' : ''}{formatMoney(summary.net, settings.currency)}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-5 max-w-2xl mx-auto">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'register' && renderRegister()}
        {activeTab === 'budget' && renderBudget()}
        {activeTab === 'categories' && renderCategories()}
      </main>

      {/* FAB */}
      <button 
        onClick={() => { setEditingTx(null); setShowAddTx(true); }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#e3ece7] rounded-full flex items-center justify-center text-[#121614] shadow-lg shadow-black/50 hover:scale-105 active:scale-95 transition-all z-20"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-[#121614]/90 backdrop-blur-lg border-t border-[#2a332d] pb-safe z-30">
        <div className="flex justify-around items-center p-2 max-w-2xl mx-auto">
          {[
            { id: 'dashboard', icon: Home, label: 'Dashboard' },
            { id: 'register', icon: List, label: 'Register' },
            { id: 'budget', icon: PieChartIcon, label: 'Budget' },
            { id: 'categories', icon: Grid, label: 'Categories' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center w-16 py-2 rounded-2xl transition-all ${isActive ? 'bg-[#1a201c] text-[#5bb98c]' : 'text-[#8b9a91] hover:text-[#e3ece7]'}`}
              >
                <Icon size={20} className="mb-1" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Modals Container */}
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