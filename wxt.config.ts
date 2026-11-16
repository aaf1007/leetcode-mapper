import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'LeetCode Roadmap',
    description: 'Turn any LeetCode problem list into a NeetCode-style topic roadmap',
    permissions: ['storage'],
  },
});
