"use client";

import { useState, FormEvent, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  HeartPulseIcon,
  ZapIcon,
  MailIcon,
  LockIcon,
  AlertCircleIcon,
  UserCircleIcon,
  PhoneIcon,
  CheckIcon,
  XIcon,
  TrophyIcon,
  ActivityIcon,
  HeartIcon,
  EyeIcon,
  EyeOffIcon,
  CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export default function SignUpPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState<number>(0); // 0 = Male, 1 = Female
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };

    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
    if (score <= 3) return { score, label: "Medium", color: "bg-yellow-500" };
    if (score <= 4) return { score, label: "Strong", color: "bg-secondary" };
    return { score, label: "Very Strong", color: "bg-secondary" };
  }, [password]);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email format");
      return false;
    }
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(phone.trim())) {
      setError("Please enter a valid phone number");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (!acceptTerms) {
      setError("You must accept the terms and conditions");
      return false;
    }
    return true;
  };

  const handleFeatureComingSoon = (feature: string) => {
    showToast(`${feature} is coming soon!`, "info");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Always register as Member - public registration is Members only
      await register(email, password, name, 'Member', phone, gender);
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen relative flex bg-[#f6f7f8] overflow-hidden">
      {/* Left Panel - Dark Brand Section */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-slate-900 via-slate-800 to-primary/20">
        {/* Pattern Background */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded-xl backdrop-blur-sm">
              <HeartPulseIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">PulseGym</h1>
              <p className="text-xs text-slate-400">AI-Powered Fitness</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold mb-4">
                Transform Your
                <span className="block text-primary">Fitness Journey</span>
              </h2>
              <p className="text-white/70 text-lg leading-relaxed max-w-md">
                Join thousands of members achieving their fitness goals with AI-powered coaching, personalized workouts, and comprehensive progress tracking.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <ZapIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">AI-Powered Coaching</h3>
                  <p className="text-white/60 text-sm">Personalized plans generated by advanced AI</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="p-2 bg-secondary/20 rounded-lg">
                  <ActivityIcon className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold">InBody Analysis</h3>
                  <p className="text-white/60 text-sm">Track body composition and progress</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <TrophyIcon className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">Achievements & Rewards</h3>
                  <p className="text-white/60 text-sm">Earn badges and track milestones</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-8">
            <div>
              <p className="text-3xl font-bold text-primary">10K+</p>
              <p className="text-white/50 text-sm">Active Members</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-secondary">500+</p>
              <p className="text-white/50 text-sm">Workout Plans</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-accent">98%</p>
              <p className="text-white/50 text-sm">Satisfaction</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Light Sign Up Form */}
      <div className="w-full lg:w-[55%] h-full flex flex-col items-center justify-center p-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <HeartPulseIcon className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">PulseGym</h1>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-4" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
            {/* Header */}
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <HeartIcon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Member Account</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-0.5">Create Account</h2>
              <p className="text-[10px] text-slate-500">Start your fitness transformation today</p>
            </div>

            {/* Social Sign Up */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => handleFeatureComingSoon("Google Signup")}
                className="h-9 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-xs"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => handleFeatureComingSoon("Apple Signup")}
                className="h-9 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-xs"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                Apple
              </Button>
            </div>

            {/* Divider */}
            <div className="relative my-2.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="px-2 bg-white text-slate-500">or sign up with email</span>
              </div>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-medium text-slate-700">Full Name</Label>
                <div className="relative">
                  <UserCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9 h-9 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-primary/20 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs font-medium text-slate-700">Phone</Label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+20..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-9 h-9 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-primary/20 text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dob" className="text-xs font-medium text-slate-700">Date of Birth</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="dob"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="pl-9 h-9 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-primary/20 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-medium text-slate-700">Email Address</Label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-9 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-primary/20 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Gender</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="0"
                      checked={gender === 0}
                      onChange={() => setGender(0)}
                      className="text-primary focus:ring-primary/20 bg-slate-50 border-slate-300 w-3 h-3"
                    />
                    <span className="text-xs text-slate-700">Male</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="1"
                      checked={gender === 1}
                      onChange={() => setGender(1)}
                      className="text-primary focus:ring-primary/20 bg-slate-50 border-slate-300 w-3 h-3"
                    />
                    <span className="text-xs text-slate-700">Female</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium text-slate-700">Password</Label>
                  {password && (
                    <span className={`text-[10px] font-medium ${passwordStrength.score <= 2 ? "text-red-500" :
                      passwordStrength.score <= 3 ? "text-yellow-500" : "text-secondary"
                      }`}>{passwordStrength.label}</span>
                  )}
                </div>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9 h-9 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-primary/20 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password Strength Indicator */}
                {password && (
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-0.5 flex-1 rounded-full transition-colors ${i <= passwordStrength.score ? passwordStrength.color : "bg-slate-200"
                          }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-slate-700">Confirm Password</Label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 h-9 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-primary/20 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 rounded border-slate-300 bg-slate-50 text-primary focus:ring-primary/20"
                />
                <label htmlFor="terms" className="text-xs text-slate-500 leading-normal">
                  I agree to the{" "}
                  <button type="button" className="text-primary font-medium hover:underline" onClick={() => handleFeatureComingSoon("Terms of Service")}>Terms of Service</button>
                  {" "}and{" "}
                  <button type="button" className="text-primary font-medium hover:underline" onClick={() => handleFeatureComingSoon("Privacy Policy")}>Privacy Policy</button>
                  . I consent to receive AI-generated fitness insights.
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600">
                  <AlertCircleIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-blue-500/30 transition-all duration-200 text-sm mt-2"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Creating Account...
                  </div>
                ) : (
                  "Create Free Account"
                )}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="mt-2 text-center">
              <p className="text-sm text-slate-600">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-sm text-slate-500">
            © 2025 PulseGym. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
