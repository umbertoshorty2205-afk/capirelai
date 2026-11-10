import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    {
      name: 'glsl-raw-import',
      transform(code, id) {
        if (id.endsWith('.glsl?raw')) {
          return {
            code: `export default ${JSON.stringify(code)};`,
            map: { mappings: '' },
          };
        }
      },
    },
  ],
});