"use client";

import { useState } from "react";
import { type MemberWorkoutPlanDto } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dumbbell,
    CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types for the detailed view
interface DailyWorkout {
    id: string;
    title: string;
    duration: string;
    status: "pending" | "completed";
    exercises: Exercise[];
}

interface Exercise {
    id: string;
    name: string;
    muscle: string;
    sets: number;
    reps: string;
    completed: boolean;
    image?: string;
}

// Temporary icon component wrapper
function Brain(props: any) {
    return <div {...props}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" /><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" /><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" /><path d="M17.599 6.5a3 3 0 0 0 .399-1.375" /><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" /><path d="M3.477 10.896a4 4 0 0 1 .585-.396" /><path d="M19.938 10.5a4 4 0 0 1 .585.396" /><path d="M6 18a4 4 0 0 1-1.97-3.465" /><path d="M19.97 14.535A4 4 0 0 1 18 18" /></svg></div>
}

export function WorkoutView({ activePlan }: { activePlan: MemberWorkoutPlanDto | null }) {
    // Mock data for the specific "Today" view
    const [todayWorkout, setTodayWorkout] = useState<DailyWorkout>({
        id: "wo-1",
        title: activePlan?.planName || "Upper Body Power", // Use plan name or default
        duration: "45-60 min",
        status: "pending",
        exercises: [
            { id: "ex-1", name: "Barbell Bench Press", muscle: "Chest, Triceps • Barbell", sets: 3, reps: "8-10 Reps", completed: true, image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100&h=100&fit=crop" },
            { id: "ex-2", name: "Weighted Pull-Ups", muscle: "Back, Biceps • Bodyweight", sets: 3, reps: "6-8 Reps", completed: true, image: "https://images.unsplash.com/photo-1598971639058-211a73287750?w=100&h=100&fit=crop" },
            { id: "ex-3", name: "Seated DB Shoulder Press", muscle: "Shoulders • Dumbbell", sets: 3, reps: "10-12 Reps", completed: false, image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop" },
            { id: "ex-4", name: "Incline DB Curl", muscle: "Biceps • Dumbbell", sets: 3, reps: "12-15 Reps", completed: false, image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=100&h=100&fit=crop" }
        ]
    });

    const toggleExercise = (id: string) => {
        setTodayWorkout(prev => ({
            ...prev,
            exercises: prev.exercises.map(ex =>
                ex.id === id ? { ...ex, completed: !ex.completed } : ex
            )
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                        <Dumbbell className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Workout Plan</h2>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" className="text-slate-500 font-bold text-sm h-8 hover:bg-slate-100">History</Button>
                    <Button variant="ghost" className="text-blue-600 font-bold text-sm h-8 bg-blue-50 hover:bg-blue-100 rounded-lg">Edit</Button>
                </div>
            </div>

            <Card className="p-6 border-none shadow-sm bg-white/80 backdrop-blur-sm rounded-[32px]">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900">{todayWorkout.title}</h3>
                        <p className="text-slate-500 text-sm mt-1">Estimated Duration: {todayWorkout.duration}</p>
                    </div>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                        Pending
                    </span>
                </div>

                {/* Coach Insight */}
                <div className="bg-slate-50 p-4 rounded-2xl flex gap-4 mb-8">
                    <div className="h-10 w-10 flex-shrink-0 bg-[#111827] rounded-full flex items-center justify-center">
                        <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm mb-1">Coach Insight</h4>
                        <p className="text-slate-500 text-xs leading-relaxed">
                            Focus on explosive concentric movements today. Keep rest periods strictly under 90 seconds to maintain intensity.
                        </p>
                    </div>
                </div>

                {/* Exercises List */}
                <div className="space-y-3">
                    {todayWorkout.exercises.map((exercise) => (
                        <div key={exercise.id} className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all group">
                            <div className="h-14 w-14 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                                <img src={exercise.image} className="w-full h-full object-cover mix-blend-multiply opacity-80" alt={exercise.name} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 text-sm truncate">{exercise.name}</h4>
                                <p className="text-xs text-slate-500 truncate">{exercise.muscle}</p>
                            </div>
                            <div className="text-right mr-2 hidden sm:block">
                                <div className="font-bold text-slate-900 text-sm">{exercise.sets} Sets</div>
                                <div className="text-xs text-slate-500">{exercise.reps}</div>
                            </div>
                            <button
                                onClick={() => toggleExercise(exercise.id)}
                                className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all",
                                    exercise.completed
                                        ? 'bg-slate-100 border-slate-200 text-slate-900'
                                        : 'border-slate-200 text-transparent hover:border-blue-500'
                                )}
                            >
                                <CheckCircle className={cn("h-5 w-5", exercise.completed ? 'opacity-100' : 'opacity-0')} />
                            </button>
                        </div>
                    ))}
                </div>

            </Card>
        </div>
    );
}
