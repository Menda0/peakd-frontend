"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { formInputLgClassName } from "@/lib/form-styles";
import {
  partnerProfileFormSchema,
  type PartnerProfileFormValues,
} from "@/lib/partner-profile-schemas";
import type { PartnerType } from "@/lib/partner-profile";
import { isPartnerType } from "@/lib/partner-profile";
import { cn } from "@/lib/utils";
import { PartnerCountryCombobox } from "./partner-country-combobox";
import { PartnerMarkdownField } from "./partner-markdown-field";

const TYPE_LABELS: Record<PartnerType, string> = {
  videographer: "Videographer",
  coach: "Coach",
  other: "Other",
};

const TYPE_KEYS = Object.keys(TYPE_LABELS) as PartnerType[];

export function PartnerProfileDetailsForm({
  defaultPartnerName,
  displayPicture,
  avatarBusy,
  avatarError,
  onAvatarUpload,
  initialValues,
  saving,
  onSave,
}: {
  defaultPartnerName: string;
  displayPicture: string | null;
  avatarBusy: boolean;
  avatarError: string | null;
  onAvatarUpload: (file: File) => void;
  initialValues: PartnerProfileFormValues;
  saving: boolean;
  onSave: (values: PartnerProfileFormValues) => Promise<void>;
}) {
  const idPrefix = useId();
  const nameId = `${idPrefix}-name`;
  const typeId = `${idPrefix}-type`;
  const countryId = `${idPrefix}-country`;

  const form = useForm<PartnerProfileFormValues>({
    resolver: zodResolver(partnerProfileFormSchema),
    defaultValues: initialValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    form.reset(initialValues);
  }, [initialValues, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    await onSave(values);
  });

  return (
    <Form {...form}>
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-2 sm:w-40">
            <div className="relative size-28 overflow-hidden rounded-full border border-white/15 bg-zinc-800">
              {displayPicture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayPicture} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-xs text-zinc-500">
                  No photo
                </div>
              )}
            </div>
            <Label className="cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                disabled={avatarBusy}
                onChange={(ev) => {
                  const f = ev.target.files?.[0];
                  ev.target.value = "";
                  if (f) onAvatarUpload(f);
                }}
              />
              <span
                className={cn(
                  "inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/10",
                  avatarBusy && "pointer-events-none opacity-50",
                )}
              >
                {avatarBusy ? "Uploading…" : "Change photo"}
              </span>
            </Label>
            {avatarError ? (
              <p className="text-center text-xs text-red-400">{avatarError}</p>
            ) : null}
          </div>

          <div className="min-w-0 flex-1 space-y-5">
            <FormField
              control={form.control}
              name="partnerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-200">Partner name</FormLabel>
                  <FormControl>
                    <Input
                      id={nameId}
                      {...field}
                      placeholder={defaultPartnerName}
                      className={formInputLgClassName}
                    />
                  </FormControl>
                  <p className="text-xs text-zinc-500">
                    Leave blank to use your account name.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
              <FormField
                control={form.control}
                name="partnerType"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel className="text-zinc-200">Type</FormLabel>
                    <FormControl>
                      <Combobox
                        items={TYPE_KEYS}
                        value={field.value}
                        onValueChange={(next) => {
                          if (next != null && isPartnerType(next)) {
                            field.onChange(next);
                          }
                        }}
                        itemToStringValue={(key) => TYPE_LABELS[key]}
                        autoHighlight
                      >
                        <ComboboxInput
                          id={typeId}
                          placeholder="Search type…"
                          className={cn(
                            "h-10 w-full min-h-10 border-white/15 bg-white/5 text-zinc-100 placeholder:text-zinc-500",
                            "focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/25",
                          )}
                        />
                        <ComboboxContent
                          className="border-white/10 bg-[#0a1218] text-zinc-100 ring-white/10"
                          align="start"
                        >
                          <ComboboxEmpty className="text-zinc-500">No matches.</ComboboxEmpty>
                          <ComboboxList>
                            {(key: PartnerType) => (
                              <ComboboxItem
                                key={key}
                                value={key}
                                className="text-zinc-200 data-highlighted:bg-primary/15 data-highlighted:text-zinc-50"
                              >
                                {TYPE_LABELS[key]}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <PartnerCountryCombobox
                      id={countryId}
                      countryCode={field.value}
                      onCountryCodeChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="descriptionMarkdown"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-200">Description</FormLabel>
              <FormControl>
                <PartnerMarkdownField
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end border-t border-white/10 pt-4">
          <Button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
