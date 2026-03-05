"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { 
  ZapIcon,
  LockIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  UserCircleIcon,
  BriefcaseIcon,
  AwardIcon,
  CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SetupAccountPage() {
  const { user, changePassword, completeFirstLoginSetup, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [step, setStep] = useState<'password' | 'profile'>('password');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Coach profile form
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [certifications, setCertifications] = useState("");
  const [availableHours, setAvailableHours] = useState("");
  
  // Receptionist profile form
  const [shift, setShift] = useState("Morning");
  const [employeeId, setEmployeeId] = useState("");

  useEffect(() => {
    // If user doesn't need setup, redirect to dashboard
    if (!authLoading && user) {
      if (!user.mustChangePassword && !user.isFirstLogin) {
        const roleRoutes: Record<string, string> = {
          'Member': "/dashboard",
          'Coach': "/coach-dashboard",
          'Receptionist': "/reception-dashboard",
          'Admin': "/admin-dashboard",
        };
        router.push(roleRoutes[user.role] || "/dashboard");
      } else if (!user.mustChangePassword && user.isFirstLogin) {
        // Skip password step if not required
        setStep('profile');
      }
    }
  }, [user, authLoading, router]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      setSuccess("Password changed successfully!");
      
      // Move to profile step if first login
      if (user?.isFirstLogin) {
        setTimeout(() => {
          setStep('profile');
          setSuccess("");
        }, 1500);
      } else {
        // Complete setup if only password change was required
        setTimeout(async () => {
          await completeFirstLoginSetup();
        }, 1500);
      }
    } catch (err) {
      console.error("Password change error:", err);
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // TODO: Save profile data to backend
      // For now, we'll just complete the first login setup
      // In a full implementation, you'd call an API to save coach/receptionist profile
      
      await completeFirstLoginSetup();
    } catch (err) {
      console.error("Profile setup error:", err);
      setError(err instanceof Error ? err.message : "Failed to complete setup");
      setIsLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isCoach = user.role === 'Coach';
  const isReceptionist = user.role === 'Receptionist';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="bg-background rounded-2xl shadow-2xl p-8 md:p-12 border border-border/50">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg shadow-blue-500/20">
                <ZapIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Pulse<span className="text-primary">Gym</span></h1>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {step === 'password' ? 'Change Your Password' : 'Complete Your Profile'}
            </h2>
            <p className="text-muted-foreground">
              {step === 'password' 
                ? 'Please set a new password for your account'
                : `Set up your ${user.role} profile to get started`
              }
            </p>
            
            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className={`w-3 h-3 rounded-full ${step === 'password' ? 'bg-primary' : 'bg-green-500'}`}></div>
              <div className={`w-16 h-1 ${step === 'profile' ? 'bg-green-500' : 'bg-border'}`}></div>
              <div className={`w-3 h-3 rounded-full ${step === 'profile' ? 'bg-primary' : 'bg-border'}`}></div>
            </div>
          </div>

          {/* Password Change Form */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-medium">Current/Temporary Password</Label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Enter your current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
                  <AlertCircleIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500">
                  <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{success}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Changing Password...
                  </div>
                ) : (
                  "Change Password"
                )}
              </Button>
            </form>
          )}

          {/* Profile Setup Form */}
          {step === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              {/* Coach Profile */}
              {isCoach && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="specialization" className="text-sm font-medium">Specialization</Label>
                    <div className="relative">
                      <AwardIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="specialization"
                        type="text"
                        placeholder="e.g., Weight Training, Cardio, HIIT"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience" className="text-sm font-medium">Years of Experience</Label>
                    <div className="relative">
                      <BriefcaseIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="experience"
                        type="number"
                        placeholder="e.g., 5"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="pl-10 h-11"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="certifications" className="text-sm font-medium">Certifications</Label>
                    <Input
                      id="certifications"
                      type="text"
                      placeholder="e.g., ACE, NASM, ISSA"
                      value={certifications}
                      onChange={(e) => setCertifications(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="availableHours" className="text-sm font-medium">Available Hours</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="availableHours"
                        type="text"
                        placeholder="e.g., Mon-Fri 9AM-6PM"
                        value={availableHours}
                        onChange={(e) => setAvailableHours(e.target.value)}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself and your coaching philosophy..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </>
              )}

              {/* Receptionist Profile */}
              {isReceptionist && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="employeeId" className="text-sm font-medium">Employee ID</Label>
                    <div className="relative">
                      <UserCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="employeeId"
                        type="text"
                        placeholder="Enter your employee ID"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Preferred Shift</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Morning', 'Afternoon', 'Evening'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setShift(s)}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            shift === s 
                              ? 'border-primary bg-primary/10 text-primary' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
                  <AlertCircleIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Completing Setup...
                  </div>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-slate-500">
          © 2025 PulseGym. Smart Gym Management System.
        </div>
      </div>
    </div>
  );
}
