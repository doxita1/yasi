// Bind requests from this page to the account that originally opened it.
// The Sites gateway remains the sole authority for authentication.
let pageOwner;
export async function accountFetch(input, init = {}) {
  const url = new URL(
    input instanceof Request ? input.url : input,
    location.href,
  );
  if (url.origin !== location.origin || !url.pathname.startsWith("/api/"))
    return globalThis.fetch(input, init);
  const session = url.pathname === "/api/session";
  const headers = new Headers(
    init.headers || (input instanceof Request ? input.headers : undefined),
  );
  if (!session && pageOwner) headers.set("X-Yasi-Account", pageOwner);
  const response = await globalThis.fetch(input, { ...init, headers });
  if (session && response.ok && pageOwner === undefined) {
    const identity = await response.clone().json();
    pageOwner = identity.authenticated ? identity.userId : null;
  }
  return response;
}
