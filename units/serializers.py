from rest_framework import serializers

from .models import Unit, UnitImage


class UnitImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitImage
        fields = ("id", "image", "order")


class UnitSerializer(serializers.ModelSerializer):
    # نص عربي مقروء لنوع العرض ("للبيع" / "للإيجار")
    listing_type_display = serializers.CharField(source="get_listing_type_display", read_only=True)

    # كل صور الوحدة + الصورة الرئيسية (أول صورة)
    images = UnitImageSerializer(many=True, read_only=True)
    main_image = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = (
            "id",
            "code",
            "name",
            "listing_type",
            "listing_type_display",
            "category",
            "finishing",
            "floor",
            "rooms",
            "bathrooms",
            "area",
            "price",
            "city",
            "district",
            "address",
            "main_image",
            "images",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def get_main_image(self, obj):
        first = next(iter(obj.images.all()), None)
        if first is None:
            return None
        url = first.image.url
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request else url