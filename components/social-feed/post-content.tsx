export function PostContent({
  title,
  description,
  hashtags,
}: {
  title: string;
  description: string;
  hashtags: string[];
}) {
  return (
    <div className="mt-3 space-y-2">
      <h3 className="text-base font-semibold leading-snug text-zinc-100">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
      <p className="flex flex-wrap gap-2 text-sm font-medium text-[#26c2c9]">
        {hashtags.map((h) => (
          <span key={h}>{h}</span>
        ))}
      </p>
    </div>
  );
}
