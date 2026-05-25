"use client";

import * as React from "react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import { cn } from "@/lib/utils";
import "react-day-picker/style.css";

export type CalendarProps = DayPickerProps;

/** Tighter grid + nav for popovers; aligns with studio accent. */
const compactPickerStyle = {
  "--rdp-day-height": "2rem",
  "--rdp-day-width": "2rem",
  "--rdp-day_button-height": "1.875rem",
  "--rdp-day_button-width": "1.875rem",
  "--rdp-day_button-border-radius": "0.375rem",
  "--rdp-nav-height": "2.25rem",
  "--rdp-nav_button-height": "1.75rem",
  "--rdp-nav_button-width": "1.75rem",
  "--rdp-dropdown-gap": "0.3rem",
  "--rdp-months-gap": "0.75rem",
  "--rdp-weekday-padding": "0.125rem 0",
  "--rdp-accent-color": "#16b8d3",
  "--rdp-accent-background-color": "rgb(38 194 201 / 0.16)",
  "--rdp-today-color": "#5eead4",
  "--rdp-outside-opacity": "0.45",
} as const satisfies Record<string, string>;

function Calendar({ className, style, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn(
        "rdp-compact w-fit max-w-full p-1.5 text-foreground leading-tight tracking-tight",
        className,
      )}
      style={{
        ...compactPickerStyle,
        ...style,
      }}
      {...props}
    />
  );
}

export { Calendar };
