import { Minus, Plus } from "lucide-react";

interface QuantityStepperProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
}

export default function QuantityStepper({ quantity, onChange, min = 0 }: QuantityStepperProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, quantity - 1))}
        className="h-12 w-12 flex items-center justify-center rounded-xl bg-neutral-800 text-white active:scale-[0.98] transition"
        aria-label="Decrease quantity"
      >
        <Minus size={18} />
      </button>
      <span className="w-8 text-center text-white font-semibold text-lg">{quantity}</span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        className="h-12 w-12 flex items-center justify-center rounded-xl bg-neutral-800 text-white active:scale-[0.98] transition"
        aria-label="Increase quantity"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}
