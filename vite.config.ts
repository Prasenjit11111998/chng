import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import path from 'path';
import { execSync } from 'child_process';

// Get source commit or set default
let commitHash = process.env.SOURCE_COMMIT
	? process.env.SOURCE_COMMIT.substring(0, 7)
	: "unknown";

if (commitHash === "unknown") {
	try {
		commitHash = execSync("git rev-parse --short HEAD").toString().trim();
	} catch (e) {
		console.warn(`Could not determine Git commit hash: ${e}`);
		commitHash = "unknown";
	}
}

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const plugins = [
    react(),
    topLevelAwait()
  ];

  if (command === 'serve') {
    plugins.unshift(wasm());
  }

  return {
    plugins,
    resolve: {
      alias: {
        '$lib': path.resolve(__dirname, './src/lib'),
        '@': path.resolve(__dirname, './src'),
      },
    },
    worker: {
      plugins: () => [wasm(), topLevelAwait()],
      format: "es",
    },
    optimizeDeps: {
      exclude: ["@ffmpeg/core-mt", "@ffmpeg/ffmpeg", "@ffmpeg/util"],
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern",
        } as any,
      },
    },
    build: {
      target: "esnext",
    },
    define: {
      __COMMIT_HASH__: JSON.stringify(commitHash),
    },
  };
});
