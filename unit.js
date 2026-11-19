(function () {
    "use strict";

    var U = window.Units;
    var esc = U.esc;
    var num = U.num;
    var ICONS = U.icons;

    var root = document.getElementById("unit");
    var unitId = document.body.getAttribute("data-unit-id");

    function fact(label, value) {
        if (value == null || value === "") return "";
        return '<div><dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd></div>';
    }

    function gallery(unit) {
        var images = unit.images || [];

        if (!images.length) {
            return '<div class="gallery"><div class="gallery-main"><div class="elevation">' +
                U.elevation(unit.floor) + '</div></div></div>';
        }

        var thumbs = "";
        if (images.length > 1) {
            thumbs = '<div class="thumbs">' + images.map(function (img, i) {
                return '<button type="button" class="thumb" data-src="' + esc(img.image) + '"' +
                    ' aria-label="عرض الصورة ' + num(i + 1) + ' من ' + num(images.length) + '"' +
                    (i === 0 ? ' aria-current="true"' : '') + '>' +
                    '<img src="' + esc(img.image) + '" alt=""></button>';
            }).join("") + '</div>';
        }

        return '<div class="gallery">' +
            '<div class="gallery-main"><img id="main-photo" src="' + esc(images[0].image) +
            '" alt="' + esc(unit.name) + '"></div>' + thumbs + '</div>';
    }

    function render(unit) {
        var isRent = unit.listing_type === "rent";
        var place = [unit.district, unit.city].filter(Boolean).join("، ");

        document.title = unit.name + " | وحدات";

        root.innerHTML =
            gallery(unit) +
            '<aside class="info">' +
                '<span class="tag ' + (isRent ? "tag-rent" : "tag-sale") + '">' +
                    esc(unit.listing_type_display || (isRent ? "للإيجار" : "للبيع")) + '</span>' +
                '<h1>' + esc(unit.name) + '</h1>' +
                '<p class="place">' + ICONS.pin + '<span>' + esc(place) + '</span></p>' +
                '<p class="price price-lg">' + num(unit.price) + ' جنيه' +
                    (isRent ? '<small>/ شهريًا</small>' : '') + '</p>' +
                '<a class="wa-btn" href="' + esc(U.whatsappLink(unit)) + '" target="_blank" rel="noopener noreferrer">' +
                    ICONS.chat + 'تواصل عبر واتساب</a>' +
                '<p class="hint">ستصلنا رسالتك ومعها رابط هذه الوحدة، فنعرف أي وحدة تسأل عنها.</p>' +
                '<dl class="facts">' +
                    fact("رقم الوحدة", num(unit.id)) +
                    fact("التصنيف", unit.category) +
                    fact("المساحة", num(unit.area) + " م²") +
                    fact("الدور", U.floorLabel(unit.floor)) +
                    fact("التشطيب", unit.finishing) +
                    fact("المدينة", unit.city) +
                    fact("الحي", unit.district) +
                    fact("العنوان", unit.address) +
                '</dl>' +
            '</aside>';

        var main = document.getElementById("main-photo");
        root.querySelectorAll(".thumb").forEach(function (btn) {
            btn.addEventListener("click", function () {
                main.src = btn.getAttribute("data-src");
                root.querySelectorAll(".thumb").forEach(function (b) { b.removeAttribute("aria-current"); });
                btn.setAttribute("aria-current", "true");
            });
        });
    }

    function message(title, text, retry) {
        root.innerHTML = '<div class="notice"><h1>' + esc(title) + '</h1><p>' + esc(text) + '</p>' +
            (retry ? '<button type="button" class="btn btn-outline" id="retry-btn">إعادة المحاولة</button>' : '') +
            '<a class="btn btn-primary" href="/">العودة إلى كل الوحدات</a></div>';
        if (retry) document.getElementById("retry-btn").addEventListener("click", load);
    }

    function load() {
        root.innerHTML = '<div class="detail-skeleton" aria-hidden="true"><div></div><div></div></div>';

        fetch("/api/units/" + encodeURIComponent(unitId) + "/", { headers: { Accept: "application/json" } })
            .then(function (response) {
                if (response.status === 404) {
                    message("هذه الوحدة غير موجودة", "ربما حُذفت أو تغيّر رابطها.", false);
                    return null;
                }
                if (!response.ok) throw new Error("HTTP " + response.status);
                return response.json();
            })
            .then(function (unit) { if (unit) render(unit); })
            .catch(function () {
                message("تعذّر تحميل الوحدة", "تحقق من الاتصال ثم حاول مرة أخرى.", true);
            });
    }

    load();
})();
