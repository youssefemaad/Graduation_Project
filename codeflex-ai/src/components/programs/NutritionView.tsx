"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Utensils,
    CheckCircle,
    Plus,
    Sun,
    Moon
} from "lucide-react";

interface DailyDiet {
    calories: { current: number; target: number };
    protein: { current: number; target: number };
    carbs: { current: number; target: number };
    fats: { current: number; target: number };
    meals: Meal[];
}

interface Meal {
    id: string;
    type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
    name: string;
    calories: number;
    icon: any;
}

export function NutritionView() {
    const [todayDiet, setTodayDiet] = useState<DailyDiet>({
        calories: { current: 1850, target: 2400 },
        protein: { current: 160, target: 180 },
        carbs: { current: 210, target: 300 },
        fats: { current: 45, target: 70 },
        meals: [
            { id: "m-1", type: "Breakfast", name: "Oatmeal w/ Berries & Nut Butter", calories: 450, icon: Sun },
            { id: "m-2", type: "Lunch", name: "Grilled Chicken Salad", calories: 620, icon: Sun },
            { id: "m-3", type: "Dinner", name: "Salmon & Asparagus", calories: 580, icon: Moon }
        ]
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-xl text-green-600">
                        <Utensils className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Diet Plan</h2>
                </div>
                <Button variant="ghost" className="text-green-600 font-bold text-sm h-8 gap-2 hover:bg-green-50">
                    <CheckCircle className="h-4 w-4" /> Grocery List
                </Button>
            </div>

            <Card className="p-6 border-none shadow-sm bg-white/80 backdrop-blur-sm rounded-[32px] h-fit">

                {/* Calories Ring Section */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">CALORIES</div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-slate-900">{todayDiet.calories.current.toLocaleString()}</span>
                            <span className="text-lg text-slate-400 font-medium">/ {todayDiet.calories.target.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="relative h-16 w-16">
                        <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                            <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                            <path className="text-green-500" strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>

                {/* Macros */}
                <div className="space-y-4 mb-8">
                    <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                            <span className="text-slate-700">Protein ({todayDiet.protein.target - todayDiet.protein.current}g left)</span>
                            <span className="text-blue-500">{Math.round((todayDiet.protein.current / todayDiet.protein.target) * 100)}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[90%] rounded-full"></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                            <span className="text-slate-700">Carbs ({todayDiet.carbs.target - todayDiet.carbs.current}g left)</span>
                            <span className="text-orange-500">{Math.round((todayDiet.carbs.current / todayDiet.carbs.target) * 100)}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 w-[60%] rounded-full"></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                            <span className="text-slate-700">Fats ({todayDiet.fats.target - todayDiet.fats.current}g left)</span>
                            <span className="text-yellow-500">{Math.round((todayDiet.fats.current / todayDiet.fats.target) * 100)}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 w-[30%] rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* Meals List */}
                <div className="space-y-3">
                    {todayDiet.meals.map((meal) => (
                        <div key={meal.id} className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all">
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${meal.type === 'Dinner' ? 'bg-indigo-50 text-indigo-500' : 'bg-orange-50 text-orange-500'
                                }`}>
                                <meal.icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">{meal.type}</div>
                                <h4 className="font-bold text-slate-900 text-sm truncate">{meal.name}</h4>
                            </div>
                            <div className="font-bold text-slate-600 text-sm whitespace-nowrap">{meal.calories} kcal</div>
                        </div>
                    ))}

                    <Button variant="outline" className="w-full h-12 border-dashed border-2 border-slate-200 text-slate-400 font-bold hover:bg-slate-50 hover:border-slate-300 rounded-xl mt-2">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Snack
                    </Button>
                </div>
            </Card>
        </div>
    );
}
