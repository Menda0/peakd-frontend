import { ShakaButton } from "./shaka-button";

export function PostActionsBar({
  jobId,
  shakaCount,
  shakaedByViewer,
}: {
  jobId: string;
  shakaCount: number;
  shakaedByViewer: boolean;
}) {
  return (
    <div className="mt-4 flex items-center gap-6 text-muted-foreground">
      <ShakaButton
        jobId={jobId}
        initialCount={shakaCount}
        initialShakaed={shakaedByViewer}
      />
    </div>
  );
}
