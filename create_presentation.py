#!/usr/bin/env python3
"""
Generate the وصل (Wasl) Medical Transport Operations Analytics PowerPoint Presentation
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Cm
import copy

# ─── Brand Colors ────────────────────────────────────────────────────────────
TEAL        = RGBColor(0x00, 0x8B, 0x8B)   # primary dark teal
LIGHT_TEAL  = RGBColor(0x00, 0xC9, 0xC9)   # accent teal
WHITE       = RGBColor(0xFF, 0xFF, 0xFF)
DARK_BG     = RGBColor(0x0A, 0x1A, 0x2E)   # very dark navy
SLATE       = RGBColor(0x1A, 0x3A, 0x4A)   # medium dark slate
GOLD        = RGBColor(0xFF, 0xD7, 0x00)
LIGHT_GREY  = RGBColor(0xEE, 0xEE, 0xEE)
GREEN       = RGBColor(0x00, 0xC8, 0x7A)
RED         = RGBColor(0xFF, 0x4A, 0x4A)
ORANGE      = RGBColor(0xFF, 0x8C, 0x00)


def new_prs() -> Presentation:
    prs = Presentation()
    prs.slide_width  = Inches(13.33)
    prs.slide_height = Inches(7.5)
    return prs


def blank_slide(prs: Presentation):
    blank_layout = prs.slide_layouts[6]   # truly blank
    return prs.slides.add_slide(blank_layout)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def add_rect(slide, l, t, w, h, fill_color=None, line_color=None, line_w=None):
    from pptx.util import Pt
    shape = slide.shapes.add_shape(
        1,  # MSO_SHAPE_TYPE.RECTANGLE
        Inches(l), Inches(t), Inches(w), Inches(h)
    )
    if fill_color:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_color
    else:
        shape.fill.background()
    if line_color:
        shape.line.color.rgb = line_color
        if line_w:
            shape.line.width = Pt(line_w)
    else:
        shape.line.fill.background()
    return shape


def add_text(slide, text, l, t, w, h,
             font_size=18, bold=False, color=WHITE,
             align=PP_ALIGN.LEFT, wrap=True, italic=False, font_name="Cairo"):
    txBox = slide.shapes.add_textbox(Inches(l), Inches(t), Inches(w), Inches(h))
    tf = txBox.text_frame
    tf.word_wrap = wrap
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    run.font.name = font_name
    return txBox


def add_multiline(slide, lines, l, t, w, h,
                  font_size=14, color=WHITE, bold=False,
                  align=PP_ALIGN.RIGHT, font_name="Cairo", line_spacing=1.2):
    from pptx.util import Pt
    from pptx.oxml.ns import qn
    from lxml import etree
    txBox = slide.shapes.add_textbox(Inches(l), Inches(t), Inches(w), Inches(h))
    tf = txBox.text_frame
    tf.word_wrap = True
    for i, (txt, sz, bld, clr) in enumerate(lines):
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()
        p.alignment = align
        run = p.add_run()
        run.text = txt
        run.font.size = Pt(sz if sz else font_size)
        run.font.bold = bld if bld is not None else bold
        run.font.color.rgb = clr if clr else color
        run.font.name = font_name
    return txBox


def add_rounded_rect(slide, l, t, w, h, fill_color, radius=0.1, line_color=None):
    from pptx.util import Pt
    shape = slide.shapes.add_shape(
        5,  # ROUNDED_RECTANGLE
        Inches(l), Inches(t), Inches(w), Inches(h)
    )
    shape.adjustments[0] = radius
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    if line_color:
        shape.line.color.rgb = line_color
    else:
        shape.line.fill.background()
    return shape


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 1 — Title Slide
# ══════════════════════════════════════════════════════════════════════════════
def slide1(prs):
    slide = blank_slide(prs)

    # Dark navy background
    add_rect(slide, 0, 0, 13.33, 7.5, DARK_BG)

    # Left teal accent column
    add_rect(slide, 0, 0, 0.15, 7.5, TEAL)

    # Teal circle decoration (top right)
    from pptx.util import Pt
    circle = slide.shapes.add_shape(9, Inches(10.5), Inches(-1), Inches(4), Inches(4))
    circle.fill.solid()
    circle.fill.fore_color.rgb = RGBColor(0x00, 0x5F, 0x6B)
    circle.line.fill.background()

    # Small decorative teal circle bottom left
    c2 = slide.shapes.add_shape(9, Inches(-0.8), Inches(5.5), Inches(2.5), Inches(2.5))
    c2.fill.solid()
    c2.fill.fore_color.rgb = RGBColor(0x00, 0x5F, 0x6B)
    c2.line.fill.background()

    # Logo / brand name – Arabic "وصل"
    add_text(slide, "وصل", 1, 1.0, 11, 1.8,
             font_size=80, bold=True, color=LIGHT_TEAL,
             align=PP_ALIGN.CENTER)

    # English subtitle
    add_text(slide, "WASL", 1, 2.6, 11, 0.6,
             font_size=22, bold=True, color=WHITE,
             align=PP_ALIGN.CENTER)

    # Arabic tagline
    add_text(slide,
             "منصة ذكاء اصطناعي لإدارة عمليات النقل الطبي في الوقت الفعلي",
             0.5, 3.3, 12.3, 0.8,
             font_size=20, bold=False, color=LIGHT_GREY,
             align=PP_ALIGN.CENTER)

    # Separator line
    add_rect(slide, 2, 4.3, 9.33, 0.04, TEAL)

    # KPI cards row
    stats = [
        ("14,169", "مهمة مُسجَّلة"),
        ("20",     "مركز صحي"),
        ("30+",    "ساعة تشغيل"),
        ("Sago",   "شريك التقنية"),
    ]
    card_w = 2.8
    start_x = 0.6
    for i, (val, lbl) in enumerate(stats):
        x = start_x + i * 3.1
        add_rounded_rect(slide, x, 4.6, card_w, 1.5,
                         RGBColor(0x0E, 0x2A, 0x40), radius=0.15)
        add_text(slide, val, x, 4.65, card_w, 0.7,
                 font_size=26, bold=True, color=LIGHT_TEAL,
                 align=PP_ALIGN.CENTER)
        add_text(slide, lbl, x, 5.3, card_w, 0.5,
                 font_size=13, bold=False, color=LIGHT_GREY,
                 align=PP_ALIGN.CENTER)

    # Bottom bar
    add_rect(slide, 0, 7.0, 13.33, 0.5, TEAL)
    add_text(slide, "هاكاثون 2026 — التجمع الصحي الأول",
             0, 7.05, 13.33, 0.4,
             font_size=12, color=WHITE, align=PP_ALIGN.CENTER)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 2 — تعريف المشكلة  (01)
# ══════════════════════════════════════════════════════════════════════════════
def slide2(prs):
    slide = blank_slide(prs)
    add_rect(slide, 0, 0, 13.33, 7.5, DARK_BG)

    # Header strip
    add_rect(slide, 0, 0, 13.33, 1.1, SLATE)
    add_text(slide, "01", 0.3, 0.05, 1.5, 0.9,
             font_size=40, bold=True, color=TEAL, align=PP_ALIGN.LEFT)
    add_text(slide, "تعريف المشكلة", 1.8, 0.2, 10, 0.7,
             font_size=28, bold=True, color=WHITE, align=PP_ALIGN.RIGHT)

    # Three question cards
    questions = [
        ("ما هي المشكلة بالضبط؟",
         "سائق الإسعاف يحصل يومياً على أوامر\nعشوائية — أولويات غير واضحة،\nبيانات متفرقة، وقرارات تُتخذ\nبلا أساس تحليلي."),
        ("متى يحدث هذا؟",
         "94.3٪ من الطلبات تجاوزت\nمتوسط انتظار 64 دقيقة\nخلال ساعات الذروة اليومية."),
        ("من المتأثرون؟",
         "219 خدمة إسعاف في\nالتجمع الصحي الأول وحده\nتعمل دون لوحة تحكم\nموحدة أو تحليل فعّال."),
    ]
    card_w = 3.9
    for i, (q, body) in enumerate(questions):
        x = 0.4 + i * 4.3
        add_rounded_rect(slide, x, 1.4, card_w, 4.8,
                         RGBColor(0x0E, 0x2A, 0x40), radius=0.12)
        # question icon accent
        add_rect(slide, x, 1.4, card_w, 0.08, TEAL)
        add_text(slide, "؟", x + 0.1, 1.45, 0.8, 0.7,
                 font_size=30, bold=True, color=TEAL, align=PP_ALIGN.LEFT)
        add_text(slide, q, x, 1.6, card_w, 0.65,
                 font_size=15, bold=True, color=LIGHT_TEAL,
                 align=PP_ALIGN.RIGHT)
        add_text(slide, body, x + 0.2, 2.35, card_w - 0.3, 3.6,
                 font_size=13, color=LIGHT_GREY, align=PP_ALIGN.RIGHT)

    # Bottom stat highlight
    add_rounded_rect(slide, 1.5, 6.3, 10.33, 0.85, TEAL, radius=0.1)
    add_text(slide,
             "كل دقيقة تأخير في الإسعاف تزيد نسبة الوفاة بنسبة تصل إلى 10٪",
             1.5, 6.32, 10.33, 0.8,
             font_size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 3 — الحل: ما هو وصل؟  (02-A)
# ══════════════════════════════════════════════════════════════════════════════
def slide3(prs):
    slide = blank_slide(prs)
    add_rect(slide, 0, 0, 13.33, 7.5, DARK_BG)
    add_rect(slide, 0, 0, 13.33, 1.1, SLATE)
    add_text(slide, "02", 0.3, 0.05, 1.5, 0.9,
             font_size=40, bold=True, color=TEAL, align=PP_ALIGN.LEFT)
    add_text(slide, "الحل ومواءمة الفكرة للمسار", 1.8, 0.2, 10, 0.7,
             font_size=28, bold=True, color=WHITE, align=PP_ALIGN.RIGHT)

    # "ما هو وصل؟" heading
    add_text(slide, "ما هو وصل؟", 0.5, 1.3, 12, 0.6,
             font_size=22, bold=True, color=LIGHT_TEAL, align=PP_ALIGN.RIGHT)

    features = [
        ("📊", "لوحة تحكم مباشرة",
         "تعرض جميع بيانات النقل الطبي\nفي الوقت الفعلي بشكل تفاعلي"),
        ("📄", "تقارير PDF",
         "تقارير تفصيلية تُولَّد\nتلقائياً وتُرسَل بريدياً"),
        ("🔔", "تنبيهات فورية",
         "إشعارات ذكية فور تجاوز\nأي مؤشر للحد المسموح"),
        ("📈", "تحليل مقارن",
         "مقارنة الأداء بين المراكز\nوالفترات الزمنية المختلفة"),
    ]
    card_w = 2.9
    for i, (icon, title, desc) in enumerate(features):
        x = 0.4 + i * 3.15
        add_rounded_rect(slide, x, 2.1, card_w, 3.2,
                         RGBColor(0x0E, 0x2A, 0x40), radius=0.12)
        add_rect(slide, x, 2.1, card_w, 0.07, TEAL)
        add_text(slide, icon, x, 2.2, card_w, 0.7,
                 font_size=28, align=PP_ALIGN.CENTER, color=WHITE)
        add_text(slide, title, x, 2.95, card_w, 0.55,
                 font_size=15, bold=True, color=LIGHT_TEAL,
                 align=PP_ALIGN.CENTER)
        add_text(slide, desc, x + 0.15, 3.55, card_w - 0.3, 1.5,
                 font_size=12, color=LIGHT_GREY, align=PP_ALIGN.RIGHT)

    # Comparison table header
    add_rect(slide, 0.4, 5.5, 12.53, 0.5, TEAL)
    add_text(slide, "وصل", 0.4, 5.52, 3.5, 0.44,
             font_size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    add_text(slide, "المنافس التقليدي", 3.9, 5.52, 5.5, 0.44,
             font_size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    add_text(slide, "المعيار", 9.4, 5.52, 3.5, 0.44,
             font_size=14, bold=True, color=WHITE, align=PP_ALIGN.RIGHT)

    rows = [
        ("✅ لوحة مباشرة", "❌ تقارير يدوية", "البيانات الفورية"),
        ("✅ ذكاء اصطناعي", "❌ لا يوجد", "التحليل التنبؤي"),
    ]
    for j, (v1, v2, lbl) in enumerate(rows):
        y = 6.05 + j * 0.5
        bg = RGBColor(0x0E, 0x2A, 0x40) if j % 2 == 0 else RGBColor(0x12, 0x30, 0x48)
        add_rect(slide, 0.4, y, 12.53, 0.48, bg)
        add_text(slide, v1, 0.4, y + 0.05, 3.5, 0.38,
                 font_size=12, color=GREEN, align=PP_ALIGN.CENTER)
        add_text(slide, v2, 3.9, y + 0.05, 5.5, 0.38,
                 font_size=12, color=RED, align=PP_ALIGN.CENTER)
        add_text(slide, lbl, 9.4, y + 0.05, 3.5, 0.38,
                 font_size=12, color=LIGHT_GREY, align=PP_ALIGN.RIGHT)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 4 — الحل: تفاصيل المشكلة والمقارنة (02-B)
# ══════════════════════════════════════════════════════════════════════════════
def slide4(prs):
    slide = blank_slide(prs)
    add_rect(slide, 0, 0, 13.33, 7.5, DARK_BG)
    add_rect(slide, 0, 0, 13.33, 1.1, SLATE)
    add_text(slide, "02", 0.3, 0.05, 1.5, 0.9,
             font_size=40, bold=True, color=TEAL, align=PP_ALIGN.LEFT)
    add_text(slide, "مقارنة شاملة: وصل مقابل الحلول التقليدية", 1.8, 0.2, 10, 0.7,
             font_size=26, bold=True, color=WHITE, align=PP_ALIGN.RIGHT)

    headers = ["وصل ✅", "الحل التقليدي ❌", "المعيار"]
    col_x   = [0.4, 4.7, 9.2]
    col_w   = [4.1, 4.3, 3.9]

    # Header row
    for k, (hdr, cx, cw) in enumerate(zip(headers, col_x, col_w)):
        add_rounded_rect(slide, cx, 1.25, cw, 0.55,
                         TEAL if k == 0 else (SLATE if k == 1 else RGBColor(0x1C, 0x3A, 0x55)),
                         radius=0.05)
        add_text(slide, hdr, cx, 1.28, cw, 0.48,
                 font_size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

    comparisons = [
        ("لوحة تحكم لحظية تفاعلية", "جداول بيانات ثابتة", "عرض البيانات"),
        ("تنبيهات ذكية فورية", "مراجعة يدوية دورية", "آلية التنبيه"),
        ("تحليل AI تنبؤي", "تقارير وصفية فقط", "نوع التحليل"),
        ("تقارير PDF تلقائية بالبريد", "طباعة يدوية", "التقارير"),
        ("تكامل مع Google Sheets", "أنظمة منعزلة", "التكامل"),
        ("0 مبرمجين – 72 ساعة", "فريق تطوير ضخم – أشهر", "التطوير"),
    ]

    for j, (v1, v2, lbl) in enumerate(comparisons):
        y = 1.95 + j * 0.78
        bg = RGBColor(0x0E, 0x2A, 0x40) if j % 2 == 0 else RGBColor(0x12, 0x30, 0x48)
        for k, (val, cx, cw) in enumerate(zip([v1, v2, lbl], col_x, col_w)):
            add_rect(slide, cx, y, cw, 0.72, bg)
            clr = GREEN if k == 0 else (RED if k == 1 else LIGHT_GREY)
            add_text(slide, val, cx + 0.1, y + 0.1, cw - 0.2, 0.55,
                     font_size=12, color=clr, align=PP_ALIGN.CENTER)

    # Bottom note
    add_rect(slide, 0.4, 6.65, 12.53, 0.6, RGBColor(0x00, 0x5F, 0x5F))
    add_text(slide,
             "وصل أُنجز بـ 12,500 ريال مقابل تكلفة تقليدية تتجاوز 500,000 ريال — توفير 97.5٪",
             0.4, 6.67, 12.53, 0.55,
             font_size=13, bold=True, color=GOLD, align=PP_ALIGN.CENTER)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 5 — دور الذكاء الاصطناعي  (03)
# ══════════════════════════════════════════════════════════════════════════════
def slide5(prs):
    slide = blank_slide(prs)
    add_rect(slide, 0, 0, 13.33, 7.5, DARK_BG)
    add_rect(slide, 0, 0, 13.33, 1.1, SLATE)
    add_text(slide, "03", 0.3, 0.05, 1.5, 0.9,
             font_size=40, bold=True, color=TEAL, align=PP_ALIGN.LEFT)
    add_text(slide, "دور الذكاء الاصطناعي في الحل", 1.8, 0.2, 10, 0.7,
             font_size=28, bold=True, color=WHITE, align=PP_ALIGN.RIGHT)

    ai_roles = [
        ("🤖", "إرسال ذكي بالذكاء الاصطناعي",
         "تحليل بيانات الأولوية والموقع\nلتوجيه الإسعاف الأمثل فورياً"),
        ("🔮", "تحليل استشرافي",
         "التنبؤ بأوقات الذروة\nواحتياجات الموارد مسبقاً"),
        ("⚡", "تنبيهات ذكية فورية",
         "Claude AI يحلل الأنماط\nويُرسل تحذيرات استباقية"),
        ("🔍", "كشف الأنماط والاتجاهات",
         "تحديد المشكلات المتكررة\nوالفجوات في تغطية الخدمة"),
        ("📋", "توليد تقارير مقارنة",
         "تقارير مفصّلة تُولَّد\nتلقائياً بالذكاء الاصطناعي"),
    ]

    # Big center teal circle (decorative)
    c = slide.shapes.add_shape(9, Inches(5.4), Inches(1.9), Inches(2.53), Inches(2.53))
    c.fill.solid()
    c.fill.fore_color.rgb = RGBColor(0x00, 0x5F, 0x6B)
    c.line.fill.background()
    add_text(slide, "Claude\nAI", 5.4, 2.2, 2.53, 1.8,
             font_size=22, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

    positions = [
        (0.3, 1.6),   # left top
        (0.3, 4.0),   # left bottom
        (10.3, 1.6),  # right top
        (10.3, 4.0),  # right bottom
        (4.8, 5.8),   # bottom center
    ]
    for i, ((icon, title, desc), (x, y)) in enumerate(zip(ai_roles, positions)):
        add_rounded_rect(slide, x, y, 2.7, 1.9,
                         RGBColor(0x0E, 0x2A, 0x40), radius=0.12)
        add_rect(slide, x, y, 2.7, 0.06, TEAL)
        add_text(slide, icon + " " + title, x + 0.1, y + 0.1, 2.5, 0.55,
                 font_size=12, bold=True, color=LIGHT_TEAL,
                 align=PP_ALIGN.RIGHT)
        add_text(slide, desc, x + 0.1, y + 0.65, 2.5, 1.1,
                 font_size=11, color=LIGHT_GREY, align=PP_ALIGN.RIGHT)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 6 — منهجية البناء و Vibe Engineering  (04)
# ══════════════════════════════════════════════════════════════════════════════
def slide6(prs):
    slide = blank_slide(prs)
    add_rect(slide, 0, 0, 13.33, 7.5, DARK_BG)
    add_rect(slide, 0, 0, 13.33, 1.1, SLATE)
    add_text(slide, "04", 0.3, 0.05, 1.5, 0.9,
             font_size=40, bold=True, color=TEAL, align=PP_ALIGN.LEFT)
    add_text(slide, "منهجية البناء — Vibe Engineering", 1.8, 0.2, 10, 0.7,
             font_size=28, bold=True, color=WHITE, align=PP_ALIGN.RIGHT)

    # Vibe Engineering flow
    add_text(slide, "مبدأ Vibe Engineering", 0.4, 1.2, 12.53, 0.5,
             font_size=16, bold=True, color=LIGHT_TEAL, align=PP_ALIGN.RIGHT)

    steps = [
        "مشكلة\nتجارية",
        "وصفها\nبدقة لـ Claude",
        "Claude\nيصمم",
        "Make.com\nيبني",
        "النظام\nيعمل ✅",
    ]
    arrow = "→"
    step_w = 2.0
    for i, step in enumerate(steps):
        x = 0.4 + i * 2.55
        clr = TEAL if i in [0, 4] else RGBColor(0x0E, 0x2A, 0x40)
        add_rounded_rect(slide, x, 1.8, step_w, 1.2, clr, radius=0.12)
        add_text(slide, step, x, 1.85, step_w, 1.1,
                 font_size=12, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        if i < len(steps) - 1:
            add_text(slide, arrow, x + step_w, 2.15, 0.55, 0.5,
                     font_size=18, color=TEAL, align=PP_ALIGN.CENTER)

    # Tools grid
    add_text(slide, "الأدوات المستخدمة", 0.4, 3.2, 12.53, 0.5,
             font_size=16, bold=True, color=LIGHT_TEAL, align=PP_ALIGN.RIGHT)

    tools = [
        ("🤖 Claude AI", "التصميم والتحليل الذكي"),
        ("⚙️ Make.com", "أتمتة سير العمل"),
        ("📊 Google Sheets", "قاعدة البيانات الحية"),
        ("🌐 GitHub Pages", "استضافة مجانية"),
        ("📜 Apps Script", "البرمجة النصية"),
        ("📧 Gmail API", "إرسال التقارير"),
    ]
    tool_w = 3.9
    for i, (name, desc) in enumerate(tools):
        x = 0.4 + (i % 3) * 4.3
        y = 3.8 + (i // 3) * 1.25
        add_rounded_rect(slide, x, y, tool_w, 1.1,
                         RGBColor(0x0E, 0x2A, 0x40), radius=0.1)
        add_rect(slide, x, y, tool_w, 0.06, LIGHT_TEAL)
        add_text(slide, name, x + 0.1, y + 0.1, tool_w - 0.2, 0.45,
                 font_size=13, bold=True, color=LIGHT_TEAL,
                 align=PP_ALIGN.RIGHT)
        add_text(slide, desc, x + 0.1, y + 0.55, tool_w - 0.2, 0.45,
                 font_size=11, color=LIGHT_GREY, align=PP_ALIGN.RIGHT)

    # Stats banner
    add_rect(slide, 0, 6.9, 13.33, 0.6, TEAL)
    stats_txt = "0 مبرمجين   |   72 ساعة بناء   |   12,500 ريال (بدلاً من 500,000 ريال)   |   توفير 97.5٪"
    add_text(slide, stats_txt, 0, 6.92, 13.33, 0.55,
             font_size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 7 — استعراض المنتج  (05)
# ══════════════════════════════════════════════════════════════════════════════
def slide7(prs):
    slide = blank_slide(prs)
    add_rect(slide, 0, 0, 13.33, 7.5, DARK_BG)
    add_rect(slide, 0, 0, 13.33, 1.1, SLATE)
    add_text(slide, "05", 0.3, 0.05, 1.5, 0.9,
             font_size=40, bold=True, color=TEAL, align=PP_ALIGN.LEFT)
    add_text(slide, "استعراض المنتج وتجربة المستخدم", 1.8, 0.2, 10, 0.7,
             font_size=28, bold=True, color=WHITE, align=PP_ALIGN.RIGHT)

    # Steps to use
    add_text(slide, "ثلاث خطوات بسيطة للبدء", 0.5, 1.2, 12, 0.5,
             font_size=18, bold=True, color=LIGHT_TEAL, align=PP_ALIGN.RIGHT)

    user_steps = [
        ("1", "افتح الرابط",
         "ادخل إلى لوحة التحكم عبر\nأي متصفح أو جهاز محمول"),
        ("2", "تحكم في اللوحة",
         "راقب المهام والمراكز\nوحلل البيانات الفورية"),
        ("3", "التقارير تصلك",
         "تقارير PDF تُرسَل تلقائياً\nإلى بريدك الإلكتروني"),
    ]
    for i, (num, title, desc) in enumerate(user_steps):
        x = 0.5 + i * 4.25
        # Number circle
        circ = slide.shapes.add_shape(9, Inches(x + 1.3), Inches(1.9),
                                       Inches(1.0), Inches(1.0))
        circ.fill.solid()
        circ.fill.fore_color.rgb = TEAL
        circ.line.fill.background()
        add_text(slide, num, x + 1.3, 1.95, 1.0, 0.85,
                 font_size=26, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_rounded_rect(slide, x, 3.1, 3.8, 3.0,
                         RGBColor(0x0E, 0x2A, 0x40), radius=0.12)
        add_text(slide, title, x, 3.2, 3.8, 0.55,
                 font_size=16, bold=True, color=LIGHT_TEAL,
                 align=PP_ALIGN.CENTER)
        add_text(slide, desc, x + 0.2, 3.8, 3.4, 2.0,
                 font_size=13, color=LIGHT_GREY, align=PP_ALIGN.CENTER)

    # Mock dashboard preview box
    add_rounded_rect(slide, 0.5, 6.25, 12.33, 0.9,
                     RGBColor(0x0A, 0x1E, 0x30), radius=0.1)
    add_rect(slide, 0.5, 6.25, 12.33, 0.06, TEAL)
    add_text(slide,
             "🌐  wasl-dashboard.github.io  — لوحة تحكم مباشرة  |  وصل للنقل الطبي",
             0.5, 6.28, 12.33, 0.85,
             font_size=14, color=LIGHT_TEAL, align=PP_ALIGN.CENTER, bold=True)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 8 — الأثر المستقبلي وخطة التطوير  (06)
# ══════════════════════════════════════════════════════════════════════════════
def slide8(prs):
    slide = blank_slide(prs)
    add_rect(slide, 0, 0, 13.33, 7.5, DARK_BG)
    add_rect(slide, 0, 0, 13.33, 1.1, SLATE)
    add_text(slide, "06", 0.3, 0.05, 1.5, 0.9,
             font_size=40, bold=True, color=TEAL, align=PP_ALIGN.LEFT)
    add_text(slide, "الأثر المستقبلي وخطة التطوير", 1.8, 0.2, 10, 0.7,
             font_size=28, bold=True, color=WHITE, align=PP_ALIGN.RIGHT)

    # Timeline
    timeline = [
        ("الآن", "أول مستشفى في التجمع الصحي الأول\n(المرحلة 3 — مباشر)", TEAL),
        ("2026", "التجمع الصحي الأول بالكامل\n(تقارب المرحلة الأولى)", LIGHT_TEAL),
        ("2027", "13 تجمعاً وطنياً\n10 مناطق إقليمية", GREEN),
        ("2028", "5 دول خليجية\nتوسع إقليمي", GOLD),
    ]

    # Horizontal timeline bar
    add_rect(slide, 0.8, 2.9, 11.73, 0.06, TEAL)

    tl_x = [0.8, 3.9, 7.0, 10.0]
    for i, ((yr, desc, clr), x) in enumerate(zip(timeline, tl_x)):
        # Dot
        dot = slide.shapes.add_shape(9, Inches(x + 1.2), Inches(2.7),
                                      Inches(0.46), Inches(0.46))
        dot.fill.solid()
        dot.fill.fore_color.rgb = clr
        dot.line.fill.background()
        # Year label
        add_text(slide, yr, x, 1.6, 2.8, 0.6,
                 font_size=18, bold=True, color=clr, align=PP_ALIGN.CENTER)
        # Description card
        add_rounded_rect(slide, x, 3.2, 2.8, 1.6,
                         RGBColor(0x0E, 0x2A, 0x40), radius=0.1)
        add_text(slide, desc, x + 0.1, 3.3, 2.6, 1.4,
                 font_size=11, color=LIGHT_GREY, align=PP_ALIGN.CENTER)

    # KPI row
    kpis = [
        ("+600", "مستشفى هدف"),
        ("14 شهراً", "نقطة التعادل"),
        ("686٪", "عائد الاستثمار"),
    ]
    kpi_w = 3.8
    for i, (val, lbl) in enumerate(kpis):
        x = 0.5 + i * 4.2
        add_rounded_rect(slide, x, 5.1, kpi_w, 1.4, TEAL, radius=0.12)
        add_text(slide, val, x, 5.15, kpi_w, 0.75,
                 font_size=30, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_text(slide, lbl, x, 5.85, kpi_w, 0.55,
                 font_size=13, color=LIGHT_GREY, align=PP_ALIGN.CENTER)

    # Next steps
    add_text(slide, "الخطوات التالية الفورية:", 0.5, 6.65, 12, 0.4,
             font_size=13, bold=True, color=LIGHT_TEAL, align=PP_ALIGN.RIGHT)
    next_steps = "① التوسع داخل التجمع الصحي الأول   ② توقيع اتفاقية شراكة   ③ تطوير تطبيق الجوال"
    add_text(slide, next_steps, 0.5, 7.05, 12, 0.35,
             font_size=11, color=LIGHT_GREY, align=PP_ALIGN.RIGHT)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 9 — شكراً لكم  (Thank You)
# ══════════════════════════════════════════════════════════════════════════════
def slide9(prs):
    slide = blank_slide(prs)
    add_rect(slide, 0, 0, 13.33, 7.5, DARK_BG)

    # Large teal gradient arc decoration
    arc = slide.shapes.add_shape(9, Inches(8), Inches(-1.5), Inches(7), Inches(7))
    arc.fill.solid()
    arc.fill.fore_color.rgb = RGBColor(0x00, 0x5F, 0x6B)
    arc.line.fill.background()

    # Bottom teal arc
    arc2 = slide.shapes.add_shape(9, Inches(-1.5), Inches(5), Inches(6), Inches(6))
    arc2.fill.solid()
    arc2.fill.fore_color.rgb = RGBColor(0x00, 0x4A, 0x55)
    arc2.line.fill.background()

    # Thank you texts
    add_text(slide, "شكراً لكم", 0.5, 1.2, 12.33, 1.6,
             font_size=70, bold=True, color=WHITE,
             align=PP_ALIGN.CENTER)
    add_text(slide, "THANK YOU", 0.5, 2.8, 12.33, 0.8,
             font_size=28, bold=False, color=LIGHT_TEAL,
             align=PP_ALIGN.CENTER)

    # Separator
    add_rect(slide, 3, 3.8, 7.33, 0.05, TEAL)

    # Tagline
    add_text(slide,
             "وصل — بُنيت من داخل سيارة الإسعاف، تُنقذ الأرواح بالبيانات",
             0.5, 4.0, 12.33, 0.7,
             font_size=16, bold=True, color=LIGHT_TEAL,
             align=PP_ALIGN.CENTER)

    # Brand
    add_text(slide, "وصل  |  WASL", 0.5, 4.85, 12.33, 0.6,
             font_size=20, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

    # Footer info
    add_rect(slide, 0, 6.8, 13.33, 0.7, TEAL)
    add_text(slide,
             "هاكاثون 2026   |   التجمع الصحي الأول   |   المملكة العربية السعودية",
             0, 6.83, 13.33, 0.6,
             font_size=13, color=WHITE, align=PP_ALIGN.CENTER)


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════
def main():
    prs = new_prs()

    slide1(prs)
    slide2(prs)
    slide3(prs)
    slide4(prs)
    slide5(prs)
    slide6(prs)
    slide7(prs)
    slide8(prs)
    slide9(prs)

    out = "/home/user/Medical-Transport-Operations-Analytics/وصل_عرض_تقديمي.pptx"
    prs.save(out)
    print(f"✅  Saved → {out}")
    print(f"   Slides: {len(prs.slides)}")


if __name__ == "__main__":
    main()
