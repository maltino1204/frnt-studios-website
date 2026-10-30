"use client";

import { ArrowRight } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { pickInBookingEntry } from "./booking-entry";
import { serviceActionClass } from "./discovery-styles";

/** Preselects a service in the page's booking entry and moves focus there. */
export function ServicePickButton({ categorySlug, serviceId, label, disabled }: { categorySlug: string; serviceId: string; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`${label} auswählen`}
      onClick={() => pickInBookingEntry({ categorySlug, serviceId })}
      className={serviceActionClass}
    >
      Auswählen
      <Icon icon={ArrowRight} size={16} />
    </button>
  );
}
