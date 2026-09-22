import * as React from "react";
import { Info } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive: "text-destructive bg-destructive/5 border-destructive/30 [&>svg]:text-current",
        // Neutral heads-up — a fact worth knowing, nothing to act on or worry about.
        info: "text-blue-800 bg-blue-50 border-blue-200 [&>svg]:text-current dark:text-blue-200 dark:bg-blue-950 dark:border-blue-900",
        // Worth reading before proceeding — something to attend to, not an error.
        warning:
          "text-amber-800 bg-amber-50 border-amber-200 [&>svg]:text-current dark:text-amber-200 dark:bg-amber-950 dark:border-amber-900",
        // Confirms something completed as intended.
        success:
          "text-green-800 bg-green-50 border-green-200 [&>svg]:text-current dark:text-green-200 dark:bg-green-950 dark:border-green-900",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

/** An info alert reads as one flowing sentence — icon, then the title
 * (bold) running straight into the description — rather than a bold
 * title stacked above a separate line of body text. destructive/warning/
 * success/default alerts keep the usual stacked title+description
 * layout untouched.
 *
 * AlertTitle/AlertDescription are still passed exactly as before at every
 * call site — this reads their `children` directly off the element props
 * (no rendering trick, no context) and composes them into one paragraph,
 * so no call site needs to change. */
function Alert({
  className,
  variant,
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  if (variant === "info") {
    const items = React.Children.toArray(children);
    const titleEl = items.find(
      (child): child is React.ReactElement<{ children?: React.ReactNode }> =>
        React.isValidElement(child) && child.type === AlertTitle,
    );
    const descriptionEl = items.find(
      (child): child is React.ReactElement<{ children?: React.ReactNode }> =>
        React.isValidElement(child) && child.type === AlertDescription,
    );
    const rest = items.filter((child) => child !== titleEl && child !== descriptionEl);

    return (
      <div
        data-slot="alert"
        role="alert"
        className={cn(alertVariants({ variant }), "flex items-start gap-3", className)}
        {...props}
      >
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-current" />
        <div className="flex-1 space-y-1">
          <p className="leading-relaxed">
            {titleEl ? <span className="font-medium">{titleEl.props.children} </span> : null}
            {descriptionEl?.props.children}
          </p>
          {rest}
        </div>
      </div>
    );
  }

  return (
    <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="alert-title" className={cn("col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight", className)} {...props} />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
