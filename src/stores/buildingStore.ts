import { create } from "zustand";

interface BuildingState {
  activeBuilding: string | null; // dealId or "ALL"
  buildings: Array<{
    dealId: string;
    name: string;
    city: string;
    state: string;
    facilityType: string;
    progress: number;
    blockedCount: number;
    teamCount: number;
  }>;
  setActiveBuilding: (dealId: string | null) => void;
  setBuildings: (buildings: BuildingState["buildings"]) => void;
}

export const useBuildingStore = create<BuildingState>((set) => ({
  activeBuilding: null,
  buildings: [],
  setActiveBuilding: (dealId) => set({ activeBuilding: dealId }),
  setBuildings: (buildings) => set({ buildings }),
}));
