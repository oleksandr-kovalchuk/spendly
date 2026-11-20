import { SignOutButton } from "@/features/sign-out/sign-out-button";
import { getCurrentUser } from "@/shared/auth/session";

// The signed-out top bar also shows the 404 page, which a signed-in user can reach
export async function SessionSignOut() {
  const user = await getCurrentUser();

  return user ? <SignOutButton /> : null;
}
