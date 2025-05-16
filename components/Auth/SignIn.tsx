import { signIn } from '@/auth';

export default function SignIn() {
	return (
		<form
			action={async () => {
				'use server';
				await signIn('google');
			}}
		>
			<button type="submit">Anmelden mit Google</button>
		</form>
	);
}
