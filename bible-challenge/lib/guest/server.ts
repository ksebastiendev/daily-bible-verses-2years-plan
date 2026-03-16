import { cookies, headers } from "next/headers";

const GUEST_HEADER_NAME = "x-bc-device-id";
const GUEST_COOKIE_NAME = "bc_guest_device_id";

export async function resolveGuestDeviceId() {
  const headerStore = await headers();
  const cookieStore = await cookies();

  const headerValue = headerStore.get(GUEST_HEADER_NAME)?.trim();
  if (headerValue) return headerValue;

  const cookieValue = cookieStore.get(GUEST_COOKIE_NAME)?.value?.trim();
  if (cookieValue) return cookieValue;

  return null;
}

export const guestRequestContext = {
  header: GUEST_HEADER_NAME,
  cookie: GUEST_COOKIE_NAME,
};
