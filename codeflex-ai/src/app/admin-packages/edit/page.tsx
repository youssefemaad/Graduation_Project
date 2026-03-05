"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Trash2,
  Dumbbell,
  Utensils,
  Clock,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import Link from "next/link";
import { useRouter } from "next/navigation";

function EditPackageContent() {
  const router = useRouter();
  const [planName, setPlanName] = useState("Elite Plan");
  const [monthlyPrice, setMonthlyPrice] = useState("199");
  const [annualPrice, setAnnualPrice] = useState("1990");
  const [tokenAllocation, setTokenAllocation] = useState([150]);

  const [features, setFeatures] = useState({
    aiWorkoutGenerator: true,
    nutritionPlanning: true,
    gymAccess: true,
    ptSessions: true,
  });

  const toggleFeature = (feature: keyof typeof features) => {
    setFeatures((prev) => ({ ...prev, [feature]: !prev[feature] }));
  };

  const handleSaveDraft = () => {
    // Save as draft logic
    console.log("Saving draft...");
  };

  const handlePublish = () => {
    // Publish changes logic
    console.log("Publishing changes...");
    router.push("/admin-packages");
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this plan?")) {
      console.log("Deleting plan...");
      router.push("/admin-packages");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin-packages">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <p className="text-sm text-muted-foreground">Membership Plans › Edit Elite Plan</p>
              <h1 className="text-3xl font-bold">Plan Configuration</h1>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSaveDraft}>
              Save Draft
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handlePublish}>
              Publish Changes
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Core Details */}
          <Card className="p-6 border border-border">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600">ℹ️</span>
                </div>
                <h2 className="text-xl font-bold">Core Details</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Plan Name</label>
                  <Input
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="Enter plan name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Monthly Pricing ($)</label>
                    <Input
                      type="number"
                      value={monthlyPrice}
                      onChange={(e) => setMonthlyPrice(e.target.value)}
                      placeholder="199"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Annual Pricing ($)</label>
                    <Input
                      type="number"
                      value={annualPrice}
                      onChange={(e) => setAnnualPrice(e.target.value)}
                      placeholder="1990"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Token Allocation */}
            <Card className="p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600">🎫</span>
                  </div>
                  <h2 className="text-xl font-bold">Token Allocation</h2>
                </div>
                <span className="text-sm font-semibold text-indigo-600">
                  {tokenAllocation[0]} Tokens / Month
                </span>
              </div>

              <div className="space-y-4">
                <Slider
                  value={tokenAllocation}
                  onValueChange={setTokenAllocation}
                  max={500}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0 TOKENS</span>
                  <span>250 TOKENS</span>
                  <span>500 TOKENS</span>
                </div>
              </div>
            </Card>

            {/* Feature Access Matrix */}
            <Card className="p-6 border border-border">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600">⚙️</span>
                </div>
                <h2 className="text-xl font-bold">Feature Access Matrix</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* AI Workout Generator */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Dumbbell className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">AI Workout Generator</p>
                      <p className="text-xs text-muted-foreground">Custom training plans</p>
                    </div>
                  </div>
                  <Switch
                    checked={features.aiWorkoutGenerator}
                    onCheckedChange={() => toggleFeature("aiWorkoutGenerator")}
                  />
                </div>

                {/* Nutrition Planning */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Utensils className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Nutrition Planning</p>
                      <p className="text-xs text-muted-foreground">Macros & meal logs</p>
                    </div>
                  </div>
                  <Switch
                    checked={features.nutritionPlanning}
                    onCheckedChange={() => toggleFeature("nutritionPlanning")}
                  />
                </div>

                {/* 24/7 Access */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold">24/7 Access</p>
                      <p className="text-xs text-muted-foreground">Anytime gym entry</p>
                    </div>
                  </div>
                  <Switch
                    checked={features.gymAccess}
                    onCheckedChange={() => toggleFeature("gymAccess")}
                  />
                </div>

                {/* PT Sessions */}
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold">PT Sessions</p>
                      <p className="text-xs text-muted-foreground">4 sessions / month</p>
                    </div>
                  </div>
                  <Switch
                    checked={features.ptSessions}
                    onCheckedChange={() => toggleFeature("ptSessions")}
                  />
                </div>
              </div>
            </Card>

            {/* Delete Plan */}
            <div className="flex justify-center py-4">
              <Button
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Plan
              </Button>
            </div>
        </div>
      </div>
    </div>
  );
}

export default function EditPackagePage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Admin]}>
      <EditPackageContent />
    </ProtectedRoute>
  );
}
