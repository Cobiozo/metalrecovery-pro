import { useState } from "react";

export type CustomMaterial = {
  id: string;
  name: string;
  au: number;
  ag: number;
  pt: number;
  pd: number;
  notes: string;
  createdAt: string;
};

export type CustomMaterialAsApiMaterial = {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  unit: "kg";
  metalContentPerKg: {
    Au: { min: number; max: number; typical: number };
    Ag: { min: number; max: number; typical: number };
    Pt: { min: number; max: number; typical: number };
    Pd: { min: number; max: number; typical: number };
  };
  notes?: string;
  requiresCleaning?: false;
};

const STORAGE_KEY = "metalrecovery_custom_materials";

function loadFromStorage(): CustomMaterial[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomMaterial[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(mats: CustomMaterial[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mats));
  } catch {
    // quota exceeded or private mode — silently ignore
  }
}

export function toApiMaterial(m: CustomMaterial): CustomMaterialAsApiMaterial {
  return {
    id: m.id,
    name: m.name,
    nameEn: m.name,
    category: "wlasne",
    unit: "kg",
    metalContentPerKg: {
      Au: { min: m.au * 0.7, max: m.au * 1.3, typical: m.au },
      Ag: { min: m.ag * 0.7, max: m.ag * 1.3, typical: m.ag },
      Pt: { min: m.pt * 0.7, max: m.pt * 1.3, typical: m.pt },
      Pd: { min: m.pd * 0.7, max: m.pd * 1.3, typical: m.pd },
    },
    notes: m.notes || undefined,
    requiresCleaning: false,
  };
}

export function getInlineContent(m: CustomMaterial) {
  return { Au: m.au, Ag: m.ag, Pt: m.pt, Pd: m.pd };
}

export function useCustomMaterials() {
  const [materials, setMaterials] = useState<CustomMaterial[]>(loadFromStorage);

  const persist = (mats: CustomMaterial[]) => {
    setMaterials(mats);
    saveToStorage(mats);
  };

  const add = (data: Omit<CustomMaterial, "id" | "createdAt">): CustomMaterial => {
    const mat: CustomMaterial = {
      ...data,
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    persist([...materials, mat]);
    return mat;
  };

  const remove = (id: string) => persist(materials.filter((m) => m.id !== id));

  const update = (id: string, data: Partial<Omit<CustomMaterial, "id" | "createdAt">>) =>
    persist(materials.map((m) => (m.id === id ? { ...m, ...data } : m)));

  const asApiMaterials: CustomMaterialAsApiMaterial[] = materials.map(toApiMaterial);

  return { materials, asApiMaterials, add, remove, update };
}
