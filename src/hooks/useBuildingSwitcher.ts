"use client";

import { useBuildingStore } from "@/stores/buildingStore";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

export function useBuildingSwitcher() {
  const { activeBuilding, buildings, setActiveBuilding } = useBuildingStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sync URL param with store
  useEffect(() => {
    const buildingParam = searchParams.get("building");
    if (buildingParam && buildingParam !== activeBuilding) {
      setActiveBuilding(buildingParam);
    }
  }, [searchParams, activeBuilding, setActiveBuilding]);

  const switchBuilding = useCallback(
    (dealId: string | null) => {
      setActiveBuilding(dealId);
      const params = new URLSearchParams(searchParams.toString());
      if (dealId) {
        params.set("building", dealId);
      } else {
        params.delete("building");
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [setActiveBuilding, router, pathname, searchParams]
  );

  const currentBuilding = buildings.find((b) => b.dealId === activeBuilding);

  return {
    activeBuilding,
    buildings,
    currentBuilding,
    switchBuilding,
    isAllBuildings: activeBuilding === "ALL",
  };
}
