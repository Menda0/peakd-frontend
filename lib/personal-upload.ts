import { getApiBase } from "@/lib/api";
import type { WaveTypeId } from "@/lib/surf-session-waves";
import type { StudioSessionFormValues } from "@/components/studio/studio-session-form-fields";

export type PersonalUploadResult = {
  sessionId: string;
  jobs: Array<{ jobId: string; status: "processing" }>;
};

export async function createPersonalSession(
  values: StudioSessionFormValues,
): Promise<string> {
  const base = getApiBase();
  const res = await fetch(`${base}/studio/sessions`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      countryCode: values.countryCode,
      regionId: values.regionId,
      spotId: values.spotId,
      sessionDate: values.sessionDate,
      sessionTime: values.sessionTime,
      durationMinutes: values.durationMinutes,
      conditionsRating: values.conditionsRating,
      waveTypes: values.waveTypes as WaveTypeId[],
      sessionKind: "personal",
    }),
  });
  if (!res.ok) {
    throw new Error(await res.text().catch(() => res.statusText));
  }
  const data = (await res.json()) as { sessionId?: string };
  if (!data.sessionId) {
    throw new Error("Invalid response");
  }
  return data.sessionId;
}

export async function uploadPersonalVideo(
  sessionId: string,
  file: File,
): Promise<{ jobId: string; status: "processing" }> {
  const base = getApiBase();
  const fd = new FormData();
  fd.append("file", file);
  fd.append("surfSessionId", sessionId);
  fd.append("uploadSource", "personal");
  const res = await fetch(`${base}/videos/process`, {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `Upload failed (${res.status})`);
  }
  let parsed: { jobId?: string; status?: string } = {};
  if (text) {
    try {
      parsed = JSON.parse(text) as { jobId?: string; status?: string };
    } catch {
      /* ignore */
    }
  }
  if (!parsed.jobId) {
    throw new Error(text || "Invalid upload response");
  }
  return { jobId: parsed.jobId, status: "processing" };
}

export async function uploadPersonalVideos(
  values: StudioSessionFormValues,
  files: File[],
): Promise<PersonalUploadResult> {
  const sessionId = await createPersonalSession(values);
  const jobs: PersonalUploadResult["jobs"] = [];
  for (const file of files) {
    jobs.push(await uploadPersonalVideo(sessionId, file));
  }
  return { sessionId, jobs };
}
