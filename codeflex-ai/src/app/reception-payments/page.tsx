"use client";

import { useState } from "react";
import {
  CreditCard,
  Search,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  Clock,
  Receipt,
  Download,
  Mail,
  Phone,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";

function ReceptionPaymentsContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [paymentType, setPaymentType] = useState("subscription");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amount, setAmount] = useState("");

  // Mock data for pending payments
  const pendingPayments = [
    {
      id: 1,
      memberName: "Ahmed Hassan",
      memberId: "M001",
      type: "Subscription Renewal",
      amount: 800,
      dueDate: "2024-12-05",
      status: "Due Soon",
      avatar: "AH",
    },
    {
      id: 2,
      memberName: "Sara Mohamed",
      memberId: "M002",
      type: "Personal Training",
      amount: 300,
      dueDate: "2024-12-01",
      status: "Overdue",
      avatar: "SM",
    },
    {
      id: 3,
      memberName: "Omar Ali",
      memberId: "M003",
      type: "Subscription Renewal",
      amount: 1200,
      dueDate: "2024-12-10",
      status: "Pending",
      avatar: "OA",
    },
  ];

  // Mock members for search
  const members = [
    {
      id: "M001",
      name: "Ahmed Hassan",
      email: "ahmed@example.com",
      phone: "+20 123 456 7890",
      membershipType: "Standard",
      currentBalance: 0,
      avatar: "AH",
    },
    {
      id: "M002",
      name: "Sara Mohamed",
      email: "sara@example.com",
      phone: "+20 123 456 7891",
      membershipType: "Premium",
      currentBalance: -300,
      avatar: "SM",
    },
    {
      id: "M003",
      name: "Omar Ali",
      email: "omar@example.com",
      phone: "+20 123 456 7892",
      membershipType: "Premium",
      currentBalance: 0,
      avatar: "OA",
    },
  ];

  const recentTransactions = [
    {
      id: 1,
      memberName: "Fatma Ibrahim",
      type: "Subscription",
      amount: 500,
      method: "Cash",
      date: "2024-11-29",
      time: "10:30 AM",
      status: "Completed",
    },
    {
      id: 2,
      memberName: "Karim Youssef",
      type: "Personal Training",
      amount: 200,
      method: "Card",
      date: "2024-11-29",
      time: "09:15 AM",
      status: "Completed",
    },
    {
      id: 3,
      memberName: "Nour Ahmed",
      type: "Subscription",
      amount: 1200,
      method: "Bank Transfer",
      date: "2024-11-28",
      time: "04:30 PM",
      status: "Completed",
    },
  ];

  const paymentTypes = [
    { id: "subscription", label: "Subscription Renewal", baseAmount: 800 },
    { id: "training", label: "Personal Training", baseAmount: 200 },
    { id: "nutrition", label: "Nutrition Plan", baseAmount: 150 },
    { id: "equipment", label: "Equipment Rental", baseAmount: 50 },
    { id: "other", label: "Other", baseAmount: 0 },
  ];

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMemberSelect = (member: any) => {
    setSelectedMember(member);
    setSearchQuery("");
  };

  const handlePaymentTypeChange = (type: string) => {
    setPaymentType(type);
    const selectedType = paymentTypes.find((pt) => pt.id === type);
    if (selectedType && selectedType.baseAmount > 0) {
      setAmount(selectedType.baseAmount.toString());
    }
  };

  const handleProcessPayment = () => {
    if (!selectedMember || !amount) {
      alert("Please select a member and enter an amount");
      return;
    }

    alert(
      `Payment of $${amount} processed successfully for ${selectedMember.name} via ${paymentMethod}`
    );

    // Reset form
    setSelectedMember(null);
    setAmount("");
    setPaymentType("subscription");
    setPaymentMethod("cash");
  };

  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const todayTransactions = recentTransactions.length;
  const todayRevenue = recentTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="text-foreground">Payment Processing</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Process member payments and view transactions
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">${todayRevenue}</div>
              <div className="text-sm text-muted-foreground mt-1">Today's Revenue</div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-full">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary">{todayTransactions}</div>
              <div className="text-sm text-muted-foreground mt-1">Today's Transactions</div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Receipt className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-yellow-500">${totalPending}</div>
              <div className="text-sm text-muted-foreground mt-1">Pending Payments</div>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-full">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Process Payment Form */}
        <Card className="lg:col-span-2 p-6 border border-border bg-card/50 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Process New Payment
          </h2>

          <div className="space-y-6">
            {/* Member Search */}
            <div className="space-y-2">
              <Label>Search Member *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or member ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Search Results Dropdown */}
              {searchQuery && filteredMembers.length > 0 && (
                <Card className="absolute z-10 w-full max-w-2xl mt-1 border border-border">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => handleMemberSelect(member)}
                      className="p-4 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold text-sm">
                          {member.avatar}
                        </div>
                        <div>
                          <div className="font-semibold">{member.name}</div>
                          <div className="text-sm text-muted-foreground">{member.id}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </div>

            {/* Selected Member */}
            {selectedMember && (
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold">
                      {selectedMember.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-lg">{selectedMember.name}</div>
                      <div className="text-sm text-muted-foreground">{selectedMember.id}</div>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {selectedMember.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {selectedMember.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Membership</div>
                    <div className="font-semibold">{selectedMember.membershipType}</div>
                    {selectedMember.currentBalance < 0 && (
                      <div className="text-red-500 font-semibold mt-1">
                        Balance: ${selectedMember.currentBalance}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Payment Type */}
            <div className="space-y-2">
              <Label>Payment Type *</Label>
              <select
                value={paymentType}
                onChange={(e) => handlePaymentTypeChange(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                {paymentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <div className="grid grid-cols-3 gap-4">
                <div
                  onClick={() => setPaymentMethod("cash")}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    paymentMethod === "cash"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <DollarSign className="h-6 w-6 text-green-500" />
                    <span className="font-semibold text-sm">Cash</span>
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod("card")}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    paymentMethod === "card"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <CreditCard className="h-6 w-6 text-blue-500" />
                    <span className="font-semibold text-sm">Card</span>
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod("bank")}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    paymentMethod === "bank"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <CreditCard className="h-6 w-6 text-purple-500" />
                    <span className="font-semibold text-sm">Bank</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Process Button */}
            <Button
              onClick={handleProcessPayment}
              className="w-full h-12 text-lg gap-2"
              disabled={!selectedMember || !amount}
            >
              <CheckCircle className="h-5 w-5" />
              Process Payment ${amount || "0"}
            </Button>
          </div>
        </Card>

        {/* Pending Payments */}
        <Card className="p-6 border border-border bg-card/50 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-yellow-500" />
            Pending Payments
          </h3>
          <div className="space-y-3">
            {pendingPayments.map((payment) => (
              <div
                key={payment.id}
                className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => {
                  const member = members.find((m) => m.id === payment.memberId);
                  if (member) {
                    setSelectedMember(member);
                    setAmount(payment.amount.toString());
                  }
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold text-sm">
                    {payment.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{payment.memberName}</div>
                    <div className="text-xs text-muted-foreground">{payment.type}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-primary">${payment.amount}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      payment.status === "Overdue"
                        ? "bg-red-500/10 text-red-500"
                        : payment.status === "Due Soon"
                        ? "bg-yellow-500/10 text-yellow-500"
                        : "bg-blue-500/10 text-blue-500"
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  Due: {new Date(payment.dueDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border border-border bg-card/50 backdrop-blur-sm">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            Recent Transactions
          </h3>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold">Transaction ID</th>
                <th className="text-left p-4 font-semibold">Member</th>
                <th className="text-left p-4 font-semibold">Type</th>
                <th className="text-left p-4 font-semibold">Amount</th>
                <th className="text-left p-4 font-semibold">Method</th>
                <th className="text-left p-4 font-semibold">Date & Time</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-t border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="p-4 font-mono text-sm">#{transaction.id.toString().padStart(6, "0")}</td>
                  <td className="p-4 font-semibold">{transaction.memberName}</td>
                  <td className="p-4 text-sm">{transaction.type}</td>
                  <td className="p-4 font-bold text-green-500">${transaction.amount}</td>
                  <td className="p-4 text-sm">{transaction.method}</td>
                  <td className="p-4 text-sm">
                    {new Date(transaction.date).toLocaleDateString()} {transaction.time}
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-500">
                      {transaction.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <Button size="sm" variant="outline" className="gap-2">
                      <Receipt className="h-4 w-4" />
                      Receipt
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default function ReceptionPaymentsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Receptionist]}>
      <ReceptionPaymentsContent />
    </ProtectedRoute>
  );
}
