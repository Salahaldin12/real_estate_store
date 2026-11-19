/* دوال مشتركة بين صفحة البحث وصفحة تفاصيل الوحدة */
(function (global) {
    "use strict";

    // رقم الواتساب بالصيغة الدولية بدون + ولا أصفار
    var WHATSAPP_NUMBER = "201114842007";

    var nf = new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 });

    var ORDINALS = ["الأرضي", "الأول", "الثاني", "الثالث", "الرابع", "الخامس",
        "السادس", "السابع", "الثامن", "التاسع", "العاشر"];

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

    // 0 -> "الدور الأرضي"، 3 -> "الدور الثالث"، 14 -> "الدور ١٤"
    function floorLabel(floor) {
        var n = Number(floor);
        if (isNaN(n)) return "";
        return "الدور " + (ORDINALS[n] || num(n));
    }

    function unitPath(id) {
        return "/unit/" + id + "/";
    }

    // رابط الواتساب: رسالة جاهزة فيها اسم الوحدة ورقمها ورابط صفحتها
    function whatsappLink(unit) {
        var pageUrl = window.location.origin + unitPath(unit.id);
        var text = "مرحبًا، أرغب في الاستفسار عن هذه الوحدة:\n" +
            unit.name + "\n" +
            "رقم الوحدة: " + unit.id + "\n" +
            "رابط الوحدة: " + pageUrl;
        return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);
    }

    /* رسم واجهة عمارة يُضاء فيها دور الوحدة (يظهر عند عدم وجود صور) */
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

        return svg + "</svg>";
    }

    var ICONS = {
        pin: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
        area: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
        floor: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 20h18M5 20V8l7-4 7 4v12M9 20v-6h6v6"/></svg>',
        finish: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 20l9-9M13 11l-2-2 6-6 4 4-6 6-2-2z"/></svg>',
        photos: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 17l-5-5-9 7"/></svg>',
        chevron: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
        chat: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<path stroke-width="1.8" d="M5 3h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7l-4.5 4v-4H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>' +
            '<path stroke-width="3.2" transform="translate(7.4 5.2) scale(0.4)" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>' +
            '</svg>'
    };

    global.Units = {
        esc: esc,
        num: num,
        floorLabel: floorLabel,
        unitPath: unitPath,
        whatsappLink: whatsappLink,
        elevation: elevation,
        icons: ICONS
    };
})(window);
