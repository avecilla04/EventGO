import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	build: {
		rollupOptions: {
			output: {
				// Separa las librerías grandes para que el navegador las cachee entre despliegues.
				manualChunks: {
					react: ['react', 'react-dom', 'react-router-dom'],
					motion: ['framer-motion'],
					supabase: ['@supabase/supabase-js'],
				},
			},
		},
	},
});
