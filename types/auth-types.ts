// auth-types.ts
export type AuthUserProfile = {
	name?: string | null; // Дозволяємо null або undefined
	email?: string | null; // Дозволяємо null або undefined (навіть якщо поки не використовуєте)
	image?: string | null; // Дозволяємо null або undefined
	// Можливо, id, якщо ви його додаєте в сесію:
	// id?: string;
};
