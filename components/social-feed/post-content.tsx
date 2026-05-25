export function PostContent({
  title,
  description,
  hashtags,
}: {
  title: string;
  description: string;
  hashtags: string[];
}) {
  const hasDescription = Boolean(description.trim());
  const hasHashtags = hashtags.length > 0;

  return (
    <div className="mt-3 space-y-2">
      <h3 className="text-base font-semibold leading-snug text-foreground">{title}</h3>
      {hasDescription ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {hasHashtags ? (
        <p className="flex flex-wrap gap-2 text-sm font-medium text-primary">
          {hashtags.map((h) => (
            <span key={h}>{h}</span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
