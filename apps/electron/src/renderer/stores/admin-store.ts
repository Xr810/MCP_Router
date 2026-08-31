import { create } from "zustand";
import type { AdminStatus } from "@mcp_router/shared";

interface AdminUiState {
  status: AdminStatus | null;
  setStatus: (status: AdminStatus | null) => void;
}

export const useAdminUiStore = create<AdminUiState>((set) => ({
  status: null,
  setStatus: (status) => set({ status }),
}));
