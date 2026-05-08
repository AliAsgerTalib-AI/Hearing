import React from "react";
import { cn } from "../../lib/utils";

export const Card = ({ children, className, ...props }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("glass-card rounded-[2rem] p-6 shadow-sm", className)} {...props}>
    {children}
  </div>
);

export const Button = ({ 
  children, 
  onClick, 
  className, 
  variant = 'primary',
  disabled
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}) => {
  const styles = {
    primary: "btn-primary shadow-lg shadow-primary/20",
    secondary: "bg-white text-primary border border-slate-200 h-14 rounded-full px-8 font-medium transition-transform active:scale-95",
    ghost: "bg-transparent text-slate-500 hover:text-primary h-14 rounded-full px-8 font-medium transition-transform active:scale-95",
  };

  return (
    <button 
      disabled={disabled}
      onClick={onClick} 
      className={cn(styles[variant], "disabled:opacity-50 disabled:active:scale-100", className)}
    >
      {children}
    </button>
  );
};
