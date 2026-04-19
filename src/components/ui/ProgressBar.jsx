export default function ProgressBar({ value }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-primary/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-purple transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}
