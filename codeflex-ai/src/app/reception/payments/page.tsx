import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/gym";
import PaymentsClient from "./PaymentsClient";

export default function ReceptionPaymentsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.Receptionist, UserRole.Admin]}>
      <PaymentsClient />
    </ProtectedRoute>
  );
}
