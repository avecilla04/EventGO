import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, LocateFixed, Globe2, ChevronDown, Loader2, Search, Check } from "lucide-react";
import { normalizeText, prettyCity } from "@/lib/geo";

/** Texto del botón según la ubicación elegida. */
export const locationLabel = (location) => {
  if (location.mode === "near") return location.city ? `Cerca de mí · ${location.city}` : "Cerca de mí";
  if (location.mode === "city") return location.city;
  return "Todas las ciudades";
};

/**
 * Selector de ubicación: "Cerca de mí", "Todas las ciudades" o una ciudad
 * (de la lista de ciudades con planes o escrita a mano, p. ej. para un viaje).
 */
export default function LocationPicker({ location, cities, onChange, onNearMe, locating }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setQuery("");
    setActive(0);
    setTimeout(() => inputRef.current?.focus(), 0);
    const onClick = (e) => rootRef.current && !rootRef.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Opciones visibles: atajos + ciudades que coinciden + "buscar X" si no está en la lista.
  const options = useMemo(() => {
    const q = normalizeText(query);
    const list = [];
    if (!q) {
      list.push({ key: "near", label: "Cerca de mí", hint: "Ordena por distancia", Icon: LocateFixed });
      list.push({ key: "all", label: "Todas las ciudades", Icon: Globe2 });
    }
    const matching = cities.filter((c) => normalizeText(c.name).includes(q));
    matching.forEach((c) =>
      list.push({ key: `city:${c.name}`, city: c.name, label: c.name, hint: `${c.count} ${c.count === 1 ? "plan" : "planes"}`, Icon: MapPin })
    );
    if (q && !cities.some((c) => normalizeText(c.name) === q)) {
      const typed = prettyCity(query);
      list.push({ key: `city:${typed}`, city: typed, label: `Ver planes en «${typed}»`, Icon: Search });
    }
    return list;
  }, [query, cities]);

  const choose = (opt) => {
    setOpen(false);
    if (opt.key === "near") onNearMe();
    else if (opt.key === "all") onChange({ mode: "all" });
    else onChange({ mode: "city", city: opt.city });
  };

  const onInputKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && options[active]) {
      e.preventDefault();
      choose(options[active]);
    }
  };

  const isSelected = (opt) =>
    (opt.key === "near" && location.mode === "near") ||
    (opt.key === "all" && location.mode === "all") ||
    (opt.city && location.mode === "city" && normalizeText(opt.city) === normalizeText(location.city));

  const ButtonIcon = location.mode === "near" ? LocateFixed : location.mode === "all" ? Globe2 : MapPin;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={locating}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Ubicación: ${locationLabel(location)}`}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition hover:bg-canvas"
      >
        {locating ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-accent" /> : <ButtonIcon className="h-5 w-5 shrink-0 text-accent" />}
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-muted">Dónde</span>
          <span className="block truncate text-sm font-semibold text-ink">{locating ? "Buscando tu ubicación..." : locationLabel(location)}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-[min(22rem,calc(100vw-3rem))] overflow-hidden rounded-2xl border border-line bg-white text-ink shadow-lift animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center gap-2 border-b border-line px-4">
            <Search className="h-4 w-4 text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onInputKey}
              placeholder="Busca una ciudad"
              aria-label="Busca una ciudad"
              className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted"
            />
          </div>
          <ul role="listbox" className="max-h-72 overflow-y-auto p-1.5">
            {options.map((opt, i) => (
              <li key={opt.key} role="option" aria-selected={isSelected(opt)}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(opt)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    i === active ? "bg-canvas" : ""
                  }`}
                >
                  <opt.Icon className={`h-4 w-4 shrink-0 ${opt.key === "near" ? "text-accent" : "text-muted"}`} />
                  <span className="min-w-0 flex-1 truncate font-medium">{opt.label}</span>
                  {opt.hint && <span className="shrink-0 text-xs text-muted">{opt.hint}</span>}
                  {isSelected(opt) && <Check className="h-4 w-4 shrink-0 text-accent" />}
                </button>
              </li>
            ))}
            {options.length === 0 && <li className="px-3 py-4 text-sm text-muted">Escribe el nombre de una ciudad.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
