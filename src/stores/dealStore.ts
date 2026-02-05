import { create } from "zustand";

interface DealState {
  activeDealId: string | null;
  activeTab: string;
  checklistFilters: {
    workstream: string | null;
    assignee: string | null;
    status: string | null;
    priority: string | null;
    search: string;
  };
  setActiveDeal: (dealId: string | null) => void;
  setActiveTab: (tab: string) => void;
  setChecklistFilter: (
    key: keyof DealState["checklistFilters"],
    value: string | null
  ) => void;
  resetChecklistFilters: () => void;
}

const defaultFilters = {
  workstream: null,
  assignee: null,
  status: null,
  priority: null,
  search: "",
};

export const useDealStore = create<DealState>((set) => ({
  activeDealId: null,
  activeTab: "checklist",
  checklistFilters: { ...defaultFilters },
  setActiveDeal: (dealId) => set({ activeDealId: dealId }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setChecklistFilter: (key, value) =>
    set((s) => ({
      checklistFilters: { ...s.checklistFilters, [key]: value },
    })),
  resetChecklistFilters: () =>
    set({ checklistFilters: { ...defaultFilters } }),
}));
