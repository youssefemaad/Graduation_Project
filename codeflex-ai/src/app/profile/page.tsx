"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { usersApi, authApi, type UpdateProfileDto } from "@/lib/api";
import {
  subscriptionApi,
  type UserSubscriptionDetailsDto,
} from "@/lib/api/subscription";
import {
  User,
  Phone,
  Calendar,
  MapPin,
  Camera,
  Edit2,
  Mail,
  Shield,
  CreditCard,
  Activity,
  Bell,
  LogOut,
  ChevronRight,
  Save,
  Lock,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { Switch } from "@/components/ui/switch"; // Assuming you have this, or use standard checkbox

function ProfileContent() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("personal");
  const [isSaving, setIsSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [subscription, setSubscription] =
    useState<UserSubscriptionDetailsDto | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<UpdateProfileDto>({
    name: "",
    phone: "",
    dateOfBirth: "",
    gender: 0,
    address: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth || "",
        gender: user.gender || 0,
        address: user.address || "",
      });
      setProfileImage(user.profileImageUrl || null);
    }
  }, [user]);

  // Fetch subscription data
  useEffect(() => {
    if (user?.userId) {
      const fetchSub = async () => {
        setSubLoading(true);
        try {
          const response = await subscriptionApi.getUserSubscription(
            user.userId,
          );
          if (response.success && response.data) {
            setSubscription(response.data);
          }
        } catch (err) {
          console.error("Failed to fetch subscription:", err);
        } finally {
          setSubLoading(false);
        }
      };
      fetchSub();
    }
  }, [user?.userId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.userId) return;

    setUploadingImage(true);
    try {
      const response = await usersApi.uploadProfileImage(user.userId, file);
      if (response.success && response.data) {
        setProfileImage(response.data.profileImageUrl);
        showToast("Profile image updated!", "success");
      } else {
        showToast(response.message || "Failed to upload image", "error");
      }
    } catch {
      showToast("Error uploading image", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      showToast("Please fill in all password fields", "error");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    setChangingPassword(true);
    try {
      const response = await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });
      if (response.success) {
        showToast("Password changed successfully!", "success");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        showToast(response.message || "Failed to change password", "error");
      }
    } catch {
      showToast("Error changing password", "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSave = async () => {
    if (!user?.userId) return;
    setIsSaving(true);
    try {
      const response = await usersApi.updateProfile(user.userId, formData);
      if (response.success) {
        showToast("Profile updated successfully", "success");
      } else {
        showToast("Failed to update profile", "error");
      }
    } catch {
      showToast("Error updating profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const navItems = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "physical", label: "Physical Stats", icon: Activity },
    { id: "subscription", label: "Subscription", icon: CreditCard },
    { id: "security", label: "Security", icon: Lock },
    { id: "settings", label: "Settings", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-slate-900 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          {/* User Card */}
          <Card className="p-6 border-0 shadow-sm text-center bg-white dark:bg-slate-800 dark:border-slate-700 rounded-[20px]">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-50 dark:border-slate-700 shadow-sm">
                <img
                  src={
                    profileImage ||
                    user?.profileImageUrl ||
                    "https://i.pravatar.cc/300"
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white shadow-md hover:bg-blue-700 transition space-x-0 disabled:opacity-50"
              >
                {uploadingImage ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Camera className="h-3 w-3" />
                )}
              </button>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {user?.name || "User"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide mb-1">
              {subscription?.planName || "No Plan"}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {user?.address || ""}
            </p>
          </Card>

          {/* Navigation */}
          <Card className="p-4 border-0 shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700 rounded-[20px] overflow-hidden">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                    activeTab === item.id
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <item.icon
                    className={`h-4 w-4 ${activeTab === item.id ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}
                  />
                  {item.label}
                </button>
              ))}
              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            </nav>
          </Card>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-9">
          {activeTab === "personal" && (
            <Card className="p-6 lg:p-8 border-0 shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700 rounded-[20px]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Personal Information
                </h3>
                <Button
                  variant="ghost"
                  className="text-blue-600 dark:text-blue-400 text-sm font-bold hover:text-blue-700 dark:hover:text-blue-300 p-0 h-auto"
                >
                  Edit Info
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Full Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white focus:bg-white dark:focus:bg-slate-800 transition-all h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Email Address
                  </label>
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white h-11 rounded-xl opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Phone Number
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+1 (555) 000-0000"
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white focus:bg-white dark:focus:bg-slate-800 transition-all h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Date of Birth
                  </label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth?.split("T")[0] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white focus:bg-white dark:focus:bg-slate-800 transition-all h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Gender
                  </label>
                  <Select
                    value={String(formData.gender)}
                    onValueChange={(v) =>
                      setFormData({ ...formData, gender: Number(v) })
                    }
                  >
                    <SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white h-11 rounded-xl">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Not Specified</SelectItem>
                      <SelectItem value="1">Male</SelectItem>
                      <SelectItem value="2">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Location
                  </label>
                  <Input
                    value={formData.address || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="City, Country"
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white focus:bg-white dark:focus:bg-slate-800 transition-all h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <Button
                  variant="outline"
                  className="rounded-xl h-11 px-6 font-bold text-slate-600 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-xl h-11 px-8 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </Card>
          )}

          {activeTab === "physical" && (
            <div className="space-y-6">
              <Card className="p-6 lg:p-8 border-0 shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700 rounded-[20px]">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                  Physical Stats
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-center border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                      Height
                    </p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      182{" "}
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        cm
                      </span>
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-center border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                      Weight
                    </p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                      85{" "}
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        kg
                      </span>
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-center border border-blue-100 dark:border-blue-800">
                    <p className="text-xs font-bold text-blue-400 uppercase mb-1">
                      Goal
                    </p>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                      82{" "}
                      <span className="text-sm font-medium text-blue-400">
                        kg
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-8 space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Medical Conditions / Injuries
                  </label>
                  <textarea
                    className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    rows={4}
                    placeholder="List any injuries or medical conditions..."
                  />
                </div>
              </Card>

              <Card className="p-6 lg:p-8 border-0 shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700 rounded-[20px]">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                  Fitness Goals
                </h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    "Muscle Gain",
                    "Endurance",
                    "Flexibility",
                    "Weight Loss",
                    "Stress Relief",
                    "Strength",
                  ].map((goal) => (
                    <span
                      key={goal}
                      className="px-4 py-2 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                    >
                      {goal}
                    </span>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "subscription" && (
            <Card className="p-6 lg:p-8 border-0 shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700 rounded-[20px] relative overflow-hidden">
              {subLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : subscription ? (
                <>
                  <div className="absolute top-0 right-0 p-32 bg-yellow-400/10 dark:bg-yellow-400/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                        Current Plan
                      </p>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                        {subscription.planName}
                      </h3>
                      {subscription.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                          {subscription.description}
                        </p>
                      )}
                      <div className="flex flex-col gap-2 mt-4">
                        {(() => {
                          try {
                            const features = JSON.parse(
                              subscription.features || "[]",
                            );
                            return (
                              Array.isArray(features) ? features : []
                            ).map((f: string, i: number) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
                              >
                                <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                                <span>{f}</span>
                              </div>
                            ));
                          } catch {
                            return null;
                          }
                        })()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-xl flex items-center justify-center mb-4 ml-auto">
                        <Shield className="h-6 w-6" />
                      </div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">
                        {subscription.price}{" "}
                        <span className="text-sm font-medium text-slate-500">
                          EGP
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                        Status
                      </p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${subscription.status === "Active" ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"}`}
                      >
                        {subscription.status}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                        Days Left
                      </p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">
                        {subscription.daysRemaining}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                        Start Date
                      </p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {new Date(subscription.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                        End Date
                      </p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {new Date(subscription.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    No Active Subscription
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Contact reception to subscribe to a plan.
                  </p>
                </div>
              )}
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="p-6 lg:p-8 border-0 shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700 rounded-[20px]">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                Security & Password
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Min. 6 characters"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Re-enter new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white h-11 rounded-xl"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="bg-slate-900 dark:bg-slate-700 text-white font-bold rounded-xl px-6 h-11 hover:bg-slate-800 dark:hover:bg-slate-600"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-700 bg-red-50/50 dark:bg-red-900/10 -m-6 -mt-0 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-red-600 dark:text-red-400 font-bold mb-1">
                      Delete Account
                    </h4>
                    <p className="text-xs text-red-400 dark:text-red-500">
                      Once you delete your account, there is no going back.
                      Please be certain.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 font-bold rounded-xl"
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "settings" && (
            <Card className="p-6 lg:p-8 border-0 shadow-sm bg-white dark:bg-slate-800 dark:border-slate-700 rounded-[20px]">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                Preferences
              </h3>
              {/* Toggle items */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      Email Notifications
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Receive updates about your progress
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      SMS Reminders
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Get reminders for upcoming sessions
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <ProfileContent />
    </ProtectedRoute>
  );
}
