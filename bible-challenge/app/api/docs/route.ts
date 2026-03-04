import { getOpenApiSpec } from "@/src/lib/openapi";

export async function GET(request: Request) {
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const host = request.headers.get("host");
  const baseUrl = host ? `${proto}://${host}` : undefined;

  return Response.json(getOpenApiSpec(baseUrl), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
