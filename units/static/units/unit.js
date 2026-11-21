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
                '<button type="button" id="share-unit-wa-btn" class="share-wa-btn">' +
                    'مشاركة الوحدة عبر واتساب</button>' +
                '<p class="hint">ستصلنا رسالتك ومعها رابط هذه الوحدة، فنعرف أي وحدة تسأل عنها.</p>' +
                '<dl class="facts">' +
                    fact("كود الوحدة", unit.code) +
                    fact("رقم الوحدة", num(unit.id)) +
                    fact("التصنيف", unit.category) +
                    fact("عدد الغرف", roomsLabel(unit.rooms)) +
                    fact("عدد الحمامات", bathsLabel(unit.bathrooms)) +
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

        var shareBtn = document.getElementById("share-unit-wa-btn");
        if (shareBtn && typeof U.shareUnitToWhatsApp === "function") {
            shareBtn.addEventListener("click", function () {
                var activeSrc = (main && main.getAttribute("src")) ||
                    (unit.images && unit.images[0] && unit.images[0].image) ||
                    unit.main_image || "";
                var absImage = activeSrc ? new URL(activeSrc, window.location.origin).href : "";
                var fullLocation = [unit.address, unit.district, unit.city].filter(Boolean).join("، ");

                var sharePayload = {
                    name: unit.name,
                    title: unit.name,
                    code: unit.code,
                    category: unit.category,
                    category_label: unit.listing_type_display || (isRent ? "للإيجار" : "للبيع"),
                    price: unit.price != null
                        ? num(unit.price) + " جنيه" + (isRent ? " / شهريًا" : "")
                        : "",
                    rooms: unit.rooms,
                    bathrooms: unit.bathrooms,
                    area: unit.area != null ? num(unit.area) + " م²" : "",
                    floor: unit.floor,
                    location: fullLocation,
                    image: absImage,
                    image_url: absImage
                };

                U.shareUnitToWhatsApp(sharePayload, window.location.href);
            });
        }
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