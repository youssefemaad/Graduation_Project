// Gym Management Types

export enum UserRole {
  Member = 'Member',
  Coach = 'Coach',
  Receptionist = 'Receptionist',
  Admin = 'Admin',
}

export enum Gender {
  Male = 'Male',
  Female = 'Female',
}

export interface User {
  userId: number;
  email: string;
  name: string;
  phone?: string;
  dateOfBirth?: string; // Backend uses dateOfBirth instead of age
  gender?: number; // Backend uses 0=Male, 1=Female as number
  role: string; // Backend returns role as string (Member/Coach/Receptionist/Admin)
  profileImageUrl?: string;
  address?: string;
  tokenBalance: number;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  mustChangePassword?: boolean; // True if user must change password on first login
  isFirstLogin?: boolean; // True if user hasn't completed first login setup
}

// Booking Types
export enum BookingStatus {
  Pending = 0,
  Confirmed = 1,
  Completed = 2,
  Cancelled = 3,
  NoShow = 4,
}

export interface Booking {
  bookingId: number; // Backend uses bookingId (camelCase)
  userId: number; // Backend uses userId
  userName?: string; // Backend includes userName
  equipmentId?: number; // Backend uses equipmentId
  equipmentName?: string; // Backend includes equipmentName
  coachId?: number; // Backend uses coachId
  coachName?: string; // Backend includes coachName
  bookingType: string; // Backend includes bookingType (Equipment/Coach/Both)
  startTime: string;
  endTime: string;
  status: BookingStatus;
  statusText?: string; // Backend includes statusText
  tokensCost: number;
  notes?: string; // Backend includes notes
  createdAt: string; // Backend includes createdAt
  checkInTime?: string; // When session started
  checkOutTime?: string; // When session completed
}

// Equipment Types
export enum EquipmentStatus {
  Available = 'Available',
  Occupied = 'Occupied',
  UnderMaintenance = 'UnderMaintenance',
}

export interface Equipment {
  equipmentID: number;
  name: string;
  category: string;
  status: EquipmentStatus;
  location: string;
  lastMaintenanceDate: string;
}

// InBody Types
export interface InBodyMeasurement {
  measurementID: number;
  userID: number;
  measurementDate: string;
  weight: number;
  bodyFatPercentage: number;
  muscleMass: number;
  bmi: number;
  bodyWaterPercentage?: number;
  boneMass?: number;
  visceralFatLevel?: number;
  bmr?: number;
}

// Coach Types
export interface Coach {
  coachID: number;
  userID: number;
  specialization: string;
  certifications: string[];
  experienceYears: number;
  rating: number;
  hourlyRate: number;
}

// Subscription Types
export interface SubscriptionPlan {
  planID: number;
  planName: string;
  price: number;
  durationDays: number;
  description: string;
  features: string[];
  tokensIncluded: number;
  isPopular?: boolean;
}

// Workout Plan Types - Extended for AI generation
export interface WorkoutPlan {
  planId: string;
  userId: string;
  name: string;
  schedule: string[];
  exercises: ExerciseDay[];
  generatedBy: 'ai' | 'coach' | 'manual';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  tokensSpent?: number;
  createdAt: string;
  isActive: boolean;
}

export interface ExerciseDay {
  day: string;
  routines: Routine[];
}

export interface Routine {
  name: string;
  sets: number;
  reps: number;
  duration?: string;
  description?: string;
}

// Nutrition Plan Types - Extended for AI generation
export interface NutritionPlan {
  planId: string;
  userId: string;
  name: string;
  dailyCalories: number;
  meals: Meal[];
  generatedBy: 'ai' | 'coach' | 'manual';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  tokensSpent?: number;
  createdAt: string;
  isActive: boolean;
}

export interface Meal {
  name: string;
  foods: string[];
  calories?: number;
}

// AI Coach Types
export interface AIQueryLog {
  queryID: number;
  userID: number;
  queryText: string;
  responseText: string;
  tokensCost: number;
  queryTimestamp: string;
}

// Token Transaction Types
export enum TransactionType {
  Purchase = 'Purchase',
  Spend = 'Spend',
  Refund = 'Refund',
  Bonus = 'Bonus',
}

export interface TokenTransaction {
  transactionID: number;
  userID: number;
  amount: number;
  transactionType: TransactionType;
  description: string;
  transactionDate: string;
  balanceAfter: number;
}

// Stats Types
export interface MemberStats {
  currentWeight: number;
  bodyFatPercentage: number;
  muscleMass: number;
  bmi: number;
  tokenBalance: number;
  activeWorkoutPlans: number;
  activeNutritionPlans: number;
  upcomingBookings: number;
  completedWorkouts: number;
  totalCaloriesBurned: number;
}

export interface ActivityItem {
  id: number;
  type: 'workout' | 'nutrition' | 'ai' | 'booking' | 'inbody';
  title: string;
  description: string;
  timestamp: string;
}
