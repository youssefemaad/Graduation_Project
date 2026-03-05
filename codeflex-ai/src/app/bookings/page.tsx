"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import { BookingsView } from "@/components/bookings/BookingsView";

export default function BookingsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Member, UserRole.Coach]}>
      <div className="min-h-screen p-4 md:p-6 lg:p-8">
        <BookingsView showHeader={true} />
      </div>
    </ProtectedRoute>
  );
}
