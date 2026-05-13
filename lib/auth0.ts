import { Auth0Client, filterDefaultIdTokenClaims } from "@auth0/nextjs-auth0/server";
import type { BeforeSessionSavedHook } from "@auth0/nextjs-auth0/types";
import { computeIsPartnerForSession } from "@/lib/auth0-partner";

const audience = process.env.AUTH0_AUDIENCE;

const beforeSessionSaved: BeforeSessionSavedHook = async (session) => {
  const isPartner = await computeIsPartnerForSession(session);
  return {
    ...session,
    user: {
      ...filterDefaultIdTokenClaims(session.user),
      ...(isPartner ? { isPartner: true as const } : {}),
    },
  };
};

export const auth0 = new Auth0Client({
  beforeSessionSaved,
  ...(audience
    ? {
        authorizationParameters: {
          audience,
          scope: "openid profile email offline_access",
        },
      }
    : {}),
});
