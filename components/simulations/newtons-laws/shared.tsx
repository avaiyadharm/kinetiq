"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ClickableValueProps {
  value: number;
  label: string;
  unit: string;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  colorClass?: string;
}

export const ClickableValue: React.FC<ClickableValueProps> = ({ 
  value, 
  label, 
  unit, 
  min, 
  max, 
  step = 1, 
  onChange,
  colorClass = "text-white"
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    let val = parseFloat(inputValue);
    if (isNaN(val)) val = value;
    val = Math.max(min, Math.min(max, val));
    onChange(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setInputValue(value.toString());
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center mb-1">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</label>
        <div 
          onClick={() => setIsEditing(true)}
          className={cn(
            "cursor-pointer hover:bg-white/5 px-2 py-0.5 rounded transition-colors font-mono font-bold text-sm",
            colorClass
          )}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none w-16 text-right"
            />
          ) : (
            <span>{value} {unit}</span>
          )}
        </div>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn(
          "w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer",
          colorClass.includes("periwinkle") || colorClass.includes("3b82f6") ? "accent-[#3b82f6]" : "accent-[#ff85a2]"
        )}
      />
    </div>
  );
};
