import { SharedSessionView } from "@/components/share/shared-session-view";
import { fetchPublicSharedSession } from "@/lib/shared-session";

export default async function SharedSessionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let data;
  try {
    data = await fetchPublicSharedSession(token);
  } catch {
    return (
      <main className="min-h-screen bg-[#050a0f] text-zinc-100">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-zinc-500">
            This shared session could not be loaded. Try again later.
          </p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#050a0f] text-zinc-100">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-xl font-semibold">Session not found</h1>
          <p className="mt-2 text-sm text-zinc-500">
            This link may be invalid or sharing was removed.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050a0f] text-zinc-100">
      <SharedSessionView data={data} />
    </main>
  );
}
