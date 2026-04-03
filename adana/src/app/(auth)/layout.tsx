export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Branding */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-200">
            A
          </div>
          <span className="text-2xl font-bold text-gray-900">Adana</span>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Manage work, align teams, and hit deadlines.
        </p>
      </div>

      {/* Content */}
      <div className="w-full max-w-md">
        {children}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-400">
        <p>&copy; 2026 Adana. All rights reserved.</p>
      </div>
    </div>
  );
}
