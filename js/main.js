document.addEventListener("DOMContentLoaded", () => {
    const yearPlaceholder = document.getElementById("ano-atual");
    if (yearPlaceholder) {
        yearPlaceholder.textContent = new Date().getFullYear();
    }

    // Improve keyboard focus outline for skip link on Safari/Firefox when using mouse first
    const skipLink = document.querySelector(".skip-link");
    if (skipLink) {
        skipLink.addEventListener("click", () => skipLink.classList.remove("is-visible"));
        skipLink.addEventListener("focus", () => skipLink.classList.add("is-visible"));
        skipLink.addEventListener("blur", () => skipLink.classList.remove("is-visible"));
    }

    const navToggle = document.querySelector(".nav-toggle");
    const primaryNav = document.getElementById("primary-navigation");
    const mobileMediaQuery = window.matchMedia("(max-width: 960px)");

    if (navToggle && primaryNav) {
        const dropdownTriggers = Array.from(primaryNav.querySelectorAll(".primary-nav__trigger"));

        const closeAllSubmenus = (exception) => {
            dropdownTriggers.forEach((trigger) => {
                if (trigger === exception) return;
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

        navToggle.addEventListener("click", () => {
            const isExpanded = navToggle.getAttribute("aria-expanded") === "true";
            setNavState(!isExpanded);
        });

        const syncNavForViewport = () => {
            if (mobileMediaQuery.matches) {
                primaryNav.setAttribute("aria-hidden", "true");
                setNavState(false);
            } else {
                primaryNav.removeAttribute("aria-hidden");
                setNavState(false);
            }
        };

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
            if (navToggle.contains(target)) return;
            if (primaryNav.contains(target)) return;

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
            toast.addEventListener("animationend", () => toast.remove());
        };

        toast.querySelector(".toast__close").addEventListener("click", removeToast);
        stack.appendChild(toast);
        setTimeout(removeToast, 5000);
    };

    document.querySelectorAll("[data-toast-trigger]").forEach((button) => {
        button.addEventListener("click", () => {
            const message = button.getAttribute("data-toast-message") || "Notificação enviada.";
            const variant = button.getAttribute("data-toast-variant") || "info";
            createToast(message, variant);
        });
    });

    const focusableSelectors = [
        "a[href]",
        "button:not([disabled])",
        "textarea:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "[tabindex]:not([tabindex='-1'])"
    ].join(",");

    let activeModal = null;
    let lastFocusedElement = null;

    const openModal = (modal) => {
        if (!modal) return;
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
        if (!modal) return;
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

    document.querySelectorAll("[data-modal-open]").forEach((trigger) => {
        const targetSelector = trigger.getAttribute("data-modal-open");
        const modal = document.querySelector(targetSelector);
        if (!modal) return;

        trigger.addEventListener("click", (event) => {
            event.preventDefault();
            openModal(modal);
        });
    });

    document.querySelectorAll("[data-modal-close]").forEach((button) => {
        button.addEventListener("click", () => closeModal(button.closest(".modal")));
    });

    document.querySelectorAll(".modal").forEach((modal) => {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                closeModal(modal);
            }
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && activeModal) {
            closeModal(activeModal);
        }
    });

    const forms = document.querySelectorAll(".form");

    forms.forEach((form) => {
        const fields = Array.from(form.querySelectorAll("input, select, textarea"));

        const updateFieldState = (field, touched = false) => {
            if (touched) {
                field.dataset.touched = "true";
            }

            const hasBeenTouched = touched || field.dataset.touched === "true";
            const group = field.closest(".form__group");
            if (!group) return;

            const feedback = group.querySelector(".form__feedback");
            const isValid = field.checkValidity();
            const hasValue = field.value && field.value.trim() !== "";

            field.setAttribute("aria-invalid", String(!isValid));
            group.classList.toggle("is-invalid", !isValid && hasBeenTouched);
            group.classList.toggle("is-valid", isValid && hasValue);

            if (feedback) {
                if (!hasBeenTouched) {
                    feedback.textContent = "";
                } else if (!isValid) {
                    feedback.textContent = field.validationMessage;
                } else if (hasValue) {
                    feedback.textContent = "Tudo certo!";
                } else {
                    feedback.textContent = "";
                }
            }
        };

        fields.forEach((field) => {
            if (!field.hasAttribute("aria-invalid")) {
                field.setAttribute("aria-invalid", "false");
            }

            field.addEventListener("blur", () => updateFieldState(field, true));
            field.addEventListener("input", () => updateFieldState(field));
            field.addEventListener("change", () => updateFieldState(field));
        });

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            let formIsValid = true;

            fields.forEach((field) => {
                updateFieldState(field, true);
                if (!field.checkValidity()) {
                    formIsValid = false;
                }
            });

            if (!formIsValid) {
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
        });
    });
});
