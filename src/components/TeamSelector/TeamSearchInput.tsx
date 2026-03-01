import { useEffect, useRef } from 'react';

interface TeamSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TeamSearchInput({ value, onChange }: TeamSearchInputProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <input
      ref={ref}
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Search teams..."
      className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-lg"
    />
  );
}
