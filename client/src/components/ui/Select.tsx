import { SelectHTMLAttributes, forwardRef } from "react";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ label, error, className = "", children, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-gray-400">{label}</label>}
      <select
        ref={ref}
        {...props}
        className={`bg-gray-900 border ${error ? "border-red-500" : "border-gray-700"} rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 text-sm ${className}`}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
);
