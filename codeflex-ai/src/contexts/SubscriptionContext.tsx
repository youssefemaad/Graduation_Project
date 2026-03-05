"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import {
  subscriptionApi,
  type UserSubscriptionDetailsDto,
} from "@/lib/api/subscription";

interface SubscriptionContextType {
  subscription: UserSubscriptionDetailsDto | null;
  isLoading: boolean;
  /** User can book equipment (all plans) */
  hasEquipmentAccess: boolean;
  /** User has AI features: AI Coach, AI Workout Generator, Generate Program */
  hasAiAccess: boolean;
  /** User can book coaches and get coach plan reviews */
  hasCoachAccess: boolean;
  /** Check if user has a specific feature by keyword (case-insensitive) */
  hasFeature: (keyword: string) => boolean;
  /** Refresh subscription data from server */
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

/** Parse the features JSON string into an array of strings */
function parseFeatures(features?: string | null): string[] {
  if (!features) return [];
  try {
    const parsed = JSON.parse(features);
    return Array.isArray(parsed)
      ? parsed.map((f: string) => f.toLowerCase())
      : [];
  } catch {
    return [];
  }
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] =
    useState<UserSubscriptionDetailsDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSubscription = async () => {
    if (!user?.userId) {
      setSubscription(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await subscriptionApi.getUserSubscription(user.userId);
      if (response.success && response.data) {
        setSubscription(response.data);
      } else {
        setSubscription(null);
      }
    } catch {
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const features = parseFeatures(subscription?.features);

  const hasFeature = (keyword: string): boolean => {
    const kw = keyword.toLowerCase();
    return features.some((f) => f.includes(kw));
  };

  // All active subscriptions can book equipment
  const hasEquipmentAccess = subscription?.status === "Active";

  // AI access: features containing "ai" keyword
  const hasAiAccess =
    subscription?.status === "Active" &&
    (hasFeature("ai") || hasFeature("generate program"));

  // Coach access: features explicitly containing "coach booking" or "coach plan review"
  // Note: "AI Coach" should NOT grant coach access — only real coach booking does
  const hasCoachAccess =
    subscription?.status === "Active" &&
    features.some(
      (f) =>
        f === "coach booking" ||
        f === "coach plan review" ||
        f === "personal training",
    );

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        hasEquipmentAccess,
        hasAiAccess,
        hasCoachAccess,
        hasFeature,
        refreshSubscription: fetchSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
}
