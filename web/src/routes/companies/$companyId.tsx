import { createFileRoute } from '@tanstack/react-router';
import { CompanyDetail } from '@/components/companies/CompanyDetail';

export const Route = createFileRoute('/companies/$companyId')({
  component: CompanyDetailPage
});

function CompanyDetailPage() {
  const { companyId } = Route.useParams();
  return <CompanyDetail companyId={companyId} />;
}
