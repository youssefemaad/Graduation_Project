"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Download,
  Mail,
  Eye,
  Plus,
  Filter,
  TrendingUp,
  DollarSign,
  Calendar,
  BarChart3,
  CreditCard,
  Banknote,
  Coins,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  paymentsApi,
  PaymentDto,
  PaymentStatsDto,
  PaymentFilterDto,
} from "@/lib/api/payments";

export default function PaymentsClient() {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [stats, setStats] = useState<PaymentStatsDto | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Pending" | "Refunded">("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPayments();
    loadStats();
  }, [activeTab, currentPage, searchQuery]);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const filter: PaymentFilterDto = {
        status: activeTab === "All" ? undefined : activeTab,
        searchQuery: searchQuery || undefined,
        pageNumber: currentPage,
        pageSize: 10,
      };

      const response = await paymentsApi.getPayments(filter);
      if (response.success && response.data) {
        setPayments(response.data.payments);
        setTotalPages(response.data.totalPages);
        setTotalCount(response.data.totalCount);
      }
    } catch (error) {
      showToast("Failed to load payments", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await paymentsApi.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleDownloadInvoice = async (paymentId: number) => {
    try {
      const blob = await paymentsApi.downloadInvoice(paymentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast("Invoice downloaded successfully", "success");
    } catch (error) {
      showToast("Failed to download invoice", "error");
    }
  };

  const handleEmailInvoice = async (paymentId: number) => {
    try {
      const response = await paymentsApi.emailInvoice(paymentId);
      if (response.success) {
        showToast("Invoice sent successfully", "success");
      }
    } catch (error) {
      showToast("Failed to send invoice", "error");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" />
            Completed
          </Badge>
        );
      case "Pending":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse mr-1.5" />
            Pending
          </Badge>
        );
      case "Refunded":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <RotateCcw className="h-3 w-3 mr-1" />
            Refunded
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    if (method.toLowerCase().includes("visa") || method.toLowerCase().includes("mastercard")) {
      return <CreditCard className="h-4 w-4 text-blue-600" />;
    } else if (method.toLowerCase().includes("cash")) {
      return <Banknote className="h-4 w-4 text-green-600" />;
    } else {
      return <Coins className="h-4 w-4 text-orange-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { date: dateStr, time: timeStr };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span className="hover:text-primary transition-colors cursor-pointer">Home</span>
          <span className="text-gray-400">/</span>
          <span className="font-medium text-gray-800 dark:text-gray-200">Payments</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Payments Overview
            </h2>
            <p className="text-gray-500 mt-1">Manage financial records, invoices, and refunds.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
            <Button className="flex items-center gap-2 bg-primary hover:bg-blue-600">
              <Plus className="h-4 w-4" />
              Process New Payment
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-8 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Today's Revenue */}
          <Card className="p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md hover:shadow-lg transition-shadow relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <DollarSign className="h-16 w-16 text-primary" />
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">Today&apos;s Revenue</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                ${stats?.todayRevenue.toFixed(2) || "0.00"}
              </h3>
              <Badge className="bg-emerald-100 text-emerald-600 hover:bg-emerald-100">
                <TrendingUp className="h-3 w-3 mr-0.5" />
                {stats?.todayRevenueChange.toFixed(1)}%
              </Badge>
            </div>
          </Card>

          {/* Weekly Revenue */}
          <Card className="p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md hover:shadow-lg transition-shadow relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Calendar className="h-16 w-16 text-purple-500" />
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">Weekly Revenue</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                ${stats?.weeklyRevenue.toFixed(2) || "0.00"}
              </h3>
              <Badge className="bg-emerald-100 text-emerald-600 hover:bg-emerald-100">
                <TrendingUp className="h-3 w-3 mr-0.5" />
                {stats?.weeklyRevenueChange.toFixed(1)}%
              </Badge>
            </div>
          </Card>

          {/* Monthly Growth */}
          <Card className="p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md hover:shadow-lg transition-shadow relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <BarChart3 className="h-16 w-16 text-orange-500" />
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">Monthly Growth</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                +{stats?.monthlyGrowth.toFixed(0)}%
              </h3>
              <Badge className="bg-emerald-100 text-emerald-600 hover:bg-emerald-100">
                <TrendingUp className="h-3 w-3 mr-0.5" />
                {stats?.monthlyGrowthChange.toFixed(1)}%
              </Badge>
            </div>
          </Card>
        </div>

        {/* Table Section */}
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/60">
          {/* Filters & Tabs */}
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
            {/* Tabs */}
            <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-xl inline-flex">
              <button
                onClick={() => {
                  setActiveTab("All");
                  setCurrentPage(1);
                }}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "All"
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                All Transactions
              </button>
              <button
                onClick={() => {
                  setActiveTab("Pending");
                  setCurrentPage(1);
                }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "Pending"
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => {
                  setActiveTab("Refunded");
                  setCurrentPage(1);
                }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "Refunded"
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                Refunded
              </button>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-3 flex-1 justify-end max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by member, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
                  <th className="px-6 py-4">Member Info</th>
                  <th className="px-6 py-4">Plan / Service</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Payment Method</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => {
                    const { date, time } = formatDate(payment.paymentDate);
                    return (
                      <tr
                        key={payment.paymentId}
                        className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-10 w-10 rounded-full bg-cover bg-center ring-2 ring-white dark:ring-gray-700 shadow-sm"
                              style={{
                                backgroundImage: payment.memberPhoto
                                  ? `url(${payment.memberPhoto})`
                                  : "none",
                                backgroundColor: !payment.memberPhoto ? "#3B82F6" : undefined,
                              }}
                            >
                              {!payment.memberPhoto && (
                                <div className="h-full w-full flex items-center justify-center text-white font-bold">
                                  {payment.memberName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {payment.memberName}
                              </p>
                              <p className="text-xs text-gray-500">ID: {payment.memberNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {payment.planOrService}
                        </td>
                        <td
                          className={`px-6 py-4 text-sm font-bold ${
                            payment.status === "Refunded"
                              ? "line-through text-gray-400 decoration-red-500"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          ${payment.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center justify-center w-8 h-6 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                              {getPaymentMethodIcon(payment.paymentMethod)}
                            </div>
                            <span>{payment.paymentMethod}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {date}{" "}
                          <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">
                            {time}
                          </span>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(payment.status)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {payment.status !== "Refunded" ? (
                              <>
                                <button
                                  onClick={() => handleDownloadInvoice(payment.paymentId)}
                                  className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                  title="Download Invoice"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEmailInvoice(payment.paymentId)}
                                  className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                  title="Email Receipt"
                                >
                                  <Mail className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500">
            <span>
              Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalCount)} of{" "}
              {totalCount} entries
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {[...Array(Math.min(totalPages, 3))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              {totalPages > 3 && <span className="px-2 py-1">...</span>}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
