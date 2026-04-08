import Link from "next/link";

export const runtime = "edge";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
      <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">
        404 - Page Not Found
      </h2>
      <p className="mb-8 text-lg text-gray-600">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Return Home
      </Link>
    </div>
  );
}
