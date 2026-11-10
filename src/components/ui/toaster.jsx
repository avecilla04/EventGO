import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';

// El tipo se deduce de la clase que ya usan las llamadas a toast().
const KINDS = {
	'success-toast': { Icon: CheckCircle2, color: 'text-emerald-500' },
	'error-toast': { Icon: AlertCircle, color: 'text-red-500' },
	'info-toast': { Icon: Info, color: 'text-accent' },
};

// Quita emojis iniciales ("✅ Evento creado" -> "Evento creado"): el icono ya informa.
const clean = (text) =>
	typeof text === 'string' ? text.replace(/^[\p{Extended_Pictographic}️‍\s]+/u, '') : text;

export function Toaster() {
	const { toasts } = useToast();

	return (
		<ToastProvider>
			{toasts.map(({ id, title, description, action, dismiss, className, ...props }) => {
				const kind = KINDS[className] || KINDS['info-toast'];
				return (
					<Toast key={id} {...props} onOpenChange={(open) => !open && dismiss()}>
						<kind.Icon className={`mt-0.5 h-5 w-5 shrink-0 ${kind.color}`} />
						<div className="grid gap-0.5">
							{title && <ToastTitle>{clean(title)}</ToastTitle>}
							{description && <ToastDescription>{description}</ToastDescription>}
						</div>
						{action}
						<ToastClose />
					</Toast>
				);
			})}
			<ToastViewport />
		</ToastProvider>
	);
}
