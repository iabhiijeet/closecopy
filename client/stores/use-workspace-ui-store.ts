"use client";

import { create } from "zustand";

export type WorkspacePanel = "sources" | "chat" | "artifacts";

type WorkspaceUiState = {
  activePanel: WorkspacePanel;
  setActivePanel: (panel: WorkspacePanel) => void;
};

export const useWorkspaceUiStore = create<WorkspaceUiState>()((set) => ({
  activePanel: "chat",
  setActivePanel: (activePanel) => set({ activePanel }),
}));
