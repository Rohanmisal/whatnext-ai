interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export default function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`h-6 w-12 rounded-full p-1 transition-colors ${checked ? 'bg-primary-container' : 'bg-surface-container-highest'}`}
    >
      <div className={`h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : ''}`} />
    </button>
  )
}
