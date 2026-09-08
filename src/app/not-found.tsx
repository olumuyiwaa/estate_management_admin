import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
        Page not found
      </p>
      <Link
        href="/dashboard"
        className="mt-6 px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
