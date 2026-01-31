
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Participant, Expense, Settlement, Balance } from './types.ts';
import { calculateBalances, calculateSettlements } from './utils/finance.ts';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import html2canvas from 'html2canvas';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6'];

const App: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 'p1', name: 'A' },
    { id: 'p2', name: 'B' },
    { id: 'p3', name: 'C' },
    { id: 'p4', name: 'D' },
  ]);
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 'e1', payerId: 'p1', amount: 100, description: '晚餐', timestamp: Date.now() - 10000 },
    { id: 'e2', payerId: 'p2', amount: 70, description: '饮料', timestamp: Date.now() - 5000 },
  ]);
  
  const [newParticipantName, setNewParticipantName] = useState('');
  const [expensePayerId, setExpensePayerId] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (participants.length > 0 && !participants.find(p => p.id === expensePayerId)) {
      setExpensePayerId(participants[0].id);
    }
  }, [participants, expensePayerId]);

  const balances = useMemo(() => calculateBalances(participants, expenses), [participants, expenses]);
  const settlements = useMemo(() => calculateSettlements(balances), [balances]);
  const totalAmount = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const perPerson = participants.length > 0 ? totalAmount / participants.length : 0;

  const highestSpender = useMemo(() => {
    if (expenses.length === 0) return "无";
    const totals: Record<string, number> = {};
    expenses.forEach(e => {
      totals[e.payerId] = (totals[e.payerId] || 0) + e.amount;
    });
    let maxAmount = -1;
    let maxPayerId = "";
    Object.entries(totals).forEach(([id, amt]) => {
      if (amt > maxAmount) {
        maxAmount = amt;
        maxPayerId = id;
      }
    });
    return participants.find(p => p.id === maxPayerId)?.name || "无";
  }, [expenses, participants]);

  const addParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParticipantName.trim()) return;
    const newP: Participant = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: newParticipantName.trim(),
    };
    setParticipants(prev => [...prev, newP]);
    setNewParticipantName('');
  };

  const removeParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
    setExpenses(prev => prev.filter(e => e.payerId !== id));
  };

  const addExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (!expensePayerId || isNaN(amt) || amt <= 0) return;
    const newE: Expense = {
      id: `e-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      payerId: expensePayerId,
      amount: amt,
      description: expenseDesc.trim() || '未命名支出',
      timestamp: Date.now(),
    };
    setExpenses(prev => [newE, ...prev]); 
    setExpenseAmount('');
    setExpenseDesc('');
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const chartData = useMemo(() => {
    return participants.map(p => ({
      name: p.name,
      value: expenses.filter(e => e.payerId === p.id).reduce((sum, e) => sum + e.amount, 0)
    })).filter(d => d.value > 0);
  }, [participants, expenses]);

  const exportAsImage = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#f8fafc',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `PartySplit-${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 safe-top">
      <header className="bg-indigo-600 text-white py-10 shadow-lg mb-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-black flex items-center justify-center gap-3">
            <i className="fas fa-hand-holding-usd text-indigo-300"></i>
            PartySplit Pro
          </h1>
          <p className="mt-2 text-indigo-100 opacity-80 tracking-[0.2em] uppercase text-xs font-medium">智能派对结算助手</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 space-y-12">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
              <i className="fas fa-users-cog text-indigo-500"></i>
              1. 谁参与了？
            </h2>
            <form onSubmit={addParticipant} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="参与者姓名"
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
              />
              <button className="bg-indigo-600 text-white px-5 rounded-xl hover:bg-indigo-700 transition-all font-bold">
                添加
              </button>
            </form>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {participants.map(p => (
                <div key={p.id} className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-2 text-sm">
                  <span className="font-semibold text-slate-700">{p.name}</span>
                  <button onClick={() => removeParticipant(p.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                    <i className="fas fa-times-circle"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
              <i className="fas fa-plus-circle text-indigo-500"></i>
              2. 记录支出
            </h2>
            <form onSubmit={addExpense} className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <select 
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
                  value={expensePayerId}
                  onChange={(e) => setExpensePayerId(e.target.value)}
                >
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>{p.name} 付了钱</option>
                  ))}
                </select>
              </div>
              <input
                type="number"
                step="0.01"
                placeholder="金额 (¥)"
                className="px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
              />
              <input
                type="text"
                placeholder="消费备注"
                className="px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
              />
              <button className="col-span-2 bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95">
                记录此项
              </button>
            </form>
          </div>
        </section>

        <section ref={reportRef} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Party Settlement</h2>
            <div className="w-16 h-1 bg-indigo-500 mx-auto mt-2 rounded-full"></div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-indigo-500">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">总计支出</p>
              <h3 className="text-2xl font-black text-slate-800">¥{totalAmount.toFixed(1)}</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">人均应付</p>
              <h3 className="text-2xl font-black text-emerald-600">¥{perPerson.toFixed(1)}</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-purple-500">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">消费最高</p>
              <h3 className="text-2xl font-black text-purple-600 truncate">{highestSpender}</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">参与人数</p>
              <h3 className="text-2xl font-black text-amber-600">{participants.length} 人</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-xs">最近记录</h4>
                </div>
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {expenses.map(e => (
                    <div key={e.id} className="p-4 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-xs">{participants.find(p=>p.id===e.payerId)?.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{e.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-800 text-xs">¥{e.amount}</span>
                        <button onClick={() => deleteExpense(e.id)} className="text-slate-200 hover:text-rose-500"><i className="fas fa-trash text-[10px]"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <h4 className="font-bold text-slate-800 text-xs mb-6">转账方案</h4>
                  <div className="space-y-3">
                    {settlements.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                        <span className="text-xs font-bold text-slate-600">{participants.find(p=>p.id===s.from)?.name}</span>
                        <div className="flex flex-col items-center flex-1 px-4">
                          <span className="text-indigo-600 font-black text-xs">¥{s.amount}</span>
                          <div className="w-full h-px bg-indigo-200 relative my-1"><i className="fas fa-caret-right absolute -right-1 -top-1.5 text-indigo-300 text-[10px]"></i></div>
                        </div>
                        <span className="text-xs font-bold text-slate-600">{participants.find(p=>p.id===s.to)?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <h4 className="font-bold text-slate-800 text-xs mb-6">收支分析</h4>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4} dataKey="value">
                          {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={exportAsImage}
            disabled={isExporting || expenses.length === 0}
            className={`w-full max-w-sm py-4 rounded-3xl font-black text-white shadow-2xl transition-all ${isExporting ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {isExporting ? '正在生成图片...' : '导出结算单图片'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default App;
