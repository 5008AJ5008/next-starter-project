'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

type Props = {
	readyContent?: ReactNode;
	pendingContent?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Eine Absende-Schaltfläche für Formulare, die den Status aus `useFormStatus` berücksichtigt.
 * Zeigt unterschiedlichen Inhalt an, je nachdem, ob das Formular gerade gesendet wird oder nicht.
 * Die Schaltfläche ist während des Sendens deaktiviert.
 *
 * @param {Props} props - Die Eigenschaften für die Schaltfläche.
 * @param {ReactNode} [props.readyContent='Absenden'] - Der Inhalt, der angezeigt wird, wenn das Formular nicht sendet.
 * @param {ReactNode} [props.pendingContent='Warten…'] - Der Inhalt, der angezeigt wird, während das Formular sendet.
 * @param {ButtonHTMLAttributes<HTMLButtonElement>} [props.atts] - Zusätzliche HTML-Attribute für das Button-Element.
 * @returns JSX-Element, das die Absende-Schaltfläche darstellt.
 */
export default function SubmitButton({
	readyContent = 'Absenden',
	pendingContent = 'Warten…',
	...atts
}: Props) {
	const { pending } = useFormStatus();

	return (
		<button type="submit" disabled={pending} {...atts}>
			{pending ? pendingContent : readyContent}
		</button>
	);
}
