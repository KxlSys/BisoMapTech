import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";

interface DebouncedInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  debounce?: number;
}

// ⚡ Bolt: Memoize DebouncedInput to prevent re-renders when parent components update state unrelated to this input
export const DebouncedInput = React.memo(function DebouncedInput({
  value,
  onChange,
  debounce = 300,
  ...props
}: DebouncedInputProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync with external value if it changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce the call to external onChange
  useEffect(() => {
    const t = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounce);

    return () => clearTimeout(t);
  }, [localValue, value, onChange, debounce]);

  return (
    <Input
      {...props}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
    />
  );
});
