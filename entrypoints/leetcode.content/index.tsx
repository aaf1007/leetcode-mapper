import ReactDOM from 'react-dom/client';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import { getListSlug } from '@/lib/listSlug';
import { App } from './App';
import './styles.css';

export default defineContentScript({
  matches: ['https://leetcode.com/*'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'leetcode-roadmap',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      isolateEvents: true,
      onMount(container) {
        const root = ReactDOM.createRoot(container);
        let href = location.href;
        const render = () => root.render(<App slug={getListSlug(href)} />);
        render();
        // LeetCode is a single-page app. WXT's `wxt:locationchange` relies on the Navigation API's
        // `navigate` event, which doesn't reach this isolated world for LeetCode's client-side
        // navigation, so poll the URL instead.
        ctx.setInterval(() => {
          if (location.href === href) return;
          href = location.href;
          render();
        }, 500);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });
    ui.mount();
  },
});
