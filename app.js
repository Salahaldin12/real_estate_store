(function () {
    "use strict";

    var U = window.Units;
    var esc = U.esc;
    var num = U.num;
    var ICONS = U.icons;

    var SEARCH_URL = "/api/search/global-search";

    var form = document.getElementById("search-form");
    var resetBtn = document.getElementById("reset-btn");
    var orderingEl = document.getElementById("ordering");
    var resultsEl = document.getElementById("results");
    var countEl = document.getElementById("count");
    var statusEl = document.getElementById("status");
    var moreBtn = document.getElementById("more-btn");

    var nextUrl = null;
    var requestId = 0;

    function buildUrl() {
        var params = new URLSearchParams();
        new FormData(form).forEach(function (value, key) {
            value = String(value).trim();
            if (value !== "") params.append(key, value);
        });
        params.append("ordering", orderingEl.value);
        return SEARCH_URL + "?" + params.toString();
    }

    /* ---------- بطاقة وحدة ---------- */
    function media(unit, isRent) {
        var photos = (unit.images || []).length;
        var visual = unit.main_image
            ? '<img class="photo" src="' + esc(unit.main_image) + '" alt="' + esc(unit.name) + '" loading="lazy">'
            : '<div class="elevation">' + U.elevation(unit.floor) + '</div>';

        return '<div class="media">' + visual +
            '<span class="badge ' + (isRent ? "badge-rent" : "badge-sale") + '">' +
                esc(unit.listing_type_display || (isRent ? "للإيجار" : "للبيع")) +
            '</span>' +
            (photos > 1 ? '<span class="photo-count">' + ICONS.photos + num(photos) + '</span>' : '') +
        '</div>';
    }

    function card(unit) {
        var isRent = unit.listing_type === "rent";
        var place = [unit.district, unit.city].filter(Boolean).join("، ");

        return '' +
            '<article class="card">' +
                media(unit, isRent) +
                '<div class="card-body">' +
                    '<span class="card-type">' + esc(unit.category) + '</span>' +
                    '<h3><a class="card-link" href="' + U.unitPath(unit.id) + '">' + esc(unit.name) + '</a></h3>' +
                    '<p class="place">' + ICONS.pin + '<span>' + esc(place) + '</span></p>' +
                    '<ul class="specs">' +
                        '<li>' + ICONS.area + num(unit.area) + ' م²</li>' +
                        '<li>' + ICONS.floor + esc(U.floorLabel(unit.floor)) + '</li>' +
                        (unit.finishing ? '<li>' + ICONS.finish + esc(unit.finishing) + '</li>' : '') +
                    '</ul>' +
                    '<p class="price">' + num(unit.price) + ' جنيه' +
                        (isRent ? '<small>/ شهريًا</small>' : '') +
                    '</p>' +
                    '<a class="wa-btn" href="' + esc(U.whatsappLink(unit)) + '" target="_blank" rel="noopener noreferrer">' +
                        ICONS.chat + 'تواصل عبر واتساب' +
                    '</a>' +
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
        countEl.textContent = total === 0 ? "لا توجد وحدات" : num(total) + (total === 1 ? " وحدة" : " وحدة متاحة");
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
        }

        fetch(url, { headers: { Accept: "application/json" } })
            .then(function (response) {
                if (!response.ok) throw new Error("HTTP " + response.status);
                return response.json();
            })
            .then(function (data) {
                if (myRequest !== requestId) return;

                // يدعم الرد المقسّم إلى صفحات {count, next, results} والرد كقائمة
                var items = Array.isArray(data) ? data : data.results || [];
                var total = Array.isArray(data) ? items.length : (data.count != null ? data.count : items.length);
                nextUrl = Array.isArray(data) ? null : data.next;

                var html = items.map(card).join("");
                if (append) resultsEl.insertAdjacentHTML("beforeend", html);
                else resultsEl.innerHTML = html;

                updateCount(total);

                if (total === 0) {
                    showStatus("لا توجد وحدات مطابقة لبحثك. جرّب توسيع نطاق السعر أو المساحة.", false, {
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
        var f = form.elements;
        if (f.min_price.value && f.max_price.value && Number(f.min_price.value) > Number(f.max_price.value)) {
            showStatus("السعر في خانة «من» أكبر من السعر في خانة «إلى». عدّل الرقمين وأعد البحث.", true);
            return;
        }
        if (f.min_area.value && f.max_area.value && Number(f.min_area.value) > Number(f.max_area.value)) {
            showStatus("المساحة في خانة «من» أكبر من المساحة في خانة «إلى». عدّل الرقمين وأعد البحث.", true);
            return;
        }
        load(buildUrl(), false);
    }

    function resetSearch() {
        form.reset();
        orderingEl.value = "-created_at";
        load(buildUrl(), false);
    }

    /* ---------- الأحداث ---------- */
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        search();
    });
    resetBtn.addEventListener("click", resetSearch);
    orderingEl.addEventListener("change", search);
    moreBtn.addEventListener("click", function () {
        if (nextUrl) load(nextUrl, true);
    });

    search();
})();
