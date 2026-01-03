import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">
          Restaurant not found or inactive
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}




