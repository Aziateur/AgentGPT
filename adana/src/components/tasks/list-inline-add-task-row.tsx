"use client";

import * as React from "react";
import { Plus } from "lucide-react";

interface InlineAddTaskRowProps {
  onCreate: (title: string) => void;
  placeholder?: string;
}

export function InlineAddTaskRow({ onCreate, placeholder = "Add task..." }: InlineAddTaskRowProps) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  function commit() {
    if (value.trim()) onCreate(value.trim());
    setValue("");
    setEditing(false);
  }

  return (
    <div
      className="flex items-center gap-3 px-5 py-2 cursor-text border-b border-gray-100 hover:bg-gray-50"
      onClick={() => setEditing(true)}
    >
      <Plus className="h-3.5 w-3.5 text-gray-400" />
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              setValue("");
              setEditing(false);
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
        />
      ) : (
        <span className="text-sm text-gray-400">{placeholder}</span>
      )}
    </div>
  );
}
