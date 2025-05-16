import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

// ESLint Flat-Konfiguration für das Projekt.
// Erweitert die Next.js Core-Web-Vitals und TypeScript-Konfigurationen
// und fügt spezifische Regeln sowie Ignorier-Muster hinzu.
const eslintConfig = [
	...compat.extends('next/core-web-vitals', 'next/typescript'),
	{
		rules: {
			'object-shorthand': 'warn',
			'@next/next/no-img-element': 'off',
			'react/no-unknown-property': ['error', { ignore: [] }],
		},
	},
	{
		ignores: ['node_modules/', '.next/', 'lib/generated/prisma/**'],
	},
];

export default eslintConfig;
