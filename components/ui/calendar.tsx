"use client";

import * as React from "react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import { cn } from "@/lib/utils";
import "react-day-picker/style.css";

export type CalendarProps = DayPickerProps;

function Calendar({ className, ...props }: CalendarProps) {
  return <DayPicker className={cn("p-2 text-zinc-100", className)} {...props} />;
}

export { Calendar };
