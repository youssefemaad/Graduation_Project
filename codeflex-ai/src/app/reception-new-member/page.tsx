"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  Calendar,
  CreditCard,
  User,
  MapPin,
  Building,
  Hash,
  CheckCircle,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { useRouter } from "next/navigation";
import { receptionApi } from "@/lib/api/reception";
import {
  subscriptionApi,
  type SubscriptionPlanDto,
} from "@/lib/api/subscription";

function ReceptionNewMemberContent() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlanDto[]>([]);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "male",
    address: "",
    city: "",
    nationalId: "",
    emergencyContact: "",
    emergencyPhone: "",

    // Subscription Information
    selectedPlanId: 0,
    startDate: new Date().toISOString().split("T")[0],

    // Payment Information
    paymentMethod: "Cash",
    amount: 0,
  });

  // Fetch subscription plans from backend
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setPlansLoading(true);
        const response = await subscriptionApi.getActivePlans();
        if (response.success && response.data) {
          setPlans(response.data);
          if (response.data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              selectedPlanId: response.data![0].planId,
              amount: response.data![0].price,
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch plans:", err);
      } finally {
        setPlansLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const selectedPlan = plans.find((p) => p.planId === formData.selectedPlanId);

  const parseFeatures = (features?: string): string[] => {
    if (!features) return [];
    try {
      const parsed = JSON.parse(features);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return features
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);
    }
  };

  const getPlanColor = (index: number) => {
    const colors = [
      "from-gray-500 to-gray-600",
      "from-blue-500 to-cyan-500",
      "from-yellow-500 to-orange-500",
    ];
    return colors[index % colors.length];
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handlePlanSelect = (planId: number) => {
    const plan = plans.find((p) => p.planId === planId);
    if (plan) {
      setFormData((prev) => ({
        ...prev,
        selectedPlanId: planId,
        amount: plan.price,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await receptionApi.createMember({
        email: formData.email,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        nationalId: formData.nationalId,
        phone: formData.phone || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender === "male" ? 0 : 1,
        address: formData.address
          ? `${formData.address}, ${formData.city}`
          : formData.city || undefined,
        emergencyContactName: formData.emergencyContact || undefined,
        emergencyContactPhone: formData.emergencyPhone || undefined,
        planId: formData.selectedPlanId,
        paymentMethod: formData.paymentMethod,
        amount: formData.amount,
      });

      if (response.success && response.data) {
        alert(
          `Member registered successfully!\n\nName: ${response.data.name}\nMember #: ${response.data.memberNumber}\nPlan: ${response.data.subscriptionPlan}\nPassword: Their National ID`,
        );
        router.push("/reception-members");
      } else {
        setError(response.message || "Failed to create member");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Create member error:", err);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reception-dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold">
              <span className="text-foreground">New Member Registration</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Register a new member and process subscription payment
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((stepNum) => (
          <div key={stepNum} className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= stepNum
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {stepNum}
            </div>
            <span
              className={`text-sm font-medium ${
                step >= stepNum ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {stepNum === 1 && "Personal Info"}
              {stepNum === 2 && "Subscription"}
              {stepNum === 3 && "Payment"}
            </span>
            {stepNum < 3 && <div className="w-12 h-0.5 bg-muted mx-2" />}
          </div>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <Card className="p-4 border-red-500/50 bg-red-500/10">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-500 font-medium">{error}</p>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        {/* Step 1: Personal Information */}
        {step === 1 && (
          <Card className="p-8 border border-border bg-card/50 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              Personal Information
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  required
                />
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="member@example.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+20 123 456 7890"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              {/* National ID */}
              <div className="space-y-2">
                <Label htmlFor="nationalId">
                  National ID * (used as initial password)
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nationalId"
                    name="nationalId"
                    value={formData.nationalId}
                    onChange={handleInputChange}
                    placeholder="Enter national ID"
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  The member will use their National ID as their initial
                  password to log in.
                </p>
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter full address"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                <Input
                  id="emergencyContact"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  placeholder="Enter emergency contact"
                />
              </div>

              {/* Emergency Phone */}
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="emergencyPhone"
                    name="emergencyPhone"
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                    placeholder="+20 123 456 7890"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button type="button" onClick={nextStep}>
                Next Step
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Subscription Plan */}
        {step === 2 && (
          <Card className="p-8 border border-border bg-card/50 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-primary" />
              Choose Subscription Plan
            </h2>

            {/* Membership Plans */}
            {plansLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">
                  Loading plans...
                </span>
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No subscription plans available. Please add plans from the
                  admin panel.
                </p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  {plans.map((plan, index) => {
                    const features = parseFeatures(plan.features);
                    return (
                      <div
                        key={plan.planId}
                        onClick={() => handlePlanSelect(plan.planId)}
                        className={`relative cursor-pointer border-2 rounded-lg p-6 transition-all ${
                          formData.selectedPlanId === plan.planId
                            ? "border-primary shadow-lg scale-105"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {plan.isPopular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                            POPULAR
                          </div>
                        )}

                        <div
                          className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getPlanColor(index)} mb-4 flex items-center justify-center`}
                        >
                          <CreditCard className="h-6 w-6 text-white" />
                        </div>

                        <h3 className="text-2xl font-bold mb-2">
                          {plan.planName}
                        </h3>
                        {plan.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {plan.description}
                          </p>
                        )}
                        <div className="text-3xl font-bold text-primary mb-1">
                          EGP {plan.price}
                        </div>
                        <div className="text-sm text-muted-foreground mb-4">
                          {plan.durationDays} days &middot;{" "}
                          {plan.tokensIncluded} tokens included
                        </div>

                        {features.length > 0 && (
                          <ul className="space-y-2">
                            {features.map((feature, fIndex) => (
                              <li
                                key={fIndex}
                                className="flex items-center gap-2 text-sm"
                              >
                                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Start Date */}
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Price Summary */}
                <Card className="mt-6 p-4 bg-muted/50">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Amount:</span>
                    <span className="text-3xl font-bold text-primary">
                      EGP {formData.amount}
                    </span>
                  </div>
                </Card>
              </>
            )}

            <div className="flex justify-between mt-6">
              <Button type="button" variant="outline" onClick={prevStep}>
                Previous
              </Button>
              <Button
                type="button"
                onClick={nextStep}
                disabled={!formData.selectedPlanId}
              >
                Next Step
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <Card className="p-8 border border-border bg-card/50 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-primary" />
              Payment Information
            </h2>

            {/* Payment Summary */}
            <Card className="p-6 bg-primary/5 mb-6">
              <h3 className="text-lg font-bold mb-4">Payment Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Name:</span>
                  <span className="font-semibold">
                    {formData.firstName} {formData.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Membership Plan:
                  </span>
                  <span className="font-semibold">
                    {selectedPlan?.planName || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-semibold">
                    {selectedPlan?.durationDays || 0} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date:</span>
                  <span className="font-semibold">
                    {new Date(formData.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Login Password:</span>
                  <span className="font-semibold text-yellow-600">
                    National ID (
                    {formData.nationalId
                      ? "***" + formData.nationalId.slice(-4)
                      : "—"}
                    )
                  </span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between">
                  <span className="text-lg font-bold">Total Amount:</span>
                  <span className="text-2xl font-bold text-primary">
                    EGP {formData.amount}
                  </span>
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <div className="grid md:grid-cols-3 gap-4">
                  {["Cash", "Card", "Bank Transfer"].map((method) => (
                    <div
                      key={method}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentMethod: method,
                        }))
                      }
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        formData.paymentMethod === method
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            method === "Cash"
                              ? "bg-green-500/10"
                              : method === "Card"
                                ? "bg-blue-500/10"
                                : "bg-purple-500/10"
                          }`}
                        >
                          <CreditCard
                            className={`h-5 w-5 ${
                              method === "Cash"
                                ? "text-green-500"
                                : method === "Card"
                                  ? "text-blue-500"
                                  : "text-purple-500"
                            }`}
                          />
                        </div>
                        <span className="font-semibold">{method}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment confirmation */}
              <Card className="p-4 bg-green-500/5 border-green-500/20">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-600">
                      Ready to Process
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click &quot;Complete Registration&quot; to finalize the
                      member registration and process the payment.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={loading}
              >
                Previous
              </Button>
              <Button type="submit" className="gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Complete Registration
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}
      </form>
    </div>
  );
}

export default function ReceptionNewMemberPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Receptionist]}>
      <ReceptionNewMemberContent />
    </ProtectedRoute>
  );
}
