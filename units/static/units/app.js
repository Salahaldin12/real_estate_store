(function () {
    "use strict";

    var SEARCH_URL = "/api/search/global-search";
    var WHATSAPP_NUMBER = "201105094278";

    var form = document.getElementById("search-form");
    var resetBtn = document.getElementById("reset-btn");
    var orderingEl = document.getElementById("ordering");
    var resultsEl = document.getElementById("results");
    var countEl = document.getElementById("count");
    var statusEl = document.getElementById("status");
    var moreBtn = document.getElementById("more-btn");

    var modeTabsEl = document.getElementById("mode-tabs");
    var modeTabBtns = modeTabsEl
        ? Array.prototype.slice.call(modeTabsEl.querySelectorAll(".mode-tab"))
        : [];
    var selectedListingType = ""; // "" = الكل، "sale" = بيع، "rent" = إيجار

    var nf = new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 });
    var nextUrl = null;
    var shown = 0;
    var requestId = 0;
    var unitsById = {};

    /* ---------- أدوات صغيرة ---------- */
    function esc(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function num(value) {
        return nf.format(Number(value));
    }

    function syncListingTabsUI() {
        if (!modeTabsEl) return;
        modeTabsEl.setAttribute("data-active", selectedListingType || "all");
        modeTabBtns.forEach(function (btn) {
            var isActive = btn.getAttribute("data-type") === selectedListingType;
            btn.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
    }

    function setListingType(nextType) {
        selectedListingType = (selectedListingType === nextType) ? "" : nextType;
        syncListingTabsUI();
        search();
    }

    modeTabBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
            var type = btn.getAttribute("data-type");
            if (type === "sale" || type === "rent") {
                setListingType(type);
            }
        });
    });

    function buildUrl() {
        var params = new URLSearchParams();

        if (form) {
            new FormData(form).forEach(function (value, key) {
                if (key === "listing_type") return;
                value = String(value).trim();
                if (value !== "") params.append(key, value);
            });
        }

        if (selectedListingType !== "") {
            params.append("listing_type", selectedListingType);
        }

        if (orderingEl && orderingEl.value) {
            params.append("ordering", orderingEl.value);
        }

        return SEARCH_URL + "?" + params.toString();
    }

    /* ---------- رسم واجهة العمارة وإضاءة دور الوحدة ---------- */
    function elevation(floor) {
        floor = Number(floor) || 0;
        var stories = Math.min(Math.max(floor + 3, 5), 12);
        var ground = 138;
        var h = Math.min(18, 104 / stories);
        var x = 66, w = 108;
        var top = ground - stories * h;
        var svg = '<svg viewBox="0 0 240 160" role="img" aria-hidden="true" preserveAspectRatio="xMidYMax meet">';

        svg += '<path d="M10 ' + ground + 'H230" stroke="#9fc0da" stroke-width="1.5"/>';

        for (var i = 0; i < stories; i++) {
            var y = ground - (i + 1) * h;
            var lit = i === floor;
            svg += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" ' +
                (lit
                    ? 'class="lit-floor" fill="#f5a524" stroke="#f5a524"'
                    : 'fill="rgba(255,255,255,0.04)" stroke="#9fc0da" stroke-opacity="0.7"') +
                ' stroke-width="1"/>';

            for (var k = 0; k < 4; k++) {
                var wx = x + 12 + k * 24;
                if (i === 0 && (k === 1 || k === 2)) continue;
                svg += '<rect x="' + wx + '" y="' + (y + h * 0.3) + '" width="12" height="' + (h * 0.4) +
                    '" fill="' + (lit ? "#0d2b45" : "#9fc0da") + '" opacity="' + (lit ? "0.55" : "0.35") + '"/>';
            }
        }

        svg += '<rect x="' + (x + 42) + '" y="' + (ground - h * 0.8) + '" width="24" height="' + (h * 0.8) +
            '" fill="none" stroke="#9fc0da" stroke-width="1.2"/>';

        svg += '<path d="M' + (x - 5) + ' ' + top + 'H' + (x + w + 5) + '" stroke="#9fc0da" stroke-width="2"/>';

        var ly = ground - (floor + 0.5) * h;
        svg += '<path d="M' + (x + w) + ' ' + ly + 'H' + (x + w + 16) + '" stroke="#f5a524" stroke-width="1.4"/>';
        svg += '<circle cx="' + (x + w + 16) + '" cy="' + ly + '" r="2.4" fill="#f5a524"/>';

        svg += "</svg>";
        return svg;
    }

    var ICON_PIN = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
    var ICON_AREA = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
    var ICON_FLOOR = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 20h18M5 20V8l7-4 7 4v12M9 20v-6h6v6"/></svg>';
    var ICON_ROOM = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10v9"/><path d="M21 10v9"/><path d="M3 16h18"/><path d="M6 16v-3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3"/><path d="M7 11V8a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3"/><path d="M13 11V8a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3"/></svg>';
    var ICON_BATH = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3z"/><path d="M6 12V6a2 2 0 0 1 4 0"/><path d="M6 19v2"/><path d="M18 19v2"/></svg>';
    var ICON_FINISH = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 20l9-9M13 11l-2-2 6-6 4 4-6 6-2-2z"/></svg>';
    var ICON_CHAT = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path stroke-width="1.8" d="M5 3h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7l-4.5 4v-4H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>' +
        '<path stroke-width="3.2" transform="translate(7.4 5.2) scale(0.4)" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>' +
        '</svg>';

    function whatsappLink(unit) {
        var pageUrl = window.location.origin + "/unit/" + unit.id + "/";
        var codeLine = unit.code ? "كود الوحدة: " + unit.code + "\n" : "";
        var text = "مرحبًا، أرغب في الاستفسار عن هذه الوحدة:\n" +
            unit.name + "\n" +
            codeLine +
            "رقم الوحدة: " + unit.id + "\n" +
            "رابط الوحدة: " + pageUrl;
        return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);
    }

    /* ---------- بطاقة وحدة ---------- */
    var FLOORS = [
        "الأرضي", "الأول", "الثاني", "الثالث", "الرابع", "الخامس",
        "السادس", "السابع", "الثامن", "التاسع", "العاشر"
    ];

    function floorLabel(floor) {
        var n = Number(floor);
        return isNaN(n) ? "" : "الدور " + (FLOORS[n] || num(n));
    }

    function roomsLabel(rooms) {
        var n = Number(rooms);
        if (rooms == null || rooms === "" || isNaN(n) || n <= 0) return "";
        if (n === 1) return "غرفة واحدة";
        if (n === 2) return "غرفتان";
        if (n >= 3 && n <= 10) return num(n) + " غرف";
        return num(n) + " غرفة";
    }

    function bathsLabel(baths) {
        var n = Number(baths);
        if (baths == null || baths === "" || isNaN(n) || n <= 0) return "";
        if (n === 1) return "حمام واحد";
        if (n === 2) return "حمامان";
        if (n >= 3 && n <= 10) return num(n) + " حمامات";
        return num(n) + " حمام";
    }

    function card(unit) {
        var isRent = unit.listing_type === "rent";
        var place = [unit.district, unit.city].filter(Boolean).join("، ");
        var roomsText = roomsLabel(unit.rooms);
        var bathsText = bathsLabel(unit.bathrooms);

        var visual = unit.main_image
            ? '<img class="photo" src="' + esc(unit.main_image) + '" alt="' + esc(unit.name) + '" loading="lazy">'
            : '<div class="elevation">' + elevation(unit.floor) + '</div>';

        return '' +
            '<article class="card">' +
                '<div class="media">' +
                    visual +
                    '<span class="badge ' + (isRent ? "badge-rent" : "badge-sale") + '">' +
                        esc(unit.listing_type_display || (isRent ? "للإيجار" : "للبيع")) +
                    '</span>' +
                '</div>' +
                '<div class="card-body">' +
                    '<div class="card-meta">' +
                        '<span class="card-type">' + esc(unit.category) + '</span>' +
                        (unit.code ? '<span class="card-code">كود: ' + esc(unit.code) + '</span>' : '') +
                    '</div>' +
                    '<h3><a class="card-link" href="/unit/' + unit.id + '/">' + esc(unit.name) + '</a></h3>' +
                    '<p class="place">' + ICON_PIN + '<span>' + esc(place) + '</span></p>' +
                    '<ul class="specs">' +
                        (roomsText ? '<li>' + ICON_ROOM + esc(roomsText) + '</li>' : '') +
                        (bathsText ? '<li>' + ICON_BATH + esc(bathsText) + '</li>' : '') +
                        '<li>' + ICON_AREA + num(unit.area) + ' م²</li>' +
                        '<li>' + ICON_FLOOR + esc(floorLabel(unit.floor)) + '</li>' +
                        (unit.finishing ? '<li>' + ICON_FINISH + esc(unit.finishing) + '</li>' : '') +
                    '</ul>' +
                    '<p class="price">' + num(unit.price) + ' جنيه' +
                        (isRent ? '<small>/ شهريًا</small>' : '') +
                    '</p>' +
                    '<a class="wa-btn" href="' + esc(whatsappLink(unit)) + '" target="_blank" rel="noopener noreferrer">' +
                        ICON_CHAT + 'تواصل عبر واتساب' +
                    '</a>' +
                    '<button type="button" class="share-wa-btn" data-unit-id="' + esc(unit.id) + '">' +
                        'مشاركة لصديق عبر واتساب' +
                    '</button>' +
                '</div>' +
            '</article>';
    }

    function skeletons(n) {
        var html = "";
        for (var i = 0; i < n; i++) {
            html += '<div class="card skeleton" aria-hidden="true"><div class="elevation"></div>' +
                '<div class="line"></div><div class="line"></div><div class="line"></div></div>';
        }
        return html;
    }

    /* ---------- الحالة ---------- */
    function showStatus(message, isError, retry) {
        statusEl.hidden = false;
        statusEl.className = "status" + (isError ? " is-error" : "");
        statusEl.textContent = message;
        if (retry) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = retry.label;
            btn.addEventListener("click", retry.action);
            statusEl.appendChild(btn);
        }
    }

    function hideStatus() {
        statusEl.hidden = true;
        statusEl.textContent = "";
    }

    function updateCount(total) {
        countEl.textContent = total === 0
            ? "لا توجد وحدات"
            : num(total) + (total === 1 ? " وحدة" : " وحدة متاحة");
    }

    /* ---------- التحميل ---------- */
    function load(url, append) {
        var myRequest = ++requestId;
        hideStatus();
        moreBtn.disabled = true;

        if (!append) {
            resultsEl.innerHTML = skeletons(6);
            moreBtn.hidden = true;
            countEl.textContent = "جارٍ تحميل الوحدات";
            shown = 0;
            unitsById = {};
        }

        fetch(url, { headers: { Accept: "application/json" } })
            .then(function (response) {
                if (!response.ok) throw new Error("HTTP " + response.status);
                return response.json();
            })
            .then(function (data) {
                if (myRequest !== requestId) return;

                var items = Array.isArray(data) ? data : data.results || [];
                var total = Array.isArray(data) ? items.length : (data.count != null ? data.count : items.length);
                nextUrl = Array.isArray(data) ? null : data.next;

                items.forEach(function (item) {
                    if (item && item.id != null) {
                        unitsById[String(item.id)] = item;
                    }
                });

                var html = items.map(card).join("");
                if (append) resultsEl.insertAdjacentHTML("beforeend", html);
                else resultsEl.innerHTML = html;

                shown += items.length;
                updateCount(total);

                if (total === 0) {
                    showStatus("لا توجد وحدات مطابقة لبحثك. جرّب تعديل الكود أو المكان أو نطاق السعر.", false, {
                        label: "مسح البحث",
                        action: resetSearch
                    });
                }

                moreBtn.hidden = !nextUrl;
                moreBtn.disabled = false;
            })
            .catch(function () {
                if (myRequest !== requestId) return;
                if (!append) resultsEl.innerHTML = "";
                countEl.textContent = "تعذّر تحميل الوحدات";
                showStatus("تعذّر الاتصال بالخادم. تحقق من الاتصال ثم حاول مرة أخرى.", true, {
                    label: "إعادة المحاولة",
                    action: function () { load(append && nextUrl ? nextUrl : buildUrl(), append); }
                });
                moreBtn.disabled = false;
            });
    }

    function search() {
        var minPriceEl = form && form.elements.min_price;
        var maxPriceEl = form && form.elements.max_price;
        if (minPriceEl && maxPriceEl && minPriceEl.value && maxPriceEl.value) {
            if (Number(minPriceEl.value) > Number(maxPriceEl.value)) {
                showStatus("السعر في خانة «من» أكبر من السعر في خانة «إلى». عدّل الرقمين وأعد البحث.", true);
                return;
            }
        }

        var minAreaEl = form && form.elements.min_area;
        var maxAreaEl = form && form.elements.max_area;
        if (minAreaEl && maxAreaEl && minAreaEl.value && maxAreaEl.value) {
            if (Number(minAreaEl.value) > Number(maxAreaEl.value)) {
                showStatus("المساحة في خانة «من» أكبر من المساحة في خانة «إلى». عدّل الرقمين وأعد البحث.", true);
                return;
            }
        }

        load(buildUrl(), false);
    }

    function resetSearch() {
        if (form) form.reset();
        selectedListingType = "";
        syncListingTabsUI();
        if (orderingEl) orderingEl.value = "-created_at";
        load(buildUrl(), false);
    }

    /* ---------- الأحداث ---------- */
    if (resultsEl) {
        resultsEl.addEventListener("click", function (event) {
            var btn = event.target.closest(".share-wa-btn");
            if (!btn) return;

            event.preventDefault();
            event.stopPropagation();

            var unitId = btn.getAttribute("data-unit-id");
            var rawUnit = unitsById[String(unitId)];
            if (!rawUnit || !window.Units || typeof window.Units.shareUnitToWhatsApp !== "function") return;

            var place = [rawUnit.district, rawUnit.city].filter(Boolean).join("، ");
            var absImage = rawUnit.main_image
                ? new URL(rawUnit.main_image, window.location.origin).href
                : "";
            var detailUrl = new URL("/unit/" + rawUnit.id + "/", window.location.origin).href;

            var sharePayload = {
                name: rawUnit.name,
                title: rawUnit.name,
                code: rawUnit.code,
                category: rawUnit.category,
                category_label: rawUnit.listing_type_display,
                price: rawUnit.price
                    ? num(rawUnit.price) + " جنيه" + (rawUnit.listing_type === "rent" ? " / شهريًا" : "")
                    : "",
                rooms: rawUnit.rooms,
                bathrooms: rawUnit.bathrooms,
                area: rawUnit.area ? num(rawUnit.area) + " م²" : "",
                floor: rawUnit.floor,
                location: place,
                image: absImage,
                image_url: absImage
            };

            window.Units.shareUnitToWhatsApp(sharePayload, detailUrl);
        });
    }

    if (form) {
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            search();
        });
    }

    if (resetBtn) resetBtn.addEventListener("click", resetSearch);
    if (orderingEl) orderingEl.addEventListener("change", search);
    if (moreBtn) {
        moreBtn.addEventListener("click", function () {
            if (nextUrl) load(nextUrl, true);
        });
    }

    syncListingTabsUI();
    search();
})();