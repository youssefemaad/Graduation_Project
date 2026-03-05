"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  HeartPulseIcon,
  MailIcon,
  LockIcon,
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password, rememberMe);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeatureComingSoon = (feature: string) => {
    showToast(`${feature} is coming soon!`, "info");
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        {/* Image Background with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
          }}
        />
        {/* Gradient Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/80 to-blue-50/80 backdrop-blur-[2px]"></div>
      </div>

      {/* Scrollable Content Container */}
      <div className="relative z-10 w-full h-full overflow-y-auto flex flex-col items-center justify-center py-4 sm:px-6 lg:px-8">

        {/* Login Card */}
        <div className="relative z-10 w-full max-w-[420px] bg-white dark:bg-slate-800 rounded-2xl shadow-card transition-all duration-300">
          {/* Brand Header */}
          <div className="flex flex-col items-center px-6 pt-6 pb-4 text-center">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center justify-center size-9 rounded-xl bg-primary/10 text-primary">
                <HeartPulseIcon className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">PulseGym</h1>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI-Powered Fitness</p>
            <div className="mt-4 text-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Welcome back, athlete.</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage your gym with AI precision.</p>
            </div>
          </div>

          {/* Form Section */}
          <div className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Email Input */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-700">Email Address</span>
                <div className="relative group">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-primary" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="coach@pulsegym.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 h-9 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    required
                  />
                </div>
              </label>

              {/* Password Input */}
              <label className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-700">Password</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-primary hover:text-blue-600 transition-colors"
                    onClick={() => handleFeatureComingSoon("Forgot Password")}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative group">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-primary" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 h-9 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </label>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-3.5 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                />
                <label className="text-xs font-medium text-slate-600 cursor-pointer select-none">Remember for 30 days</label>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600">
                  <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs">{error}</span>
                </div>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-primary hover:bg-blue-600 py-2.5 px-4 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] h-10"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Signing in...
                  </div>
                ) : (
                  "Log In"
                )}
              </Button>

              {/* Divider */}
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-3 text-[10px] font-semibold text-slate-400 uppercase">Or continue with</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => handleFeatureComingSoon("Google Login")}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all h-9"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  onClick={() => handleFeatureComingSoon("Facebook Login")}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all h-9"
                >
                  <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  Facebook
                </Button>
              </div>
            </form>
          </div>

          {/* Footer Area - Sign Up Link */}
          <div className="border-t border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-700 dark:bg-slate-700/50">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              New to PulseGym?{" "}
              <Link href="/signup" className="font-bold text-primary hover:text-blue-600 transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
