(() => {
    const ImpactaApp = window.ImpactaApp || {};
    const focusableSelectors = [
        "a[href]",
        "button:not([disabled])",
        "textarea:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "[tabindex]:not([tabindex='-1'])",
    ].join(",");

    const mobileMediaQuery = window.matchMedia("(max-width: 960px)");
    let activeModal = null;
    let lastFocusedElement = null;
    let navInitialized = false;
    let escapeListenerAttached = false;

    const yearPlaceholder = document.getElementById("ano-atual");
    if (yearPlaceholder) {
        yearPlaceholder.textContent = new Date().getFullYear();
    }

    const skipLink = document.querySelector(".skip-link");
    if (skipLink) {
        skipLink.addEventListener("click", () => skipLink.classList.remove("is-visible"));
        skipLink.addEventListener("focus", () => skipLink.classList.add("is-visible"));
        skipLink.addEventListener("blur", () => skipLink.classList.remove("is-visible"));
    }

    const ensureToastStack = () => {
        let stack = document.querySelector(".toast-stack");
        if (!stack) {
            stack = document.createElement("div");
            stack.className = "toast-stack";
            stack.setAttribute("aria-live", "polite");
            stack.setAttribute("aria-atomic", "true");
            document.body.appendChild(stack);
        }
        return stack;
    };

    const createToast = (message, variant = "info") => {
        const stack = ensureToastStack();
        const toast = document.createElement("div");
        toast.className = `toast toast--${variant}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button type="button" class="toast__close" aria-label="Fechar notificação">&times;</button>
        `;

        const removeToast = () => {
            toast.style.animation = "toast-out 0.25s forwards";
            toast.addEventListener("animationend", () => toast.remove(), { once: true });
        };

        const closeButton = toast.querySelector(".toast__close");
        if (closeButton) {
            closeButton.addEventListener("click", removeToast, { once: true });
        }

        stack.appendChild(toast);
        setTimeout(removeToast, 5000);
    };

    const initNavigation = () => {
        if (navInitialized) {
            return;
        }

        const navToggle = document.querySelector(".nav-toggle");
        const primaryNav = document.getElementById("primary-navigation");
        if (!navToggle || !primaryNav) {
            return;
        }

        const dropdownTriggers = Array.from(primaryNav.querySelectorAll(".primary-nav__trigger"));

        const closeAllSubmenus = (exception) => {
            dropdownTriggers.forEach((trigger) => {
                if (trigger === exception) {
                    return;
                }
                trigger.setAttribute("aria-expanded", "false");
                const item = trigger.closest(".primary-nav__item");
                if (item) {
                    item.classList.remove("is-open");
                }
            });
        };

        const setNavState = (expanded) => {
            navToggle.setAttribute("aria-expanded", String(expanded));
            primaryNav.classList.toggle("is-open", expanded);
            document.body.classList.toggle("nav-open", expanded);

            const toggleLabel = navToggle.querySelector(".sr-only");
            if (toggleLabel) {
                toggleLabel.textContent = expanded ? "Fechar menu" : "Abrir menu";
            }

            if (mobileMediaQuery.matches) {
                primaryNav.setAttribute("aria-hidden", String(!expanded));
            } else {
                primaryNav.removeAttribute("aria-hidden");
                document.body.classList.remove("nav-open");
            }

            if (!expanded) {
                closeAllSubmenus();
            }
        };

        const closeNav = () => setNavState(false);

        const syncNavForViewport = () => {
            if (mobileMediaQuery.matches) {
                primaryNav.setAttribute("aria-hidden", "true");
                setNavState(false);
            } else {
                primaryNav.removeAttribute("aria-hidden");
                setNavState(false);
            }
        };

        navToggle.addEventListener("click", () => {
            const isExpanded = navToggle.getAttribute("aria-expanded") === "true";
            setNavState(!isExpanded);
        });

        mobileMediaQuery.addEventListener("change", syncNavForViewport);
        syncNavForViewport();

        const navLinks = primaryNav.querySelectorAll("a");
        navLinks.forEach((link) => {
            link.addEventListener("click", () => {
                if (mobileMediaQuery.matches) {
                    closeNav();
                }
            });
        });

        dropdownTriggers.forEach((trigger) => {
            const parentItem = trigger.closest(".primary-nav__item");
            const controls = trigger.getAttribute("aria-controls");
            const submenu = controls ? document.getElementById(controls) : null;

            trigger.addEventListener("click", () => {
                const isExpanded = trigger.getAttribute("aria-expanded") === "true";
                closeAllSubmenus(isExpanded ? null : trigger);

                const nextState = !isExpanded;
                trigger.setAttribute("aria-expanded", String(nextState));
                if (parentItem) {
                    parentItem.classList.toggle("is-open", nextState);
                }

                if (nextState && submenu && mobileMediaQuery.matches) {
                    const firstLink = submenu.querySelector("a");
                    if (firstLink) {
                        firstLink.focus();
                    }
                }
            });
        });

        document.addEventListener("click", (event) => {
            const target = event.target;
            if (navToggle.contains(target)) {
                return;
            }
            if (primaryNav.contains(target)) {
                return;
            }

            closeAllSubmenus();
            if (mobileMediaQuery.matches && document.body.classList.contains("nav-open")) {
                closeNav();
            }
        });

        primaryNav.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeAllSubmenus();
                if (mobileMediaQuery.matches && document.body.classList.contains("nav-open")) {
                    closeNav();
                    navToggle.focus();
                }
            }
        });

        navInitialized = true;
    };

    const openModal = (modal) => {
        if (!modal) {
            return;
        }
        lastFocusedElement = document.activeElement;
        modal.classList.add("is-open");
        modal.removeAttribute("hidden");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
        activeModal = modal;

        const focusableElements = modal.querySelectorAll(focusableSelectors);
        if (focusableElements.length) {
            focusableElements[0].focus();
        } else {
            modal.focus();
        }
    };

    const closeModal = (modal) => {
        if (!modal) {
            return;
        }

        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        modal.setAttribute("hidden", "");
        document.body.classList.remove("modal-open");

        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
        activeModal = null;
        lastFocusedElement = null;
    };

    const watchEscapeKey = () => {
        if (escapeListenerAttached) {
            return;
        }
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && activeModal) {
                closeModal(activeModal);
            }
        });
        escapeListenerAttached = true;
    };

    const bindModalTriggers = (root = document) => {
        const openers = root.querySelectorAll("[data-modal-open]");
        openers.forEach((trigger) => {
            if (trigger.dataset.modalBound === "true") {
                return;
            }
            const targetSelector = trigger.getAttribute("data-modal-open");
            trigger.addEventListener("click", (event) => {
                event.preventDefault();
                const modal = document.querySelector(targetSelector);
                openModal(modal);
            });
            trigger.dataset.modalBound = "true";
        });

        const closers = root.querySelectorAll("[data-modal-close]");
        closers.forEach((button) => {
            if (button.dataset.modalCloseBound === "true") {
                return;
            }
            button.addEventListener("click", () => closeModal(button.closest(".modal")));
            button.dataset.modalCloseBound = "true";
        });

        const modals = root.querySelectorAll(".modal");
        modals.forEach((modal) => {
            if (modal.dataset.modalOutsideBound === "true") {
                return;
            }
            modal.addEventListener("click", (event) => {
                if (event.target === modal) {
                    closeModal(modal);
                }
            });
            modal.dataset.modalOutsideBound = "true";
        });

        watchEscapeKey();
    };

    const bindToastTriggers = (root = document) => {
        const triggers = root.querySelectorAll("[data-toast-trigger]");
        triggers.forEach((button) => {
            if (button.dataset.toastBound === "true") {
                return;
            }
            button.addEventListener("click", () => {
                const message = button.getAttribute("data-toast-message") || "Notificação enviada.";
                const variant = button.getAttribute("data-toast-variant") || "info";
                createToast(message, variant);
            });
            button.dataset.toastBound = "true";
        });
    };

    const computeStorageKey = (form) => {
        if (form.dataset.storageKey) {
            return form.dataset.storageKey;
        }
        if (form.id) {
            return `impacta:form:${form.id}`;
        }
        const closestSection = form.closest("section[id]");
        if (closestSection) {
            return `impacta:form:${closestSection.id}`;
        }
        return `impacta:form:${Array.from(document.querySelectorAll(".form")).indexOf(form)}`;
    };

    const persistFormData = (form, key) => {
        try {
            const payload = {};
            Array.from(form.elements).forEach((field) => {
                if (!field.name) {
                    return;
                }

                if (field.type === "checkbox") {
                    payload[field.name] = field.checked;
                } else if (field.type === "radio") {
                    if (!payload[field.name]) {
                        payload[field.name] = null;
                    }
                    if (field.checked) {
                        payload[field.name] = field.value;
                    }
                } else {
                    payload[field.name] = field.value;
                }
            });
            localStorage.setItem(key, JSON.stringify(payload));
        } catch {
            /* armazenamento não disponível */
        }
    };

    const restoreFormData = (form, key, fields) => {
        try {
            const payload = localStorage.getItem(key);
            if (!payload) {
                return;
            }
            const data = JSON.parse(payload);
            fields.forEach((field) => {
                if (!field.name || !(field.name in data)) {
                    return;
                }
                const value = data[field.name];
                if (field.type === "checkbox") {
                    field.checked = Boolean(value);
                } else if (field.type === "radio") {
                    field.checked = field.value === value;
                } else {
                    field.value = value;
                }
            });
        } catch {
            /* leitura ignorada */
        }
    };

    const clearFormData = (key) => {
        try {
            localStorage.removeItem(key);
        } catch {
            /* nada a remover */
        }
    };

    const updateFieldState = (field, touched = false) => {
        if (touched) {
            field.dataset.touched = "true";
        }

        const hasBeenTouched = touched || field.dataset.touched === "true";
        const group = field.closest(".form__group");
        if (!group) {
            return;
        }

        const feedback = group.querySelector(".form__feedback");
        const isValid = field.checkValidity();
        const hasValue = field.value && field.value.trim() !== "";

        field.setAttribute("aria-invalid", String(!isValid));
        group.classList.toggle("is-invalid", !isValid && hasBeenTouched);
        group.classList.toggle("is-valid", isValid && hasValue);

        if (!feedback) {
            return;
        }

        if (!hasBeenTouched) {
            feedback.textContent = "";
        } else if (!isValid) {
            feedback.textContent = field.validationMessage;
        } else if (hasValue) {
            feedback.textContent = "Tudo certo!";
        } else {
            feedback.textContent = "";
        }
    };

    const bindForm = (form) => {
        if (form.dataset.formBound === "true") {
            return;
        }

        const fields = Array.from(form.querySelectorAll("input, select, textarea"));
        const storageKey = computeStorageKey(form);

        restoreFormData(form, storageKey, fields);

        fields.forEach((field) => {
            if (!field.hasAttribute("aria-invalid")) {
                field.setAttribute("aria-invalid", "false");
            }

            field.addEventListener("blur", () => updateFieldState(field, true));
            field.addEventListener("input", () => {
                updateFieldState(field);
                persistFormData(form, storageKey);
            });
            field.addEventListener("change", () => {
                updateFieldState(field);
                persistFormData(form, storageKey);
            });
        });

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            let isValidForm = true;

            fields.forEach((field) => {
                updateFieldState(field, true);
                if (!field.checkValidity()) {
                    isValidForm = false;
                }
            });

            if (!isValidForm) {
                createToast("Revise os campos destacados antes de enviar.", "error");
                const firstInvalid = fields.find((field) => !field.checkValidity());
                if (firstInvalid) {
                    firstInvalid.focus();
                }
                return;
            }

            createToast("Inscrição enviada com sucesso!", "success");
            const confirmationModal = document.querySelector("#confirmacao-modal");
            if (confirmationModal) {
                openModal(confirmationModal);
            }

            form.reset();
            fields.forEach((field) => {
                delete field.dataset.touched;
                field.setAttribute("aria-invalid", "false");
                const group = field.closest(".form__group");
                if (group) {
                    group.classList.remove("is-valid", "is-invalid");
                    const feedback = group.querySelector(".form__feedback");
                    if (feedback) {
                        feedback.textContent = "";
                    }
                }
            });

            clearFormData(storageKey);
        });

        form.dataset.storageKey = storageKey;
        form.dataset.formBound = "true";
    };

    const enhanceForms = (root = document) => {
        const forms = root.querySelectorAll(".form");
        forms.forEach((form) => bindForm(form));
    };

    const enhanceDynamicContent = (root = document) => {
        bindToastTriggers(root);
        bindModalTriggers(root);
        enhanceForms(root);
        if (window.ImpactaApp && typeof window.ImpactaApp.applyMasks === "function") {
            window.ImpactaApp.applyMasks(root);
        }
    };

    const notifyViewChange = (root = document) => {
        const event = new CustomEvent("impacta:viewchange", { detail: { root } });
        window.dispatchEvent(event);
    };

    const initialise = () => {
        initNavigation();
        enhanceDynamicContent(document);
        watchEscapeKey();
        notifyViewChange(document);
        window.dispatchEvent(new CustomEvent("impacta:ready"));
    };

    ImpactaApp.createToast = createToast;
    ImpactaApp.ensureToastStack = ensureToastStack;
    ImpactaApp.openModal = openModal;
    ImpactaApp.closeModal = closeModal;
    ImpactaApp.enhanceForms = enhanceForms;
    ImpactaApp.enhanceDynamic = enhanceDynamicContent;
    ImpactaApp.afterViewChange = (root = document) => {
        enhanceDynamicContent(root);
        notifyViewChange(root);
    };

    window.ImpactaApp = ImpactaApp;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialise, { once: true });
    } else {
        initialise();
    }
})();
