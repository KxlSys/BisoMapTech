import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

interface DebouncedInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  debounce?: number;
}

export function DebouncedInput({
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
}
