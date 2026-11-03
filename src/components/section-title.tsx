/** A homepage section's h2. */
export function SectionTitle({
  text,
  className,
  id,
}: {
  text: string;
  className: string;
  id?: string;
}) {
  return (
    <h2 className={className} id={id}>
      {text}
    </h2>
  );
}
