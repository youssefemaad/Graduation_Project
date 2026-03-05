"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  MailIcon,
  LockIcon,
  AlertCircleIcon,
  UserCircleIcon,
  PhoneIcon,
  CheckCircleIcon,
  UserPlusIcon,
  ShieldIcon,
  UsersIcon,
  CopyIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserRole } from "@/types/gym";

interface CreatedUser {
  email: string;
  name: string;
  role: string;
  tempPassword: string;
}

export default function AdminUsersPage() {
  const { hasRole, adminCreateUser } = useAuth();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [gender, setGender] = useState<number>(0);
  const [selectedRole, setSelectedRole] = useState<'Coach' | 'Receptionist'>('Coach');
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Check if user is admin
  if (!hasRole(UserRole.Admin)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="bg-background rounded-2xl shadow-2xl p-8 text-center border border-border/50">
          <ShieldIcon className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(password);
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setCreatedUser(null);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Valid email is required");
      return;
    }
    if (!tempPassword || tempPassword.length < 6) {
      setError("Temporary password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      await adminCreateUser(email, tempPassword, name, selectedRole, phone, gender);
      
      // Show success with credentials
      setCreatedUser({
        email,
        name,
        role: selectedRole,
        tempPassword
      });

      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setTempPassword("");
      setGender(0);
    } catch (err) {
      console.error("Create user error:", err);
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/20 rounded-lg">
              <UserPlusIcon className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Create Staff Account</h1>
          </div>
          <p className="text-muted-foreground">
            Create accounts for coaches and receptionists. They will be required to change their password on first login.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Form Card */}
          <div className="bg-background rounded-2xl shadow-xl p-6 md:p-8 border border-border/50">
            {/* Role Selection */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block">Select Role</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('Coach')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedRole === 'Coach'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-border hover:border-green-500/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedRole === 'Coach' ? 'bg-green-500/20' : 'bg-muted'
                    }`}>
                      <UsersIcon className={`w-6 h-6 ${selectedRole === 'Coach' ? 'text-green-500' : 'text-muted-foreground'}`} />
                    </div>
                    <span className={`font-medium ${selectedRole === 'Coach' ? 'text-green-500' : 'text-foreground'}`}>
                      Coach
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('Receptionist')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedRole === 'Receptionist'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-border hover:border-purple-500/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedRole === 'Receptionist' ? 'bg-purple-500/20' : 'bg-muted'
                    }`}>
                      <MailIcon className={`w-6 h-6 ${selectedRole === 'Receptionist' ? 'text-purple-500' : 'text-muted-foreground'}`} />
                    </div>
                    <span className={`font-medium ${selectedRole === 'Receptionist' ? 'text-purple-500' : 'text-foreground'}`}>
                      Receptionist
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <div className="relative">
                  <UserCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Gender</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === 0}
                      onChange={() => setGender(0)}
                      className="text-primary"
                    />
                    <span className="text-sm text-foreground">Male</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === 1}
                      onChange={() => setGender(1)}
                      className="text-primary"
                    />
                    <span className="text-sm text-foreground">Female</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tempPassword" className="text-sm font-medium">Temporary Password</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="tempPassword"
                      type="text"
                      placeholder="Enter or generate password"
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateTempPassword}
                    className="h-11"
                  >
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  The user will be required to change this password on first login.
                </p>
              </div>

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
                    Creating Account...
                  </div>
                ) : (
                  <>
                    <UserPlusIcon className="w-5 h-5 mr-2" />
                    Create {selectedRole} Account
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Success Card / Instructions */}
          <div className="space-y-6">
            {createdUser ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircleIcon className="w-8 h-8 text-green-500" />
                  <div>
                    <h3 className="font-semibold text-green-500">Account Created Successfully!</h3>
                    <p className="text-sm text-green-500/80">Share these credentials with the staff member</p>
                  </div>
                </div>

                <div className="space-y-3 bg-background/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="font-medium text-foreground">{createdUser.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Role:</span>
                    <span className={`font-medium ${createdUser.role === 'Coach' ? 'text-green-500' : 'text-purple-500'}`}>
                      {createdUser.role}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{createdUser.email}</span>
                      <button
                        onClick={() => copyToClipboard(createdUser.email, 'email')}
                        className="p-1 hover:bg-muted rounded"
                      >
                        <CopyIcon className={`w-4 h-4 ${copiedField === 'email' ? 'text-green-500' : 'text-muted-foreground'}`} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Temp Password:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded font-mono text-sm">{createdUser.tempPassword}</code>
                      <button
                        onClick={() => copyToClipboard(createdUser.tempPassword, 'password')}
                        className="p-1 hover:bg-muted rounded"
                      >
                        <CopyIcon className={`w-4 h-4 ${copiedField === 'password' ? 'text-green-500' : 'text-muted-foreground'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  The staff member will be prompted to change their password and complete their profile on first login.
                </p>
              </div>
            ) : (
              <div className="bg-background rounded-2xl shadow-xl p-6 border border-border/50">
                <h3 className="font-semibold text-foreground mb-4">How it works</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Create Account</p>
                      <p className="text-sm text-muted-foreground">Fill in the staff member&apos;s details and generate a temporary password</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-primary">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Share Credentials</p>
                      <p className="text-sm text-muted-foreground">Give the email and temporary password to the staff member</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-primary">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">First Login</p>
                      <p className="text-sm text-muted-foreground">Staff member logs in, changes password, and completes their profile</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-background rounded-2xl shadow-xl p-6 border border-border/50">
              <h3 className="font-semibold text-foreground mb-4">Roles Overview</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <UsersIcon className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-foreground">Coach</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Manage clients, create workout plans</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MailIcon className="w-5 h-5 text-purple-500" />
                    <span className="font-medium text-foreground">Receptionist</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Handle check-ins, member registration</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
