import { HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean;
}

export function Card({ padding = true, className = "", children, ...props }: Props) {
  return (
    <div
      {...props}
      className={`bg-gray-900 border border-gray-800 rounded-xl ${padding ? "p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
