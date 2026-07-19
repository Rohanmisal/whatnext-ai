export default function Chip({ label }: { label: string }) {
  return <span className="rounded-full border border-outline px-3 py-1 text-xs text-on-surface-variant">{label}</span>
}
