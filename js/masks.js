(() => {
    const maskers = {
        cpf(value) {
            const digits = value.replace(/\D/g, "").slice(0, 11);
            const parts = [
                digits.slice(0, 3),
                digits.slice(3, 6),
                digits.slice(6, 9),
                digits.slice(9, 11),
            ].filter(Boolean);

            if (parts.length === 0) {
                return "";
            }

            if (parts.length <= 3) {
                return parts
                    .map((part, index) => (index < 3 ? part : `-${part}`))
                    .join(".");
            }

            return `${parts[0]}.${parts[1]}.${parts[2]}-${parts[3]}`;
        },

        telefone(value) {
            const digits = value.replace(/\D/g, "").slice(0, 11);
            if (!digits) {
                return "";
            }

            const ddd = digits.slice(0, 2);
            const middle = digits.length > 10 ? digits.slice(2, 7) : digits.slice(2, 6);
            const suffix = digits.length > 10 ? digits.slice(7, 11) : digits.slice(6, 10);

            if (digits.length <= 2) {
                return `(${digits}`;
            }

            if (digits.length <= 6) {
                return `(${ddd}) ${digits.slice(2)}`;
            }

            if (digits.length <= 10) {
                return `(${ddd}) ${middle}-${suffix}`;
            }

            return `(${ddd}) ${middle}-${suffix}`;
        },

        cep(value) {
            const digits = value.replace(/\D/g, "").slice(0, 8);
            if (digits.length <= 5) {
                return digits;
            }
            return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
        },
    };

    const applyMask = (field, maskFn) => {
        const updateValue = () => {
            const maskedValue = maskFn(field.value);
            field.value = maskedValue;
            if (typeof field.setSelectionRange === "function") {
                field.setSelectionRange(maskedValue.length, maskedValue.length);
            }
        };

        field.addEventListener("input", updateValue);
        field.addEventListener("blur", () => {
            field.value = maskFn(field.value);
        });

        field.dataset.maskBound = "true";
    };

    const bindMaskToField = (field, maskFn) => {
        if (!field || typeof maskFn !== "function" || field.dataset.maskBound === "true") {
            return;
        }
        applyMask(field, maskFn);
        field.value = maskFn(field.value);
    };

    const selectors = [
        { selector: "#cpf", mask: "cpf" },
        { selector: "#telefone", mask: "telefone" },
        { selector: "#cep", mask: "cep" },
    ];

    const attachMasks = (root = document) => {
        selectors.forEach(({ selector, mask }) => {
            const maskFn = maskers[mask];
            root.querySelectorAll(selector).forEach((field) => {
                bindMaskToField(field, maskFn);
            });
        });
    };

    const registerMasks = () => {
        if (!window.ImpactaApp) {
            window.ImpactaApp = {};
        }

        window.ImpactaApp.applyMasks = attachMasks;

        attachMasks(document);

        window.addEventListener("impacta:viewchange", (event) => {
            attachMasks(event.detail?.root || document);
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", registerMasks, { once: true });
    } else {
        registerMasks();
    }
})();
