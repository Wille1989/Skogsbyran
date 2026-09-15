import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { PassThrough } from "node:stream";
import { build } from "esbuild";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { renderToPipeableStream, renderToString } from "react-dom/server";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
const stateKey = "__skogsbyranAuthTest";
const slug = "test-entry-0123456789";

// Exercise real routes/components/hooks with isolated session responses. No Maps or API requests.
const result = await build({
    stdin: {
        contents: `export { default as App } from '@/app/App'; export { useAuth } from '@/modules/auth/data/auth.hooks'; export { QueryClient, QueryClientProvider } from '@tanstack/react-query';`,
        resolveDir: root,
    },
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    packages: "external",
    alias: { "@": root + "src" },
    loader: { ".css": "empty" },
    define: { "import.meta.env": `globalThis.${stateKey}.env` },
    plugins: [{
        name: "isolated-auth",
        setup(builder) {
            for (const pkg of ["react-router-dom", "@tanstack/react-query"]) {
                builder.onResolve({ filter: new RegExp("^" + pkg + "$") }, () => ({ path: pkg, namespace: "auth-test" }));
            }
            builder.onResolve({ filter: /^test-real-/ }, args => ({ path: require.resolve(args.path.slice(10)), external: true }));
            builder.onResolve({ filter: /authService$/ }, () => ({ path: "service", namespace: "auth-test" }));
            builder.onResolve({ filter: /(?:LocationEditor|EditableAreas)(?:\.tsx)?$/ }, () => ({ path: "maps", namespace: "auth-test" }));
            builder.onLoad({ filter: /.*/, namespace: "auth-test" }, ({ path }) => {
                const state = `globalThis.${stateKey}`;
                if (path === "maps") return { contents: "export const LocationEditor = () => null; export const EditableAreas = () => null;" };
                if (path === "service") return { contents: `export function AuthService() { return { getCurrentUser: async () => ${state}.user, loginUser: async () => { ${state}.user = {isAdmin:true}; }, logoutUser: async () => { ${state}.user = null; } }; }` };
                if (path === "react-router-dom") return { contents: `export * from 'test-real-react-router-dom'; import React from 'test-real-react'; export function Navigate({to}) { return React.createElement('span', {'data-redirect':to}); } export function useNavigate() { return (to, options) => ${state}.navigations.push({to, options}); }` };
                return { contents: `export * from 'test-real-@tanstack/react-query'; import { QueryClient as Base } from 'test-real-@tanstack/react-query'; export class QueryClient extends Base { constructor() { super({defaultOptions:{queries:{retry:false, staleTime:Infinity}}}); this.setQueryData(['auth','currentUser'], ${state}.user); this.setQueryData(['properties'], {properties:[]}); } }` };
            });
        },
    }],
});

function load(user, loginSlug) {
    globalThis[stateKey] = { user, navigations: [], env: { DEV: true, VITE_ADMIN_LOGIN_SLUG: loginSlug } };
    const module = { exports: {} };
    new Function("require", "module", "exports", result.outputFiles[0].text)(require, module, module.exports);
    return module.exports;
}

async function page(path, user = null, loginSlug) {
    if (arguments.length < 3) loginSlug = slug;
    const { App } = load(user, loginSlug);
    return new Promise((resolve, reject) => {
        let html = "";
        const destination = new PassThrough();
        destination.on("data", chunk => { html += chunk; });
        destination.on("end", () => resolve(html));
        const stream = renderToPipeableStream(React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(App)), {
            onAllReady() { stream.pipe(destination); },
            onError: reject,
        });
    });
}

test("only the configured entry renders the login form", async () => {
    assert.match(await page(`/admin/${slug}`), /name="password"/);
    for (const path of ["/login", "/dashboard", "/dashboard/property/create", "/dashboard/property/edit/1", "/admin/wrong-slug", `/admin/${slug.toUpperCase()}`]) {
        const html = await page(path);
        assert.match(html, /Sidan hittades inte/);
        assert.ok(!html.includes('name="password"'));
        assert.ok(!html.includes(slug));
    }
});

test("missing or invalid config cannot create a public login route", async () => {
    for (const value of [undefined, "", "properties", "../login", "invalid/segment"]) {
        assert.ok(!(await page(`/admin/${slug}`, null, value)).includes('name="password"'));
    }
});

test("existing admin session goes straight to overview; guests cannot discover the entry through protected routes", async () => {
    assert.match(await page(`/admin/${slug}`, { isAdmin: true }), /data-redirect="\/admin"/);
    for (const user of [null, { isAdmin: false }]) {
        for (const path of ["/admin", "/admin/properties"]) {
            const html = await page(path, user);
            assert.match(html, /data-redirect="\/"/);
            assert.ok(!html.includes(slug));
        }
    }
});

test("public pages have a return control only for admins, and overview offers the website link", async () => {
    for (const user of [null, { isAdmin: false }, { isAdmin: true }]) {
        for (const path of ["/", "/om-oss"]) {
            const html = await page(path, user);
            assert.equal(html.includes("Tillbaka till admin"), user?.isAdmin === true);
            assert.ok(!html.includes('href="/login"'));
            assert.ok(!html.includes(slug));
            if (user?.isAdmin) assert.match(html, /class="admin-return-control" href="\/admin"/);
        }
    }
    const admin = await page("/admin", { isAdmin: true });
    assert.match(admin, /Visa webbplatsen/);
    assert.match(admin, /href="\/"/);
});

test("login and logout reuse the session service and update navigation/cache", async () => {
    const { useAuth, QueryClient, QueryClientProvider } = load(null);
    const client = new QueryClient();
    let auth;
    function Probe() { auth = useAuth(); return null; }
    renderToString(React.createElement(QueryClientProvider, { client }, React.createElement(Probe)));
    await auth.onLogin({ preventDefault() {} });
    assert.equal(client.getQueryData(["auth", "currentUser"]).isAdmin, true);
    assert.deepEqual(globalThis[stateKey].navigations.at(-1), { to: "/admin", options: { replace: true } });
    await auth.onLogout();
    assert.equal(client.getQueryData(["auth", "currentUser"]), null);
    assert.deepEqual(globalThis[stateKey].navigations.at(-1), { to: "/", options: { replace: true } });
});
