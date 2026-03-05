"use client";

import { useState, useEffect } from "react";
import {
  Ticket,
  TrendingUp,
  CreditCard,
  Wallet,
  ShoppingBag,
  Bell,
  Settings,
  Search,
  RefreshCw,
  Gift,
  Star,
  CheckCircle2,
  HelpCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { tokenTransactionsApi, type TokenTransactionDto } from "@/lib/api";

export default function TokensPage() {
  const { showToast } = useToast();
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [transactions, setTransactions] = useState<TokenTransactionDto[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [tokensEarnedThisMonth, setTokensEarnedThisMonth] = useState(0);
  const [tokensSpentThisMonth, setTokensSpentThisMonth] = useState(0);

  const { user, adjustTokens, refreshUser } = useAuth();
  const tokenBalance = user?.tokenBalance ?? 0;

  // Add Elite package to match design
  const packages = [
    {
      id: 1,
      name: "Starter",
      tokens: 100,
      price: 10,
      bonus: 0,
      popular: false,
      features: ["Valid for 30 days", "Access to gym floor"],
      color: "blue"
    },
    {
      id: 2,
      name: "Fit Pro",
      tokens: 500,
      price: 45,
      originalPrice: 50,
      bonus: 50,
      popular: true,
      features: ["Valid for 60 days", "Save 10% instantly", "Priority Booking"],
      color: "orange"
    },
    {
      id: 3,
      name: "Premium",
      tokens: 1000,
      price: 85,
      originalPrice: 100,
      bonus: 100,
      popular: false,
      features: ["No expiry date", "Save 15% instantly", "1 Free Guest Pass"],
      color: "primary"
    },
    {
      id: 4,
      name: "Elite",
      tokens: 2500,
      price: 200,
      bonus: 300,
      popular: false,
      features: ["Save 20% + Free Merch", "VIP Locker Access", "AI Nutrition Plan"],
      color: "dark",
      isElite: true
    }
  ];

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?.userId) return;

      try {
        setIsLoadingTransactions(true);

        // First, refresh user data to get the latest token balance from the server
        if (refreshUser) {
          await refreshUser();
        }

        const response = await tokenTransactionsApi.getUserTransactions(user.userId);

        if (response.success && response.data) {
          setTransactions(response.data);

          const now = new Date();
          const thisMonth = now.getMonth();
          const thisYear = now.getFullYear();

          let earned = 0;
          let spent = 0;

          response.data.forEach(tx => {
            const txDate = new Date(tx.createdAt);
            if (txDate.getMonth() === thisMonth && txDate.getFullYear() === thisYear) {
              if (tx.amount > 0) {
                earned += tx.amount;
              } else {
                spent += Math.abs(tx.amount);
              }
            }
          });

          setTokensEarnedThisMonth(earned);
          setTokensSpentThisMonth(spent);
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    fetchTransactions();
  }, [user?.userId, refreshUser]);

  const handlePurchaseClick = (pkg: any) => {
    if (!user) {
      showToast("Please log in to purchase tokens.", "warning");
      return;
    }
    setSelectedPackage(pkg);
    setPurchaseDialogOpen(true);
  };

  const confirmPurchase = async () => {
    if (!selectedPackage || !user) return;
    setIsPurchasing(true);
    try {
      const totalTokens = selectedPackage.tokens + selectedPackage.bonus;

      console.log('Attempting token purchase:', {
        totalTokens,
        packageName: selectedPackage.name,
        userId: user.userId
      });

      const response = await tokenTransactionsApi.createTransaction({
        amount: totalTokens,
        transactionType: "Purchase",
        description: `Purchased ${selectedPackage.name} Pack`,
        referenceType: "TokenPackage",
        referenceId: selectedPackage.id,
      });

      console.log('Purchase response:', response);

      if (response.success && response.data) {
        adjustTokens(totalTokens);
        setTransactions(prev => [response.data!, ...prev]);
        setTokensEarnedThisMonth(prev => prev + totalTokens);
        if (refreshUser) await refreshUser();
        showToast(`Successfully purchased ${totalTokens} tokens!`, "success");
        setPurchaseDialogOpen(false);
        setSelectedPackage(null);
      } else {
        console.error('Purchase failed:', response.message, response.errors);
        showToast(response.message || "Failed to complete purchase", "error");
      }
    } catch (error) {
      console.error('Purchase error:', error);
      showToast(`An error occurred during purchase: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    } finally {
      setIsPurchasing(false);
    }
  };

  const calculateBreakdown = () => {
    const breakdown: Record<string, number> = {
      "Classes": 0,
      "Coaching": 0,
      "Goods": 0,
      "Other": 0
    };

    transactions.forEach(tx => {
      if (tx.amount < 0) {
        const amt = Math.abs(tx.amount);
        const desc = tx.description.toLowerCase();
        if (desc.includes('class') || desc.includes('group')) breakdown["Classes"] += amt;
        else if (desc.includes('coach') || desc.includes('training')) breakdown["Coaching"] += amt;
        else if (desc.includes('protein') || desc.includes('product') || desc.includes('equipment')) breakdown["Goods"] += amt;
        else breakdown["Other"] += amt;
      }
    });

    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    return {
      breakdown,
      total,
      percentages: {
        Classes: total ? Math.round((breakdown.Classes / total) * 100) : 0,
        Coaching: total ? Math.round((breakdown.Coaching / total) * 100) : 0,
        Goods: total ? Math.round((breakdown.Goods / total) * 100) : 0,
        Other: total ? Math.round((breakdown.Other / total) * 100) : 0,
      }
    };
  };

  const { breakdown, total: totalSpent, percentages } = calculateBreakdown();

  const getTransactionBadge = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('purchase') || t.includes('deposit')) return <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Deposit</span>;
    if (t.includes('service') || t.includes('booking')) return <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Service</span>;
    if (t.includes('goods') || t.includes('product')) return <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-700/10">Goods</span>;
    return <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/20">Other</span>;
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-slate-900 font-sans text-slate-900 dark:text-white pb-20">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30 dark:opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-orange-50 dark:from-slate-800 dark:to-slate-900"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 lg:px-8 py-8 space-y-8 max-w-7xl">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-end gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">My Wallet</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Manage your tokens, top up, and track your fitness investment.</p>
          </div>
          <Button className="bg-gradient-to-r from-orange-400 to-orange-500 hover:to-orange-600 text-white border-0 shadow-lg shadow-orange-200 rounded-xl px-5 py-6 font-bold gap-2">
            <Gift className="h-5 w-5" />
            Refer a Friend & Earn 50
          </Button>
        </div>

        {/* Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Balance Card - Span 2 */}
          <div className="lg:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[24px] p-6 lg:p-8 shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Wallet className="w-32 h-32" />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-between gap-8">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">Current Balance</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-slate-900 tracking-tight">{tokenBalance}</span>
                    <span className="text-xl font-bold text-blue-500">Tokens</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-2 font-medium">≈ ${(tokenBalance / 10).toFixed(2)} USD value</p>
                </div>
                <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  +{tokensEarnedThisMonth} this month
                </div>
              </div>

              {/* Auto Refill UI */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-600">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-blue-500" />
                    <p className="font-bold text-sm text-slate-900 dark:text-white">Auto-Refill</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-medium text-slate-400">
                    <span>Threshold: 100 Tokens</span>
                    <span>Refill Amount: 500</span>
                  </div>
                  <div className="relative h-2 w-full bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full w-[32%] bg-blue-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Spending Analysis */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
            <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-white">Spending Analysis</h3>
            <div className="flex items-center gap-4 h-full">
              {/* Donut Chart Simulation (Conic Gradient) */}
              <div
                className="relative w-32 h-32 rounded-full flex-shrink-0"
                style={{
                  background: `conic-gradient(
                            #3b82f6 0% ${percentages.Classes}%, 
                            #10B981 ${percentages.Classes}% ${percentages.Classes + percentages.Coaching}%, 
                            #F97316 ${percentages.Classes + percentages.Coaching}% ${percentages.Classes + percentages.Coaching + percentages.Goods}%,
                            #94a3b8 ${percentages.Classes + percentages.Coaching + percentages.Goods}% 100%
                        )`
                }}
              >
                <div className="absolute inset-4 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center flex-col shadow-inner">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Total</span>
                  <span className="font-black text-lg text-slate-900 dark:text-white">{totalSpent}</span>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-slate-600 font-medium">Classes</span>
                  </div>
                  <span className="font-bold">{percentages.Classes}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-slate-600 font-medium">Coaching</span>
                  </div>
                  <span className="font-bold">{percentages.Coaching}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-slate-600 font-medium">Goods</span>
                  </div>
                  <span className="font-bold">{percentages.Goods}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Packages Grid */}
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-blue-500" />
            Purchase Packages
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`
                            relative rounded-[24px] p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
                            ${pkg.isElite
                    ? "bg-slate-900 text-white shadow-2xl shadow-slate-900/20"
                    : pkg.popular
                      ? "bg-white border-2 border-orange-400 shadow-lg shadow-orange-100"
                      : "bg-white border border-slate-200 shadow-sm"
                  }
                        `}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    Most Popular
                  </div>
                )}

                <div>
                  <h4 className={`font-bold text-sm uppercase tracking-wide flex items-center gap-1 ${pkg.isElite ? "text-yellow-400" : pkg.popular ? "text-orange-500" : "text-slate-500"}`}>
                    {pkg.isElite && <Star className="h-3 w-3 fill-current" />}
                    {pkg.name}
                  </h4>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className={`text-4xl font-black ${pkg.isElite ? "text-white" : "text-slate-900"}`}>{pkg.tokens}</span>
                    <span className={`text-sm font-bold ${pkg.isElite ? "text-slate-400" : "text-slate-400"}`}>Tokens</span>
                  </div>
                  <div className={`text-xl font-bold mt-1 ${pkg.isElite ? "text-white" : "text-slate-900"}`}>
                    ${pkg.price}
                    {pkg.originalPrice && (
                      <span className="text-sm font-medium text-green-500 line-through ml-2">${pkg.originalPrice}</span>
                    )}
                  </div>
                </div>

                <ul className="flex-1 space-y-3">
                  {pkg.features.map((feature: string, i: number) => (
                    <li key={i} className={`text-sm font-medium flex items-center gap-2 ${pkg.isElite ? "text-slate-300" : "text-slate-600"}`}>
                      <CheckCircle2 className={`h-4 w-4 ${pkg.isElite ? "text-green-400" : "text-green-500"}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePurchaseClick(pkg)}
                  className={`
                                w-full py-6 rounded-xl font-bold text-md shadow-md transition-all
                                ${pkg.isElite
                      ? "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur"
                      : pkg.popular
                        ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200"
                        : "bg-white border-2 border-slate-100 text-slate-700 hover:bg-slate-50 hover:border-slate-200"
                    }
                            `}
                >
                  {pkg.isElite ? "Join Elite" : pkg.popular ? "Purchase" : "Select"}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Grid: Transactions & Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Transaction History Table */}
          <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-700/50">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Transaction History</h3>
              <Button variant="ghost" className="text-blue-500 font-bold hover:text-blue-600">View All</Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {isLoadingTransactions ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        No transactions recorded.
                      </td>
                    </tr>
                  ) : (
                    transactions.slice(0, 5).map((tx) => (
                      <tr key={tx.transactionId} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">
                          {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{tx.description}</td>
                        <td className="px-6 py-4">
                          {getTransactionBadge(tx.transactionType)}
                        </td>
                        <td className={`px-6 py-4 text-right font-black ${tx.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                          {tx.amount > 0 ? "+" : ""}{tx.amount}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400 font-medium">{tx.balanceAfter}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Side: Charts/Info */}
          <div className="flex flex-col gap-6">

            {/* Monthly Spending Bars (Dynamic) */}
            <div className="bg-white dark:bg-slate-800 rounded-[24px] p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-white">Monthly Spending</h3>
              <div className="flex items-end justify-between h-40 gap-2 pb-2">
                {(() => {
                  const months = new Map<string, number>();
                  const today = new Date();
                  for (let i = 4; i >= 0; i--) {
                    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    const monthName = d.toLocaleString('default', { month: 'short' });
                    months.set(monthName, 0);
                  }
                  transactions?.forEach(tx => {
                    if (tx.amount < 0) {
                      const d = new Date(tx.createdAt);
                      const monthName = d.toLocaleString('default', { month: 'short' });
                      if (months.has(monthName)) {
                        months.set(monthName, months.get(monthName)! + Math.abs(tx.amount));
                      }
                    }
                  });
                  const data = Array.from(months.entries()).map(([m, v]) => ({ m, v }));
                  const maxVal = Math.max(...data.map(d => d.v), 100);

                  return data.map((bar, i) => (
                    <div key={i} className="w-full flex flex-col justify-end items-center gap-2 group cursor-pointer">
                      <div
                        className={`w-full rounded-t-lg transition-all relative group-hover:bg-blue-200 ${bar.m === today.toLocaleString('default', { month: 'short' }) ? "bg-blue-500/20 group-hover:bg-blue-500/30" : "bg-slate-100"}`}
                        style={{ height: `${Math.max((bar.v / maxVal) * 100, 5)}%` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none transition-opacity font-bold z-10">
                          {bar.v}
                        </div>
                      </div>
                      <span className={`text-xs font-bold ${bar.m === today.toLocaleString('default', { month: 'short' }) ? "text-blue-600" : "text-slate-400"}`}>{bar.m}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Exchange Guide */}
            <div className="bg-white dark:bg-slate-800 rounded-[24px] p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex-1">
              <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-slate-400" />
                Quick Exchange Guide
              </h3>
              <div className="space-y-0">
                {[
                  { name: "Towel Rental", price: "2 Tokens" },
                  { name: "Protein Shake", price: "12 Tokens" },
                  { name: "Guest Pass", price: "30 Tokens" },
                  { name: "Personal Coach (1hr)", price: "50 Tokens" }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-700 last:border-0 last:pb-0">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{item.name}</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Legacy Purchase Dialog (Hidden UI, Functional) */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-[24px] shadow-2xl border-0 p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedPackage?.name} Pack Purchase</DialogTitle>
            <DialogDescription>Confirm your token package purchase</DialogDescription>
          </DialogHeader>

          {selectedPackage && (
            <>
              <div className="bg-slate-50 p-8 text-center border-b border-slate-100">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${selectedPackage.isElite ? "bg-slate-900 text-yellow-400" : "bg-blue-50 text-blue-600"}`}>
                  {selectedPackage.isElite ? <Star className="h-8 w-8 fill-current" /> : <ShoppingBag className="h-8 w-8" />}
                </div>
                <h2 className="text-2xl font-black text-slate-900">{selectedPackage.name} Pack</h2>
                <p className="text-slate-500 font-medium mt-1">Confirm your purchase</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Tokens</span>
                  <span className="text-xl font-bold text-slate-900">{selectedPackage.tokens}</span>
                </div>
                {selectedPackage.bonus > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 font-medium">Bonus</span>
                    <span className="text-xl font-bold text-green-600">+{selectedPackage.bonus}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-900">Total Price</span>
                  <span className="text-3xl font-black text-blue-600">${selectedPackage.price}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPurchaseDialogOpen(false)}
                    className="rounded-xl h-12 font-bold border-slate-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmPurchase}
                    disabled={isPurchasing}
                    className="rounded-xl h-12 font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        Processing...
                      </>
                    ) : (
                      "Confirm"
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}

        </DialogContent>
      </Dialog>
    </div>
  );
}
