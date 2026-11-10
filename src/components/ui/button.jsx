import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import React from 'react';

const buttonVariants = cva(
	'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
	{
		variants: {
			variant: {
				default: 'bg-accent text-white shadow-glow hover:bg-accent-hover',
				dark: 'bg-ink text-white hover:bg-ink-soft',
				outline: 'border border-line bg-white text-ink hover:border-ink/20 hover:bg-canvas',
				ghost: 'text-ink hover:bg-ink/5',
				danger: 'border border-line bg-white text-red-600 hover:border-red-200 hover:bg-red-50',
			},
			size: {
				default: 'px-5 py-2.5 text-sm',
				sm: 'px-3.5 py-1.5 text-xs',
				lg: 'px-7 py-3.5 text-base',
				icon: 'h-10 w-10',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	const Comp = asChild ? Slot : 'button';
	return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
