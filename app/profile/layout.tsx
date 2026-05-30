import { UserProfileProvider } from "@/components/user-profile/user-profile-provider";
import { auth0 } from "@/lib/auth0";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();
  const u = session?.user;
  const givenName =
    u &&
    typeof u === "object" &&
    "given_name" in u &&
    typeof (u as { given_name?: unknown }).given_name === "string"
      ? (u as { given_name: string }).given_name
      : undefined;

  return (
    <UserProfileProvider
      auth0User={{
        name: u?.name ?? undefined,
        given_name: givenName,
        email: u?.email ?? undefined,
        picture:
          u &&
          typeof u === "object" &&
          "picture" in u &&
          typeof (u as { picture?: unknown }).picture === "string"
            ? (u as { picture: string }).picture
            : undefined,
      }}
    >
      {children}
    </UserProfileProvider>
  );
}
