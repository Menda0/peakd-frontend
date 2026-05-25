import type { SuggestedUser } from "@/lib/social-feed-placeholder";
import { SuggestedUserRow } from "./suggested-user-row";

export function SuggestedSection({ users }: { users: SuggestedUser[] }) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-sm font-semibold text-foreground">Suggested for you</h2>
      <div className="flex flex-col">
        {users.map((u) => (
          <SuggestedUserRow key={u.id} user={u} />
        ))}
      </div>
    </section>
  );
}
