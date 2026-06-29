"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { filtrerVilles, labelVille, trouverVille, VILLES } from "@/lib/villes";

interface VilleSelectProps {
  id?: string;
  value: string;
  onChange: (label: string) => void;
  placeholder?: string;
  className?: string;
}

export function VilleSelect({
  id,
  value,
  onChange,
  placeholder = "Rechercher une ville…",
  className = "devis-input",
}: VilleSelectProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const listId = `${inputId}-list`;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const options = useMemo(() => filtrerVilles(query), [query]);

  function selectVille(label: string) {
    onChange(label);
    setQuery(label);
    setOpen(false);
  }

  function handleBlur() {
    window.setTimeout(() => {
      setOpen(false);
      const match = trouverVille(query);
      if (match) {
        onChange(match.label);
        setQuery(match.label);
      } else if (value) {
        setQuery(value);
      } else {
        setQuery("");
      }
    }, 150);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        list={listId}
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          const match = trouverVille(e.target.value);
          if (match && normaliser(match.label) === normaliser(e.target.value)) {
            onChange(match.label);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && options[0]) {
            e.preventDefault();
            selectVille(options[0].label);
          }
          if (e.key === "Escape") setOpen(false);
        }}
      />

      <datalist id={listId}>
        {VILLES.map((v) => (
          <option key={v.key} value={v.label} />
        ))}
      </datalist>

      {open && options.length > 0 && (
        <ul
          id={`${listId}-dropdown`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {options.map((v) => (
            <li key={v.key} role="option">
              <button
                type="button"
                className={`w-full px-3 py-2 text-left text-sm transition hover:bg-violet-50 ${
                  labelVille(value) === v.label
                    ? "bg-violet-50 font-medium text-[var(--color-wizard)]"
                    : "text-slate-700"
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectVille(v.label)}
              >
                {v.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function normaliser(nom: string): string {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
