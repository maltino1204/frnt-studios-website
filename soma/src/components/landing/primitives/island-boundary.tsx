"use client";

import { Component, type ReactNode } from "react";

/**
 * The error boundary around each chapter island (audit-4 R4-1). If the island throws while it renders or updates
 * (an effect loop included: React #185), React renders `fallback` in its place: the island's static content, rendered
 * on the server, or nothing where the chapter reads without it (rail arrows, step buttons, the place switch). So one
 * island can never reach the root error boundary and blank the whole landing. The failure is logged once.
 */
export class IslandBoundary extends Component<{ name: string; fallback?: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: unknown): void {
    console.error(`[landing] the ${this.props.name} failed; its static content is shown instead`, error);
  }

  render(): ReactNode {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
