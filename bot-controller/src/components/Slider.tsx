'use client'

interface SliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
  leftLabel?: string
  rightLabel?: string
}

export default function Slider({
  value,
  onChange,
  min = 1,
  max = 10,
  label,
  leftLabel,
  rightLabel,
}: SliderProps) {
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">{label}</span>
          <span className="text-sm text-gray-500">{value}/{max}</span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
      />
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  )
}
