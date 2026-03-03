"""
wasl_ai_analyzer.py
نظام وصل — محلل البيانات الذكي
يقرأ ملف Excel، يحسب KPIs، يستدعي OpenAI، ويولّد تقرير HTML + data.json
"""

import json
import os
import sys
from datetime import datetime, date
from collections import defaultdict

try:
    import openpyxl
except ImportError:
    print("جارٍ تثبيت openpyxl...")
    os.system(f"{sys.executable} -m pip install openpyxl -q")
    import openpyxl

try:
    from openai import OpenAI
except ImportError:
    print("جارٍ تثبيت openai...")
    os.system(f"{sys.executable} -m pip install openai -q")
    from openai import OpenAI


# ── إعدادات ────────────────────────────────────────────────────────────────

def load_config():
    config_path = os.path.join(os.path.dirname(__file__), "config.json")
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


# ── قراءة Excel ────────────────────────────────────────────────────────────

def read_operations(excel_path):
    """يقرأ شيت Daily Operations Data ويعيد قائمة من القواميس"""
    print("📂 جارٍ قراءة ملف Excel...")
    wb = openpyxl.load_workbook(excel_path, read_only=True, data_only=True)
    ws = wb["Daily Operations Data"]

    headers = None
    operations = []

    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            headers = row
            continue
        if row[0] is None:
            continue

        record = dict(zip(headers, row))
        operations.append(record)

    wb.close()
    print(f"✅ تم تحميل {len(operations):,} عملية")
    return operations


# ── حساب KPIs ───────────────────────────────────────────────────────────────

def calc_response_minutes(acceptance, arrival):
    """يحسب وقت الاستجابة بالدقائق من قيمتي datetime"""
    try:
        if isinstance(acceptance, datetime) and isinstance(arrival, datetime):
            diff = (arrival - acceptance).total_seconds() / 60
            return round(diff, 1) if 0 < diff < 600 else None
    except Exception:
        pass
    return None


def compute_kpis(operations):
    """يحسب جميع مؤشرات الأداء"""
    print("📊 جارٍ حساب KPIs...")

    total = len(operations)
    centers = defaultdict(lambda: {"tasks": 0, "response_times": [], "paramedics": set()})
    paramedics = defaultdict(lambda: {"tasks": 0, "response_times": []})
    response_times_all = []
    monthly = defaultdict(int)
    dept_counts = defaultdict(int)
    referral_types = defaultdict(int)

    for op in operations:
        center = op.get("Center Name") or "Unknown"
        paramedic = op.get("Paramedic") or "Unknown"
        acceptance = op.get("Acceptance Time")
        arrival = op.get("Arrival Time")
        dept = op.get("Medical Department") or "Unknown"
        ref_type = op.get("Referral Type") or "Unknown"
        ref_date = op.get("Referral Date")

        # مركز
        centers[center]["tasks"] += 1
        centers[center]["paramedics"].add(paramedic)

        # مسعف
        paramedics[paramedic]["tasks"] += 1

        # وقت الاستجابة
        rt = calc_response_minutes(acceptance, arrival)
        if rt is not None:
            centers[center]["response_times"].append(rt)
            paramedics[paramedic]["response_times"].append(rt)
            response_times_all.append(rt)

        # شهري
        if isinstance(ref_date, (datetime, date)):
            m = ref_date.month if isinstance(ref_date, datetime) else ref_date.month
            monthly[m] += 1

        dept_counts[dept] += 1
        referral_types[ref_type] += 1

    # احسب المتوسطات
    avg_response = round(sum(response_times_all) / len(response_times_all), 1) if response_times_all else 0

    centers_summary = []
    for name, data in sorted(centers.items()):
        avg_rt = round(sum(data["response_times"]) / len(data["response_times"]), 1) if data["response_times"] else 0
        centers_summary.append({
            "name": name,
            "tasks": data["tasks"],
            "avg_response": avg_rt,
            "paramedics_count": len(data["paramedics"]),
        })
    centers_summary.sort(key=lambda x: x["avg_response"])

    paramedics_summary = []
    for name, data in paramedics.items():
        avg_rt = round(sum(data["response_times"]) / len(data["response_times"]), 1) if data["response_times"] else 0
        paramedics_summary.append({"id": name, "tasks": data["tasks"], "avg_response": avg_rt})
    paramedics_summary.sort(key=lambda x: x["tasks"], reverse=True)

    top_depts = sorted(dept_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    top_types = sorted(referral_types.items(), key=lambda x: x[1], reverse=True)

    return {
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_operations": total,
        "avg_response_min": avg_response,
        "total_paramedics": len(paramedics),
        "total_centers": len(centers),
        "centers": centers_summary,
        "top_paramedics": paramedics_summary[:10],
        "monthly_distribution": {str(k): v for k, v in sorted(monthly.items())},
        "top_departments": [{"dept": d, "count": c} for d, c in top_depts],
        "referral_types": [{"type": t, "count": c} for t, c in top_types],
    }


# ── OpenAI تحليل ─────────────────────────────────────────────────────────────

def analyze_with_ai(kpis, api_key, model):
    print("🤖 جارٍ تحليل البيانات بالذكاء الاصطناعي...")
    client = OpenAI(api_key=api_key)

    centers_text = "\n".join([
        f"  - {c['name']}: {c['tasks']} مهمة | متوسط استجابة {c['avg_response']} دقيقة | {c['paramedics_count']} مسعف"
        for c in kpis["centers"]
    ])

    top_para = "\n".join([
        f"  - {p['id']}: {p['tasks']} مهمة | متوسط {p['avg_response']} دقيقة"
        for p in kpis["top_paramedics"][:5]
    ])

    prompt = f"""بيانات نظام وصل لنقل المرضى — تقرير شامل:

إجمالي العمليات: {kpis['total_operations']:,}
متوسط وقت الاستجابة الكلي: {kpis['avg_response_min']} دقيقة
عدد المسعفين: {kpis['total_paramedics']}
عدد المراكز: {kpis['total_centers']}

أداء المراكز (مرتبة من الأفضل):
{centers_text}

أفضل المسعفين أداءً:
{top_para}

أكثر التخصصات الطبية طلباً:
{chr(10).join([f"  - {d['dept']}: {d['count']} حالة" for d in kpis['top_departments']])}

أنواع التحويلات:
{chr(10).join([f"  - {t['type']}: {t['count']}" for t in kpis['referral_types']])}

بناءً على هذه البيانات، أنشئ تقريراً إشرافياً تنفيذياً شاملاً باللغة العربية يتضمن:
1. ملخص تنفيذي (فقرة واحدة)
2. تحليل أداء المراكز مع تحديد الأفضل والأضعف
3. رصد أبرز الإنجازات والمشكلات
4. توصيات تشغيلية محددة وقابلة للتنفيذ

اكتب بأسلوب مهني. بدون تنسيق markdown."""

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "أنت خبير تشغيلي في خدمات الإسعاف ونقل المرضى. تحلل البيانات وتقدم تقارير مهنية دقيقة."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=1500,
    )

    analysis = response.choices[0].message.content
    print("✅ اكتمل التحليل الذكي")
    return analysis


# ── توليد HTML ──────────────────────────────────────────────────────────────

def generate_html_report(kpis, ai_analysis, output_path):
    print("📄 جارٍ توليد تقرير HTML...")

    centers_rows = ""
    for c in kpis["centers"]:
        rt = c["avg_response"]
        if rt <= 30:
            rating = "✅ ممتاز"
            color = "#16a34a"
        elif rt <= 60:
            rating = "✅ جيد"
            color = "#16a34a"
        elif rt <= 90:
            rating = "⚠ مراجعة"
            color = "#ca8a04"
        else:
            rating = "🚨 حرج"
            color = "#dc2626"

        centers_rows += f"""
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-weight:700;">{c['name']}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;">{c['tasks']:,}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;">{c['avg_response']} د</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;">{c['paramedics_count']}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;color:{color};font-weight:700;">{rating}</td>
        </tr>"""

    para_rows = ""
    for p in kpis["top_paramedics"][:8]:
        para_rows += (
            f'<tr><td style="padding:9px 14px;border-bottom:1px solid #e2e8f0;font-weight:700;">{p["id"]}</td>'
            f'<td style="padding:9px 14px;border-bottom:1px solid #e2e8f0;text-align:center;">{p["tasks"]:,}</td>'
            f'<td style="padding:9px 14px;border-bottom:1px solid #e2e8f0;text-align:center;">{p["avg_response"]} د</td></tr>'
        )

    ai_html = ai_analysis.replace("\n", "<br>")
    now_str = datetime.now().strftime("%d/%m/%Y %H:%M")

    html = f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>التقرير الإشرافي — منصة وصل</title>
<style>
  body {{ margin:0; padding:0; background:#f0f4f8; font-family:'Segoe UI',Arial,sans-serif; direction:rtl; }}
  .wrap {{ max-width:800px; margin:30px auto; }}
  .card {{ background:#fff; border-radius:16px; margin-bottom:20px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.07); }}
  .header {{ background:linear-gradient(135deg,#060A14,#0C1120); padding:32px 36px; text-align:center; }}
  .badge {{ display:inline-block; background:rgba(0,201,167,.15); border:1px solid rgba(0,201,167,.4); border-radius:50px; padding:6px 22px; margin-bottom:16px; color:#00C9A7; font-size:12px; font-weight:700; letter-spacing:1px; }}
  h1 {{ color:#EDF0F7; font-size:26px; margin:0 0 8px; }}
  .meta {{ color:#5E7391; font-size:13px; margin:0; }}
  .kpis {{ display:grid; grid-template-columns:repeat(4,1fr); background:#0C1120; }}
  .kpi {{ text-align:center; padding:20px 8px; border-left:1px solid rgba(255,255,255,.06); }}
  .kpi:last-child {{ border-left:none; }}
  .kpi-val {{ font-size:22px; font-weight:800; }}
  .kpi-lbl {{ font-size:10px; color:#5E7391; margin-top:4px; }}
  .section {{ padding:28px 36px; }}
  .section-title {{ border-right:4px solid #00C9A7; padding-right:14px; margin-bottom:20px; }}
  .section-title h2 {{ color:#0C1120; font-size:17px; margin:0 0 4px; font-weight:800; }}
  .section-title p {{ color:#64748b; font-size:12px; margin:0; }}
  .ai-text {{ color:#1e293b; font-size:14px; line-height:2; }}
  table {{ width:100%; border-collapse:collapse; font-size:13px; }}
  thead tr {{ background:#0C1120; color:#EDF0F7; }}
  th {{ padding:10px 14px; font-weight:700; text-align:right; }}
  th:not(:first-child) {{ text-align:center; }}
  .footer {{ background:#0C1120; padding:20px 36px; text-align:center; }}
  .footer p {{ color:#5E7391; font-size:11px; margin:4px 0; }}
  .brand {{ color:#00C9A7; font-size:10px; font-weight:700; }}
</style>
</head>
<body>
<div class="wrap">

  <!-- Header -->
  <div class="card">
    <div class="header">
      <div class="badge">منصة وصل لنقل المرضى</div>
      <h1>📋 التقرير الإشرافي الشامل</h1>
      <p class="meta">{now_str} &nbsp;|&nbsp; تم الإنشاء تلقائياً بواسطة الذكاء الاصطناعي</p>
    </div>

    <!-- KPIs -->
    <div class="kpis">
      <div class="kpi">
        <div class="kpi-val" style="color:#00C9A7;">{kpis['total_operations']:,}</div>
        <div class="kpi-lbl">إجمالي العمليات</div>
      </div>
      <div class="kpi">
        <div class="kpi-val" style="color:#F6A623;">{kpis['avg_response_min']} د</div>
        <div class="kpi-lbl">متوسط الاستجابة</div>
      </div>
      <div class="kpi">
        <div class="kpi-val" style="color:#30D158;">{kpis['total_paramedics']}</div>
        <div class="kpi-lbl">المسعفون</div>
      </div>
      <div class="kpi">
        <div class="kpi-val" style="color:#0098DB;">{kpis['total_centers']}</div>
        <div class="kpi-lbl">المراكز</div>
      </div>
    </div>
  </div>

  <!-- AI Analysis -->
  <div class="card">
    <div class="section">
      <div class="section-title">
        <h2>🤖 التحليل الذكي</h2>
        <p>تحليل مُنشأ بالذكاء الاصطناعي بناءً على {kpis['total_operations']:,} عملية</p>
      </div>
      <div class="ai-text">{ai_html}</div>
    </div>
  </div>

  <!-- Centers Table -->
  <div class="card">
    <div class="section">
      <div class="section-title" style="border-color:#0098DB;">
        <h2>📍 أداء المراكز</h2>
      </div>
      <table>
        <thead>
          <tr>
            <th>المركز</th>
            <th style="text-align:center;">المهام</th>
            <th style="text-align:center;">متوسط الاستجابة</th>
            <th style="text-align:center;">المسعفون</th>
            <th style="text-align:center;">التقييم</th>
          </tr>
        </thead>
        <tbody>{centers_rows}</tbody>
      </table>
    </div>
  </div>

  <!-- Top Paramedics -->
  <div class="card">
    <div class="section">
      <div class="section-title" style="border-color:#F6A623;">
        <h2>🏅 أفضل المسعفين</h2>
      </div>
      <table>
        <thead>
          <tr>
            <th>المسعف</th>
            <th style="text-align:center;">عدد المهام</th>
            <th style="text-align:center;">متوسط الاستجابة</th>
          </tr>
        </thead>
        <tbody>
          {para_rows}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Footer -->
  <div class="card">
    <div class="footer">
      <p>هذا التقرير مُنشأ تلقائياً • منصة وصل لنقل المرضى</p>
      <p>للاستفسار تواصل مع فريق العمليات</p>
      <div style="margin-top:12px;"><span class="brand">وصل • WASL</span>
      <span style="color:#5E7391;font-size:10px;"> — نظام إدارة نقل المرضى</span></div>
    </div>
  </div>

</div>
</body>
</html>"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"✅ تم حفظ التقرير: {output_path}")


# ── حفظ data.json للـ Dashboard ─────────────────────────────────────────────

def save_data_json(kpis, ai_analysis, output_path):
    payload = {**kpis, "ai_analysis": ai_analysis}
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"✅ تم حفظ البيانات: {output_path}")


# ── main ────────────────────────────────────────────────────────────────────

def main():
    print("\n" + "═" * 50)
    print("   نظام وصل — محلل البيانات الذكي")
    print("═" * 50 + "\n")

    cfg = load_config()

    if cfg["openai_api_key"] == "YOUR_OPENAI_KEY_HERE":
        print("❌ خطأ: ضع OpenAI API Key في ملف config.json")
        sys.exit(1)

    excel_path = os.path.join(os.path.dirname(__file__), cfg["excel_path"])
    if not os.path.exists(excel_path):
        print(f"❌ ملف Excel غير موجود: {excel_path}")
        sys.exit(1)

    # 1. اقرأ البيانات
    operations = read_operations(excel_path)

    # 2. احسب KPIs
    kpis = compute_kpis(operations)

    # 3. حلّل بالذكاء الاصطناعي
    ai_analysis = analyze_with_ai(kpis, cfg["openai_api_key"], cfg.get("openai_model", "gpt-4o"))

    # 4. ولّد HTML
    report_path = os.path.join(os.path.dirname(__file__), cfg["report_output"])
    generate_html_report(kpis, ai_analysis, report_path)

    # 5. احفظ data.json
    data_path = os.path.join(os.path.dirname(__file__), cfg["data_json"])
    save_data_json(kpis, ai_analysis, data_path)

    print("\n" + "═" * 50)
    print(f"🎉 اكتمل التحليل بنجاح!")
    print(f"   📄 التقرير: {report_path}")
    print(f"   📊 البيانات: {data_path}")
    print("═" * 50 + "\n")


if __name__ == "__main__":
    main()
