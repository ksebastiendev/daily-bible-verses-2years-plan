import SwaggerClient from "./SwaggerClient";

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Bible Challenge API Docs</h1>
          <p className="mt-2 text-sm text-gray-600">Interactive OpenAPI documentation for App Router endpoints.</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <SwaggerClient />
        </div>
      </div>
    </main>
  );
}
