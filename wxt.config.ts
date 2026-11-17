import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Roadmap for LeetCode',
    description: 'See any LeetCode problem list as a topic roadmap, with your progress per topic.',
    permissions: ['storage'],
  },
});
