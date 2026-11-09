import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "@/components/icons";
import { cn } from "@/lib/utils";

/* shadcn/ui Select on Radix, adapted to RTL and the glass popover surface. */
export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;
export const SelectGroup = SelectPrimitive.Group;

export const SelectTrigger = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger ref={ref}
      className={cn("flex h-10 w-full items-center justify-between gap-2 rounded-field border border-input bg-surface px-3 text-start text-[13.5px] transition-colors hover:border-ring/50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-60 data-[placeholder]:text-muted-foreground [&>span]:truncate", className)}
      {...props}>
      {children}
      <SelectPrimitive.Icon asChild><ChevronDown className="size-4 shrink-0 text-muted-foreground" /></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  ),
);
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Content>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>>(
  ({ className, children, position = "popper", ...props }, ref) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content ref={ref} position={position} dir="rtl"
        className={cn("relative z-[80] max-h-72 min-w-[8rem] overflow-hidden rounded-[calc(var(--r-field)+2px)] border border-border bg-popover text-foreground shadow-lift data-[state=open]:animate-fly",
          position === "popper" && "w-[var(--radix-select-trigger-width)] data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1", className)}
        {...props}>
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  ),
);
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Item>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item ref={ref}
      className={cn("relative flex h-9 w-full cursor-pointer select-none items-center rounded-[10px] pe-8 ps-3 text-[13.5px] outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-muted data-[state=checked]:font-bold data-[state=checked]:text-primary data-[disabled]:opacity-50", className)}
      {...props}>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="absolute end-2.5 grid size-4 place-items-center"><SelectPrimitive.ItemIndicator><Check className="size-4" /></SelectPrimitive.ItemIndicator></span>
    </SelectPrimitive.Item>
  ),
);
SelectItem.displayName = "SelectItem";

/** One-line select for forms: value/label pairs in, string out. */
export function SimpleSelect({ value, onChange, options, label, disabled, placeholder = "انتخاب کنید", className }: {
  value: string | number; onChange: (v: string) => void; options: [string | number, string][]; label: string; disabled?: boolean; placeholder?: string; className?: string;
}) {
  const v = value === "" || value === undefined ? undefined : String(value);
  return (
    <Select value={v} onValueChange={onChange} disabled={disabled} dir="rtl">
      <SelectTrigger aria-label={label} className={className}><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map(([k, l]) => <SelectItem key={String(k)} value={String(k)}>{l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
