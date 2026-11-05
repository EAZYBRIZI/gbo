/* Газ-сервис Пропан — шапка, меню, появление секций, лайтбокс */
(() => {
    "use strict";

    /* шапка: фон при скролле */
    const head = document.querySelector(".site-head");
    const onScroll = () => head.classList.toggle("scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* бургер-меню */
    const burger = document.querySelector(".burger");
    burger.addEventListener("click", () => {
        const open = head.classList.toggle("menu-open");
        burger.setAttribute("aria-expanded", open);
        document.body.style.overflow = open ? "hidden" : "";
    });
    document.querySelectorAll(".mobile-menu a").forEach((a) =>
        a.addEventListener("click", () => {
            head.classList.remove("menu-open");
            burger.setAttribute("aria-expanded", "false");
            document.body.style.overflow = "";
        }),
    );

    /* появление секций при скролле */
    const io = new IntersectionObserver(
        (entries) =>
            entries.forEach((e) => {
                if (!e.isIntersecting) return;
                io.unobserve(e.target);
                e.target.classList.add("in");
                /* после анимации снимаем классы, чтобы fill-mode не глушал hover-transition */
                e.target.addEventListener(
                    "animationend",
                    () => {
                        e.target.classList.remove("reveal", "in");
                        e.target.style.animation = "";
                    },
                    { once: true },
                );
            }),
        { threshold: 0.1 },
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    /* галерея: «показать ещё» */
    const galToggle = document.querySelector(".gal-toggle");
    galToggle.addEventListener("click", () => {
        const extra = document.querySelectorAll(".ph[data-extra]");
        extra.forEach((fig, i) => {
            fig.hidden = false;
            fig.style.animation = "rise .55s cubic-bezier(.22,.8,.3,1) " + i * 0.06 + "s both";
        });
        galToggle.closest(".gal-foot").remove();
    });

    /* лайтбокс */
    const lb = document.getElementById("lb");
    const lbImg = lb.querySelector(".lb-img");
    const lbCount = lb.querySelector(".lb-count");
    const items = [...document.querySelectorAll(".ph-btn")];
    let idx = 0;
    let lastFocus = null;

    const preload = (i) => {
        const src = items[((i % items.length) + items.length) % items.length].dataset.full;
        if (src) new Image().src = src;
    };

    const load = (i) => {
        idx = ((i % items.length) + items.length) % items.length;
        const btn = items[idx];
        lbImg.src = btn.dataset.full;
        lbImg.alt = btn.dataset.alt || "";
        lbCount.textContent = idx + 1 + " / " + items.length;
        preload(idx + 1);
        preload(idx - 1);
    };

    const open = (i) => {
        lastFocus = document.activeElement;
        load(i);
        lb.hidden = false;
        document.body.style.overflow = "hidden";
        lb.querySelector(".lb-close").focus();
    };

    const close = () => {
        lb.hidden = true;
        lbImg.removeAttribute("src");
        document.body.style.overflow = "";
        if (lastFocus) lastFocus.focus();
    };

    const step = (d) => load(idx + d);

    items.forEach((btn, i) => btn.addEventListener("click", () => open(i)));
    lb.addEventListener("click", (e) => {
        if (e.target === lb) close();
    });
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", () => step(-1));
    lb.querySelector(".lb-next").addEventListener("click", () => step(1));

    window.addEventListener("keydown", (e) => {
        if (lb.hidden) return;
        if (e.key === "Escape") close();
        else if (e.key === "ArrowLeft") step(-1);
        else if (e.key === "ArrowRight") step(1);
    });


    /* карта 2ГИС: грузим по скроллу (observer) — сторонних запросов на старте нет */
    const mapFacade = document.querySelector(".map-facade-btn");
    if (mapFacade) {
        const loadMap = () => {
            const frame = document.createElement("iframe");
            frame.src = mapFacade.dataset.mapSrc;
            frame.sandbox = "allow-modals allow-forms allow-scripts allow-same-origin allow-popups allow-top-navigation-by-user-activation";
            frame.title = "Карта — Газ-сервис Пропан, Тула";
            frame.loading = "lazy";
            mapFacade.parentElement.replaceChildren(frame);
        };
        const mapObserver = new IntersectionObserver(
            (entries) =>
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        mapObserver.disconnect();
                        loadMap();
                    }
                }),
            { rootMargin: "300px" }
        );
        mapObserver.observe(mapFacade);
    }

    /* свайп */
    let x0 = null;
    lb.addEventListener(
        "touchstart",
        (e) => {
            x0 = e.touches[0].clientX;
        },
        { passive: true },
    );
    lb.addEventListener(
        "touchend",
        (e) => {
            if (x0 === null) return;
            const dx = e.changedTouches[0].clientX - x0;
            if (Math.abs(dx) > 40) step(dx > 0 ? -1 : 1);
            x0 = null;
        },
        { passive: true },
    );

    /* бейдж «сейчас открыто/закрыто» — по московскому времени */
    const badge = document.querySelector(".ct-open-badge");
    if (badge) {
        const parts = Object.fromEntries(
            new Intl.DateTimeFormat("en-US", {
                timeZone: "Europe/Moscow",
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
                hourCycle: "h23",
            })
                .formatToParts(new Date())
                .map((p) => [p.type, p.value])
        );
        const sched = {
            Mon: [540, 1080],
            Tue: [540, 1080],
            Wed: [540, 1080],
            Thu: [540, 1080],
            Fri: [540, 1080],
            Sat: [510, 840],
        };
        const s = sched[parts.weekday];
        const now = parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10);
        const open = !!s && now >= s[0] && now < s[1];
        badge.textContent = open ? "Сейчас открыто" : "Сейчас закрыто";
        badge.classList.add(open ? "is-open" : "is-closed");
        badge.hidden = false;
    }


    /* FAQ: плавное раскрытие — details под нашим контролем */
    const faqReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelectorAll(".faq-item").forEach((item) => {
        const summary = item.querySelector("summary");
        const body = item.querySelector(".faq-body");
        summary.addEventListener("click", (e) => {
            e.preventDefault();
            if (item.dataset.anim === "1") return;
            if (item.hasAttribute("open")) {
                if (faqReduced) {
                    item.removeAttribute("open");
                    return;
                }
                item.dataset.anim = "1";
                body.style.height = body.scrollHeight + "px";
                requestAnimationFrame(() => {
                    body.style.height = "0px";
                });
                body.addEventListener(
                    "transitionend",
                    () => {
                        delete item.dataset.anim;
                        item.removeAttribute("open");
                        body.style.height = "";
                    },
                    { once: true }
                );
            } else {
                if (faqReduced) {
                    item.setAttribute("open", "");
                    return;
                }
                item.dataset.anim = "1";
                item.setAttribute("open", "");
                body.style.height = "0px";
                requestAnimationFrame(() => {
                    body.style.height = body.scrollHeight + "px";
                });
                body.addEventListener(
                    "transitionend",
                    () => {
                        delete item.dataset.anim;
                        body.style.height = "";
                    },
                    { once: true }
                );
            }
        });
    });


    /* цены: табы-фильтр */
    const priceTabs = document.querySelectorAll(".price-tab");
    const priceCards = document.querySelectorAll(".price-card");
    priceTabs.forEach((t) =>
        t.addEventListener("click", () => {
            priceTabs.forEach((x) => {
                x.classList.toggle("is-active", x === t);
                x.setAttribute("aria-pressed", x === t ? "true" : "false");
            });
            const f = t.dataset.filter;
            let shown = 0;
            priceCards.forEach((card) => {
                const show = f === "all" || card.dataset.cat === f;
                card.hidden = !show;
                card.style.animation = "";
                if (show) {
                    card.style.animation =
                        "rise .45s cubic-bezier(.22,.8,.3,1) " + shown * 0.06 + "s both";
                    shown += 1;
                }
            });
        })
    );

})();
