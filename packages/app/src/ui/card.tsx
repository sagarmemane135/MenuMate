import React from "react";
import { cn } from "../utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border border-slate-200 bg-white shadow-md hover:shadow-lg transition-shadow duration-200",
          className
        )}
        {...props}
      >
        {(title || description) && (
          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
            {title && (
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            )}
            {description && (
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            )}
          </div>
        )}
        <div className={title || description ? "p-6" : "p-6"}>
          {children}
        </div>
      </div>
    );
  }
);

Card.displayName = "Card";


