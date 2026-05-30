"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { Dict } from "./types";

const DictContext = createContext<Dict | null>(null);

export function DictProvider({ value, children }: { value: Dict; children: ReactNode }) {
  return <DictContext.Provider value={value}>{children}</DictContext.Provider>;
}

export function useDict(): Dict {
  const d = useContext(DictContext);
  if (!d) throw new Error("useDict must be used inside DictProvider");
  return d;
}
