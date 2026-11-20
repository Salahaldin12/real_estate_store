from django.db import models


class Unit(models.Model):
    class ListingType(models.TextChoices):
        SALE = "sale", "للبيع"
        RENT = "rent", "للإيجار"

    # الرقم التعريفي id يُنشأ تلقائيًا من Django
    code = models.CharField(
        "كود الوحدة",
        max_length=50,
        blank=True,
        default="",
        db_index=True,
        help_text="مثال: U-104",
    )
    name = models.CharField("اسم الوحدة", max_length=200)
    listing_type = models.CharField("نوع العرض", max_length=10, choices=ListingType.choices)

    # حقول نصية حرة: تكتب قيمها بنفسك من لوحة الأدمن
    category = models.CharField("التصنيف", max_length=50)
    finishing = models.CharField("نوع التشطيب", max_length=50)
    floor = models.PositiveSmallIntegerField(
        "الدور", help_text="اكتب رقم الدور: 0 للدور الأرضي، 1 للأول، 2 للثاني..."
    )
    rooms = models.PositiveSmallIntegerField(
        "عدد الغرف",
        default=1,
        help_text="اكتب عدد الغرف في الوحدة",
    )
    bathrooms = models.PositiveSmallIntegerField(
        "عدد الحمامات",
        default=1,
        help_text="اكتب عدد الحمامات في الوحدة",
    )

    area = models.DecimalField("المساحة (م²)", max_digits=8, decimal_places=2)
    price = models.DecimalField("السعر", max_digits=14, decimal_places=2)

    city = models.CharField("المدينة", max_length=100)
    district = models.CharField("الحي / المنطقة", max_length=100)
    address = models.CharField("العنوان التفصيلي", max_length=255, blank=True)

    created_at = models.DateTimeField("تاريخ الإضافة", auto_now_add=True)

    class Meta:
        verbose_name = "وحدة"
        verbose_name_plural = "الوحدات"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.code} - {self.name}" if self.code else f"{self.name} (#{self.pk})"


class UnitImage(models.Model):
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name="images",
        verbose_name="الوحدة",
    )
    image = models.ImageField("الصورة", upload_to="units/%Y/%m/")
    order = models.PositiveSmallIntegerField("الترتيب", default=0)

    class Meta:
        verbose_name = "صورة"
        verbose_name_plural = "الصور"
        ordering = ["order", "id"]

    def __str__(self):
        return f"صورة {self.pk} للوحدة #{self.unit_id}"