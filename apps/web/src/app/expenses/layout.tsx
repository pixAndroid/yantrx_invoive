import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function ExpensesLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
