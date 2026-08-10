import { redirect } from 'next/navigation';

/** Merchant Banker Review is not part of the public demo — preserve UI in components/review. */
export default function ReviewPage() {
  redirect('/projects/demo');
}
