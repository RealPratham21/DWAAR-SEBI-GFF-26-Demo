import { redirect } from 'next/navigation';
import { SME_REGISTER_ROUTE } from '@/lib/auth/constants';

/** Prototype bypass — SME / Company is the only supported onboarding persona. */
export default function RoleSelectionPage() {
  redirect(SME_REGISTER_ROUTE);
}
