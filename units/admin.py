from django.contrib import admin
from django.utils.html import format_html
from .models import Unit, UnitImage


class UnitImageInline(admin.TabularInline):
    model = UnitImage
    extra = 3  # عدد خانات رفع الصور الافتراضية التي تظهر عند فتح الوحدة
    fields = ("image", "image_preview", "order")
    readonly_fields = ("image_preview",)

    @admin.display(description="معاينة")
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px;" />',
                obj.image.url,
            )
        return "لا توجد صورة"


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "listing_type",
        "category",
        "finishing",
        "floor",
        "area",
        "price",
        "city",
        "district",
    )
    list_display_links = ("id", "name")
    list_filter = ("listing_type", "category", "finishing", "floor", "city")
    search_fields = ("name", "city", "district", "address")
    ordering = ("-created_at",)
    list_per_page = 25

    # ربط الصور بصفحة الوحدة
    inlines = [UnitImageInline]