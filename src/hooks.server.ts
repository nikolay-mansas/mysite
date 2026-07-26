import type { Handle } from "@sveltejs/kit";
import { paraglideMiddleware } from "$lib/paraglide/server";

// Runs during prerendering too: sets the active locale from the URL so each
// localized route (e.g. /ru) is rendered as static HTML in its own language.
export const handle: Handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, ({ request, locale }) => {
    event.request = request;
    return resolve(event, {
      transformPageChunk: ({ html }) =>
        html.replace("%paraglide.lang%", locale),
    });
  });
