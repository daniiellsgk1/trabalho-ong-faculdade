const ImpactaSPA = (() => {
    const ROUTES = {
        "index.html": {
            title: "Impacta ONG | Plataforma de Impacto Social",
        },
        "projetos.html": {
            title: "Projetos sociais | Impacta ONG",
        },
        "cadastro.html": {
            title: "Cadastro | Impacta ONG",
        },
    };

    const TemplateStore = (() => {
        const cache = new Map();

        const store = (name, html, metadata = {}) => {
            const template = document.createElement("template");
            template.innerHTML = html.trim();
            cache.set(name, { template, metadata });
        };

        const get = (name) => cache.get(name);

        const has = (name) => cache.has(name);

        const render = (name) => {
            const entry = cache.get(name);
            if (!entry) {
                return null;
            }
            return {
                fragment: entry.template.content.cloneNode(true),
                metadata: entry.metadata,
            };
        };

        return {
            store,
            has,
            get,
            render,
        };
    })();

    const getBasePath = () => {
        const parts = window.location.pathname.split("/");
        parts.pop();
        return `${parts.join("/") || ""}/`;
    };

    const normalizeRoute = (path) => {
        if (!path) {
            return "index.html";
        }
        const cleaned = path.split("/").pop();
        if (!cleaned || cleaned === "") {
            return "index.html";
        }
        return ROUTES[cleaned] ? cleaned : "index.html";
    };

    const parseLinkRoute = (href) => {
        if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) {
            return null;
        }

        if (href.startsWith("#")) {
            return {
                route: normalizeRoute(window.location.pathname),
                hash: href,
            };
        }

        let url;
        try {
            url = new URL(href, window.location.href);
        } catch {
            return null;
        }

        if (url.origin !== window.location.origin) {
            return null;
        }

        const route = normalizeRoute(url.pathname);
        const hash = url.hash || "";

        if (!ROUTES[route]) {
            return null;
        }

        return { route, hash };
    };

    const setActiveNavigation = (route, hash = "") => {
        const navItems = document.querySelectorAll(".primary-nav__item");
        navItems.forEach((item) => item.classList.remove("is-active"));

        const allNavLinks = document.querySelectorAll(".primary-nav__link, .primary-nav__submenu-link");
        allNavLinks.forEach((link) => {
            const descriptor = parseLinkRoute(link.getAttribute("href"));
            if (!descriptor) {
                link.removeAttribute("aria-current");
                return;
            }

            const isSameRoute = descriptor.route === route;
            const isSameHash = descriptor.hash === hash && hash !== "";
            const parentItem = link.closest(".primary-nav__item");

            if (isSameRoute && parentItem) {
                parentItem.classList.add("is-active");
            }

            if (isSameRoute && (!descriptor.hash || descriptor.hash === hash)) {
                link.setAttribute("aria-current", isSameHash ? "true" : "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    };

    const showLoading = (container) => {
        container.classList.add("is-loading");
        container.setAttribute("aria-busy", "true");
    };

    const hideLoading = (container) => {
        container.classList.remove("is-loading");
        container.removeAttribute("aria-busy");
    };

    const handleHashScroll = (hash) => {
        if (!hash) {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        const targetId = hash.replace("#", "");
        const target = document.getElementById(targetId);
        if (target) {
            target.scrollIntoView({ behavior: "smooth" });
            target.focus?.({ preventScroll: true });
        }
    };

    const fetchRouteTemplate = async (route) => {
        if (TemplateStore.has(route)) {
            return TemplateStore.render(route);
        }

        const response = await fetch(route, { headers: { "X-Requested-With": "spa" } });
        if (!response.ok) {
            throw new Error(`Falha ao carregar ${route}`);
        }

        const html = await response.text();
        const parser = new DOMParser();
        const documentFetched = parser.parseFromString(html, "text/html");
        const mainFetched = documentFetched.querySelector("#conteudo");
        const templateHtml = mainFetched ? mainFetched.innerHTML : "<p>Conteúdo temporariamente indisponível.</p>";
        TemplateStore.store(route, templateHtml, { title: documentFetched.title });

        return TemplateStore.render(route);
    };

    const persistLastRoute = (route, hash = "") => {
        try {
            const payload = JSON.stringify({ route, hash });
            localStorage.setItem("impacta:lastRoute", payload);
        } catch {
            /* armazenamento indisponível */
        }
    };

    const readPersistedRoute = () => {
        try {
            const payload = localStorage.getItem("impacta:lastRoute");
            if (!payload) {
                return null;
            }
            return JSON.parse(payload);
        } catch {
            return null;
        }
    };

    const mountView = async (container, route, hash = "", options = { pushState: true }) => {
        showLoading(container);
        try {
            const rendered = await fetchRouteTemplate(route);
            if (!rendered) {
                throw new Error(`Template não encontrado para ${route}`);
            }

            container.replaceChildren(rendered.fragment);

            const metadataTitle = rendered.metadata?.title || ROUTES[route]?.title;
            if (metadataTitle) {
                document.title = metadataTitle;
            }

            hideLoading(container);
            setActiveNavigation(route, hash);
            persistLastRoute(route, hash);

            if (options.pushState) {
                const basePath = getBasePath();
                const url = `${basePath}${route}${hash || ""}`;
                history.pushState({ route, hash }, "", url);
            }

            if (window.ImpactaApp?.afterViewChange) {
                window.ImpactaApp.afterViewChange(container);
            }

            handleHashScroll(hash);
        } catch (error) {
            console.error(error);
            hideLoading(container);
            if (window.ImpactaApp?.createToast) {
                window.ImpactaApp.createToast("Não foi possível carregar esta seção. Tente novamente em instantes.", "error");
            }
        }
    };

    const interceptClicks = (container) => {
        document.addEventListener("click", (event) => {
            const link = event.target.closest("a");
            if (!link) {
                return;
            }

            if (link.hasAttribute("download") || link.getAttribute("target") === "_blank" || link.dataset.external === "true") {
                return;
            }

            const descriptor = parseLinkRoute(link.getAttribute("href"));
            if (!descriptor) {
                return;
            }

            if (descriptor.hash && descriptor.route === normalizeRoute(window.location.pathname)) {
                setActiveNavigation(descriptor.route, descriptor.hash);
                handleHashScroll(descriptor.hash);
                return;
            }

            event.preventDefault();
            mountView(container, descriptor.route, descriptor.hash);
        });
    };

    const bindPopState = (container) => {
        window.addEventListener("popstate", (event) => {
            const state = event.state || {};
            const route = state.route || normalizeRoute(window.location.pathname);
            const hash = state.hash || window.location.hash;
            mountView(container, route, hash, { pushState: false });
        });
    };

    const initialise = () => {
        const container = document.getElementById("conteudo");
        if (!container) {
            return;
        }

        const currentRoute = normalizeRoute(window.location.pathname);
        const currentHash = window.location.hash || "";

        TemplateStore.store(currentRoute, container.innerHTML, { title: document.title });

        if (window.ImpactaApp?.afterViewChange) {
            window.ImpactaApp.afterViewChange(container);
        }

        setActiveNavigation(currentRoute, currentHash);
        history.replaceState({ route: currentRoute, hash: currentHash }, "", window.location.href);

        interceptClicks(container);
        bindPopState(container);

        const persisted = readPersistedRoute();
        if (persisted && persisted.route !== currentRoute) {
            mountView(container, persisted.route, persisted.hash || "", { pushState: true });
        } else {
            handleHashScroll(currentHash);
        }
    };

    return {
        start() {
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", initialise, { once: true });
            } else {
                initialise();
            }
        },
    };
})();

if (window.ImpactaApp) {
    ImpactaSPA.start();
} else {
    window.addEventListener("impacta:ready", () => ImpactaSPA.start(), { once: true });
}
