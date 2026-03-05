"use client";

import { useState, useEffect } from "react";
import { UserRole } from "@/types/gym";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Utensils,
    Flame,
    Droplet,
    PieChart,
    Plus,
    ChevronRight,
    Apple,
    Coffee,
    Moon,
    Sun,
    Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";
import { nutritionPlansApi, mealsApi, type NutritionPlanDto, type MealDto } from "@/lib/api";
import Link from "next/link";

// Map meal type to icon and colors
const getMealTypeStyle = (mealType?: string) => {
    switch (mealType?.toLowerCase()) {
        case 'breakfast':
            return { icon: Sun, iconColor: "text-orange-500", bgColor: "bg-orange-100" };
        case 'lunch':
            return { icon: Sun, iconColor: "text-blue-500", bgColor: "bg-blue-100" };
        case 'dinner':
            return { icon: Moon, iconColor: "text-indigo-500", bgColor: "bg-indigo-100" };
        case 'snack':
            return { icon: Apple, iconColor: "text-green-500", bgColor: "bg-green-100" };
        default:
            return { icon: Utensils, iconColor: "text-slate-500", bgColor: "bg-slate-100" };
    }
};

function NutritionContent() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [activePlan, setActivePlan] = useState<NutritionPlanDto | null>(null);
    const [meals, setMeals] = useState<MealDto[]>([]);

    // Calculate consumed calories from meals
    const consumedCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    const maxCalories = activePlan?.dailyCalories || 2400;
    
    // Calculate macros from plan and consumed
    const macros = {
        protein: {
            current: meals.reduce((sum, meal) => sum + (meal.proteinGrams || 0), 0),
            max: activePlan?.proteinGrams || 180,
            label: "Protein",
            color: "bg-blue-500"
        },
        carbs: {
            current: meals.reduce((sum, meal) => sum + (meal.carbsGrams || 0), 0),
            max: activePlan?.carbsGrams || 300,
            label: "Carbs",
            color: "bg-orange-500"
        },
        fats: {
            current: meals.reduce((sum, meal) => sum + (meal.fatGrams || 0), 0),
            max: activePlan?.fatGrams || 70,
            label: "Fats",
            color: "bg-yellow-500"
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.userId) {
                setIsLoading(false);
                return;
            }

            try {
                // Fetch user's nutrition plans
                const plansResponse = await nutritionPlansApi.getMemberPlans(user.userId);
                if (plansResponse.success && plansResponse.data && plansResponse.data.length > 0) {
                    // Get the active plan or the most recent one
                    const active = plansResponse.data.find(p => p.isActive) || plansResponse.data[0];
                    setActivePlan(active);
                }

                // Fetch available meals
                const mealsResponse = await mealsApi.getActiveMeals();
                if (mealsResponse.success && mealsResponse.data) {
                    setMeals(mealsResponse.data);
                }
            } catch (error) {
                console.error("Failed to fetch nutrition data:", error);
                showToast("Failed to load nutrition data", "error");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user?.userId, showToast]);

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen relative p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8 relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Nutrition Plan</h1>
                        <p className="text-slate-500 mt-1">
                            {activePlan ? activePlan.planName : "Track your macros and stick to your goals."}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/generate-program">
                            <Button variant="outline" className="gap-2">
                                <Utensils className="h-4 w-4" />
                                Generate New Plan
                            </Button>
                        </Link>
                        <Button className="bg-green-500 hover:bg-green-600 gap-2">
                            Grocery List
                        </Button>
                    </div>
                </div>

                {!activePlan ? (
                    <Card className="p-12 text-center border-none shadow-sm bg-white rounded-3xl">
                        <Utensils className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No Nutrition Plan Yet</h3>
                        <p className="text-slate-500 mb-6">
                            Generate a personalized nutrition plan with our AI coach
                        </p>
                        <Link href="/generate-program">
                            <Button className="bg-green-500 hover:bg-green-600">
                                Generate Nutrition Plan
                            </Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Main Stats Card */}
                        <Card className="p-6 lg:col-span-1 border-none shadow-sm bg-white rounded-3xl">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Daily Summary</h3>

                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <div className="text-sm text-slate-500 font-medium">Calories</div>
                                    <div className="text-4xl font-black text-slate-900 mt-1">
                                        {consumedCalories.toLocaleString()} <span className="text-lg text-slate-400 font-normal">/ {maxCalories.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Circular Progress Placeholder */}
                                <div className="relative h-16 w-16 flex items-center justify-center rounded-full border-4 border-slate-100 border-t-green-500">
                                    <Flame className="h-6 w-6 text-green-500" />
                                </div>
                            </div>

                            <div className="space-y-6">
                                {Object.entries(macros).map(([key, data]) => {
                                    const remaining = Math.max(0, data.max - data.current);
                                    const percentage = Math.min(100, Math.round((data.current / data.max) * 100));
                                    return (
                                        <div key={key}>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="font-bold text-slate-700">
                                                    {data.label} <span className="text-slate-400 font-normal">({remaining}g left)</span>
                                                </span>
                                                <span className="font-bold text-blue-600">{percentage}%</span>
                                            </div>
                                            <Progress value={percentage} className={`h-2 ${data.color}`} />
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        {/* Meals List */}
                        <div className="lg:col-span-2 space-y-4">
                            {meals.length === 0 ? (
                                <Card className="p-8 text-center border-slate-100">
                                    <Apple className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                    <h3 className="font-bold text-slate-900 mb-1">No Meals Logged Today</h3>
                                    <p className="text-sm text-slate-500">Start tracking your nutrition by adding meals</p>
                                </Card>
                            ) : (
                                meals.map((meal) => {
                                    const style = getMealTypeStyle(meal.mealType);
                                    return (
                                        <Card key={meal.mealId} className="p-4 flex items-center justify-between border-slate-100 hover:shadow-md transition-shadow group cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-12 w-12 rounded-2xl ${style.bgColor} flex items-center justify-center`}>
                                                    <style.icon className={`h-6 w-6 ${style.iconColor}`} />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">
                                                        {meal.mealType || 'Meal'}
                                                    </div>
                                                    <div className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">
                                                        {meal.name}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-slate-900">{meal.calories || 0} kcal</div>
                                                {(meal.proteinGrams || meal.carbsGrams || meal.fatGrams) && (
                                                    <div className="text-xs text-slate-500">
                                                        P: {meal.proteinGrams || 0}g | C: {meal.carbsGrams || 0}g | F: {meal.fatGrams || 0}g
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })
                            )}

                            <Button variant="outline" className="w-full h-14 border-dashed border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 gap-2 rounded-2xl">
                                <Plus className="h-5 w-5" />
                                Add Snack
                            </Button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default function NutritionPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.Member, UserRole.Coach, UserRole.Admin]}>
            <NutritionContent />
        </ProtectedRoute>
    );
}
