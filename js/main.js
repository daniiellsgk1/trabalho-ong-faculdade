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
});
