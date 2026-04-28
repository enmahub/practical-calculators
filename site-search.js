(function () {
  "use strict";

  function pathDepth(pagePath) {
    const normalized = String(pagePath || "")
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");
    if (!normalized) {
      return 0;
    }
    const parts = normalized.split("/");
    return Math.max(parts.length - 1, 0);
  }

  function hrefToTarget(pagePath, targetFromRoot) {
    const depth = pathDepth(pagePath);
    const prefix = depth > 0 ? "../".repeat(depth) : "";
    const norm = String(targetFromRoot || "")
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");
    return prefix + norm;
  }

  function normPagePath() {
    const fromHtml = document.documentElement.getAttribute("data-page-path");
    if (fromHtml != null && fromHtml !== "") {
      return fromHtml.replace(/\\/g, "/").replace(/^\/+/, "");
    }
    const wrap = document.querySelector("[data-site-search]");
    const fromWrap = wrap && wrap.getAttribute("data-page-path");
    return String(fromWrap || "")
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");
  }

  function tokenize(q) {
    return String(q || "")
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function haystack(it) {
    return [it.t, it.h, it.c, it.u, it.l].join(" ").toLowerCase();
  }

  function matches(it, tokens) {
    const h = haystack(it);
    for (let i = 0; i < tokens.length; i += 1) {
      if (h.indexOf(tokens[i]) === -1) {
        return false;
      }
    }
    return true;
  }

  function sortResults(items, prefLang) {
    const pref = prefLang === "es" ? "es" : "en";
    return items.slice().sort((a, b) => {
      const ap = a.l === pref ? 0 : 1;
      const bp = b.l === pref ? 0 : 1;
      if (ap !== bp) {
        return ap - bp;
      }
      return (a.h || a.t).localeCompare(b.h || b.t, undefined, { sensitivity: "base" });
    });
  }

  function debounce(fn, ms) {
    let t;
    return function debounced() {
      const ctx = this;
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(ctx, args);
      }, ms);
    };
  }

  function initRoot(wrap) {
    const input = wrap.querySelector(".site-search-input");
    const dropdown = wrap.querySelector(".site-search-dropdown");
    const indexUrl = wrap.getAttribute("data-search-index");
    const prefLang = wrap.getAttribute("data-pref-lang") || "en";
    const pagePath = normPagePath();

    if (!input || !dropdown || !indexUrl) {
      return;
    }

    if (!dropdown.id) {
      dropdown.id = "site-search-results";
    }
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-haspopup", "listbox");
    input.setAttribute("aria-controls", dropdown.id);

    const originalPlaceholder = input.getAttribute("placeholder") || "";

    let items = [];
    let loaded = false;
    let loadError = false;
    let activeIndex = -1;
    let searchDebounceTimer = null;
    let openedTracked = false;
    let lastResultsEventKey = "";

    function sendSearchEvent(eventName, detail) {
      if (typeof window === "undefined" || typeof window.gtag !== "function") {
        return;
      }
      const payload = detail && typeof detail === "object" ? detail : {};
      window.gtag("event", eventName, payload);
    }

    function noResultsLabel() {
      return (
        wrap.getAttribute("data-no-results") ||
        (prefLang === "es" ? "Sin resultados" : "No matches")
      );
    }

    function setOpen(open) {
      dropdown.hidden = !open;
      input.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function optionAnchors() {
      return dropdown.querySelectorAll("a.site-search-item");
    }

    function clearActive() {
      activeIndex = -1;
      input.removeAttribute("aria-activedescendant");
      const anchors = optionAnchors();
      for (let i = 0; i < anchors.length; i += 1) {
        anchors[i].classList.remove("site-search-item-active");
        anchors[i].removeAttribute("aria-selected");
      }
    }

    function applyActive(index) {
      clearActive();
      const anchors = optionAnchors();
      if (index < 0 || index >= anchors.length) {
        return;
      }
      activeIndex = index;
      const el = anchors[index];
      el.classList.add("site-search-item-active");
      el.setAttribute("aria-selected", "true");
      input.setAttribute("aria-activedescendant", el.id);
      try {
        el.scrollIntoView({ block: "nearest" });
      } catch (e) {
        /* ignore */
      }
    }

    function showLoadError() {
      dropdown.textContent = "";
      const box = document.createElement("div");
      box.className = "site-search-error";
      box.setAttribute("role", "alert");
      const msg =
        prefLang === "es"
          ? "No se pudo cargar el índice de búsqueda. Comprueba la conexión o vuelve a intentarlo."
          : "Could not load the search index. Check your connection or try again.";
      box.appendChild(document.createTextNode(msg));

      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "site-search-retry";
      retry.textContent = prefLang === "es" ? "Reintentar" : "Retry";
      retry.addEventListener("mousedown", function (e) {
        e.preventDefault();
      });
      retry.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        loadError = false;
        loaded = false;
        items = [];
        input.disabled = false;
        input.setAttribute("placeholder", originalPlaceholder);
        dropdown.textContent = "";
        setOpen(false);
        loadIndex();
      });
      box.appendChild(retry);
      dropdown.appendChild(box);
      setOpen(true);
    }

    function loadIndex() {
      if (loaded || loadError) {
        return;
      }
      fetch(indexUrl, { credentials: "same-origin" })
        .then(function (r) {
          if (!r.ok) {
            throw new Error("search index");
          }
          return r.json();
        })
        .then(function (data) {
          items = Array.isArray(data.items) ? data.items : [];
          loaded = true;
          performSearch();
        })
        .catch(function () {
          loadError = true;
          showLoadError();
        });
    }

    function renderList(matchesList) {
      clearActive();
      dropdown.textContent = "";
      if (!matchesList.length) {
        const empty = document.createElement("div");
        empty.className = "site-search-empty";
        empty.textContent = noResultsLabel();
        dropdown.appendChild(empty);
        const key = "q:" + tokenize(input.value).join("|") + ":n:0";
        if (lastResultsEventKey !== key) {
          lastResultsEventKey = key;
          sendSearchEvent("search_results_shown", {
            page_path: window.location.pathname,
            query_length: String(input.value || "").trim().length,
            result_count: 0
          });
        }
        return;
      }
      const max = 14;
      const slice = matchesList.slice(0, max);
      for (let i = 0; i < slice.length; i += 1) {
        const it = slice[i];
        const a = document.createElement("a");
        a.className = "site-search-item";
        a.href = hrefToTarget(pagePath, it.u);
        a.setAttribute("role", "option");
        a.setAttribute("tabindex", "-1");
        a.id = dropdown.id + "-opt-" + i;

        const lang = document.createElement("span");
        lang.className = "site-search-lang";
        lang.textContent = it.l === "es" ? "ES" : "EN";

        const text = document.createElement("span");
        text.className = "site-search-item-text";
        text.textContent = it.h || it.t;

        const cat = document.createElement("span");
        cat.className = "site-search-item-cat";
        cat.textContent = it.c || "";

        a.appendChild(lang);
        a.appendChild(text);
        if (cat.textContent) {
          a.appendChild(cat);
        }
        a.addEventListener("mouseenter", function () {
          applyActive(i);
        });
        a.addEventListener("click", function () {
          sendSearchEvent("search_result_clicked", {
            page_path: window.location.pathname,
            query_length: String(input.value || "").trim().length,
            result_index: i,
            target_path: a.getAttribute("href") || ""
          });
        });
        dropdown.appendChild(a);
      }
      const key = "q:" + tokenize(input.value).join("|") + ":n:" + slice.length;
      if (lastResultsEventKey !== key) {
        lastResultsEventKey = key;
        sendSearchEvent("search_results_shown", {
          page_path: window.location.pathname,
          query_length: String(input.value || "").trim().length,
          result_count: slice.length
        });
      }
    }

    function performSearch() {
      if (loadError) {
        return;
      }
      if (!loaded) {
        loadIndex();
        return;
      }
      const tokens = tokenize(input.value);
      if (!tokens.length) {
        dropdown.textContent = "";
        setOpen(false);
        clearActive();
        return;
      }
      const hits = [];
      for (let i = 0; i < items.length; i += 1) {
        if (matches(items[i], tokens)) {
          hits.push(items[i]);
        }
      }
      const sorted = sortResults(hits, prefLang);
      renderList(sorted);
      setOpen(true);
    }

    function scheduleSearch() {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(performSearch, 160);
    }

    function flushSearch() {
      clearTimeout(searchDebounceTimer);
      performSearch();
    }

    input.addEventListener("focus", function () {
      if (!openedTracked) {
        openedTracked = true;
        sendSearchEvent("search_opened", { page_path: window.location.pathname });
      }
      loadIndex();
    });

    input.addEventListener("input", function () {
      scheduleSearch();
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        setOpen(false);
        clearActive();
        input.blur();
        return;
      }

      const tokens = tokenize(input.value);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!tokens.length) {
          return;
        }
        if (!loaded) {
          loadIndex();
          return;
        }
        if (loadError) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        flushSearch();
        const anchors = optionAnchors();
        if (!anchors.length) {
          return;
        }
        if (e.key === "ArrowDown") {
          if (!dropdown.hidden && activeIndex >= 0) {
            applyActive(Math.min(activeIndex + 1, anchors.length - 1));
          } else {
            applyActive(0);
          }
        } else {
          if (!dropdown.hidden && activeIndex > 0) {
            applyActive(activeIndex - 1);
          } else if (!dropdown.hidden && activeIndex === 0) {
            clearActive();
          } else {
            applyActive(anchors.length - 1);
          }
        }
        return;
      }

      if (e.key === "Home" && !dropdown.hidden) {
        const anchors = optionAnchors();
        if (anchors.length) {
          e.preventDefault();
          applyActive(0);
        }
        return;
      }

      if (e.key === "End" && !dropdown.hidden) {
        const anchors = optionAnchors();
        if (anchors.length) {
          e.preventDefault();
          applyActive(anchors.length - 1);
        }
        return;
      }

      if (e.key === "Enter") {
        const anchors = optionAnchors();
        if (dropdown.hidden || activeIndex < 0 || activeIndex >= anchors.length) {
          return;
        }
        e.preventDefault();
        const href = anchors[activeIndex].getAttribute("href");
        if (href) {
          sendSearchEvent("search_result_clicked", {
            page_path: window.location.pathname,
            query_length: String(input.value || "").trim().length,
            result_index: activeIndex,
            target_path: href
          });
          window.location.href = anchors[activeIndex].href;
        }
      }
    });

    document.addEventListener("click", function (e) {
      if (!wrap.contains(e.target)) {
        setOpen(false);
        clearActive();
      }
    });

    input.addEventListener("blur", function () {
      setTimeout(function () {
        const active = document.activeElement;
        if (active && dropdown.contains(active)) {
          return;
        }
        if (!wrap.contains(active)) {
          setOpen(false);
          clearActive();
        }
      }, 120);
    });
  }

  document.querySelectorAll("[data-site-search]").forEach(initRoot);
})();
