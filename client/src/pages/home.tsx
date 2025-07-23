import { Building2 } from "lucide-react";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Home</h1>
            <p className="text-gray-600">Welcome to Action Track</p>
          </div>
        </div>
      </div>

      {/* Blank content area for now */}
      <div className="text-center py-12">
        <p className="text-gray-500">Home page content coming soon...</p>
      </div>
    </div>
  );
}