import { Warehouse } from 'lucide-react';

export default function SupplierDashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-card p-10 text-center max-w-md w-full">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
          <Warehouse className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="font-heading font-bold text-2xl text-text-dark mb-2">Supplier Dashboard</h1>
        <p className="text-text-muted text-sm">
          Manage inventory, process incoming stock, and coordinate deliveries to customers.
        </p>
        <div className="mt-6 inline-flex items-center px-4 py-2 rounded-full bg-green-50 text-primary-green text-sm font-medium">
          Coming Soon
        </div>
      </div>
    </div>
  );
}
