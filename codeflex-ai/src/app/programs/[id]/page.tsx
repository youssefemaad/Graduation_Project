"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { workoutPlansApi, type MemberWorkoutPlanDto } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Calendar, Dumbbell, CheckCircle } from "lucide-react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";

type PageProps = { params: Promise<{ id: string }> };

function ProgramDetails({ params }: PageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [plan, setPlan] = useState<MemberWorkoutPlanDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPlan() {
      if (!user?.userId) return;
      try {
        const response = await workoutPlansApi.getMemberPlans(user.userId);
        if (response.success && response.data) {
          const foundPlan = response.data.find(p => p.memberPlanId === Number(id));
          if (foundPlan) {
            setPlan(foundPlan);
          }
        }
      } catch (error) {
        console.error("Failed to fetch plan details", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlan();
  }, [user, id]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-slate-50 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/programs">
            <Button variant="ghost" className="mb-6 gap-2 font-semibold text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Back to Plans
            </Button>
          </Link>
          <Card className="p-12 text-center bg-white border-0 shadow-sm rounded-2xl">
            <Dumbbell className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Plan Not Found</h2>
            <p className="text-slate-500">This workout plan does not exist or you don't have access to it.</p>
          </Card>
        </div>
      </div>
    );
  }

  const progressPercentage = (plan.totalWorkouts ?? 0) > 0
    ? Math.round(((plan.completedWorkouts ?? 0) / (plan.totalWorkouts ?? 1)) * 100)
    : 0;

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-slate-50 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Button */}
        <Link href="/programs">
          <Button variant="ghost" className="gap-2 font-semibold text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Back to Plans
          </Button>
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border-0">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 mb-3">{plan.planName}</h1>
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${plan.status === 1
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-600"
                  }`}>
                  {plan.statusText}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <Card className="p-6 bg-white border-0 shadow-sm rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Progress</h2>
              <p className="text-sm text-slate-500">
                {plan.completedWorkouts} of {plan.totalWorkouts} workouts completed
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-right mt-2 text-sm font-bold text-slate-600">{progressPercentage}%</p>
        </Card>

        {/* Plan Details */}
        <Card className="p-6 bg-white border-0 shadow-sm rounded-2xl">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-blue-600" />
            Plan Details
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-500">Plan Name</span>
              <span className="font-semibold text-slate-900">{plan.planName}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-500">Status</span>
              <span className="font-semibold text-slate-900">{plan.statusText}</span>
            </div>
            {plan.startDate && (
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-500">Start Date</span>
                <span className="font-semibold text-slate-900">
                  {new Date(plan.startDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </span>
              </div>
            )}
            {plan.endDate && (
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-500">End Date</span>
                <span className="font-semibold text-slate-900">
                  {new Date(plan.endDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-3">
              <span className="text-slate-500">Workouts Completed</span>
              <span className="font-semibold text-slate-900 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {plan.completedWorkouts} / {plan.totalWorkouts}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function ProgramDetailsPage({ params }: PageProps) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member]}>
      <ProgramDetails params={params} />
    </ProtectedRoute>
  );
}
