# ⚡ دليل البدء السريع — Wasl AI v2.0

## 🎯 البدء في 5 دقائق

### الخطوة 1️⃣: الملفات الجديدة

تم إضافة **5 ملفات JS جديدة + وثائق شاملة**:

```bash
src/predictions.js        # محرك التنبؤ (700 سطر)
src/responseEngine.js     # نظام الاستجابة (650 سطر)
src/alertSystem.js        # نظام التنبيهات (550 سطر)
src/waslAI.js            # التكامل الرئيسي (450 سطر)
tests.js                 # الاختبارات (400 سطر)
```

---

### الخطوة 2️⃣: التشغيل الأساسي

```javascript
// 1. أضف في index.html (قبل </body>)
<script src="src/waslAI.js"></script>

// 2. استخدام بسيط
const wasl = new WaslAI(missionData);

// 3. الحصول على تقرير
const assessment = wasl.assessCrisis();
console.log(assessment.crisisPrediction.likelihood);
// النتيجة: 65.5% احتمالية أزمة
```

---

### الخطوة 3️⃣: 3 وظائف رئيسية

```javascript
// 1️⃣ تقييم الأزمة الحالية
const assessment = wasl.assessCrisis();
// → { kpis, anomalies, crisisPrediction, centerRisks }

// 2️⃣ الحصول على خطة الاستجابة
const plan = wasl.getResponsePlan();
// → { phases: { immediate, shortTerm, mediumTerm }, resources }

// 3️⃣ التنبيهات النشطة
const alerts = wasl.getAlerts();
// → [{ id, type, severity, title, message, actions }]

// 4️⃣ لوحة التحكم (مباشر وسهل)
const dashboard = wasl.getDashboardSummary();
// → { healthMeter, keyMetrics, alerts, anomalies, topRisks }
```

---

## 📊 أمثلة عملية

### مثال 1️⃣: عرض لوحة التحكم

```javascript
const wasl = new WaslAI(missionData);
const dash = wasl.getDashboardSummary();

console.log(`
  📊 لوحة التحكم — ${new Date().toLocaleString('ar-SA')}
  ────────────────────────────────
  🔴 الصحة: ${dash.healthMeter.score}/100 (${dash.healthMeter.level})
  📈 البيانات:
     • إجمالي: ${dash.keyMetrics.totalMissions} مهمة
     • متوسط: ${dash.keyMetrics.avgResponse} د
     • تأخير: ${dash.keyMetrics.lateRate}%
  
  🔔 التنبيهات: ${dash.alerts.count}
     • حرجة: ${dash.alerts.critical}
     • عالية: ${dash.alerts.high}
  
  ⚠️ أهم المخاطر:
     ${dash.topRisks.map(r => `${r.center}: ${r.response} ${r.status}`).join('\n     ')}
`);
```

### مثال 2️⃣: تنفيذ الخطة الفورية

```javascript
const wasl = new WaslAI(missionData);
const plan = wasl.getResponsePlan();

if (plan.crisisLevel === 'critical') {
  console.log('🚨 وضع حرج! تنفيذ الإجراءات الفورية:');
  
  plan.phases.immediate.actions.forEach(action => {
    console.log(`✓ ${action.action}`);
    console.log(`  ${action.detail}`);
    console.log(`  التأثير: ${action.impact}`);
  });
  
  // عملياً: أرسل إلى فريق العمليات
  // sendPushNotification(plan.phases.immediate.actions);
}
```

### مثال 3️⃣: معالجة التنبيهات

```javascript
const wasl = new WaslAI(missionData);
const alerts = wasl.getAlerts();

// عرض التنبيهات حسب الأولوية
const critical = alerts.filter(a => a.severity === 'critical');
const high = alerts.filter(a => a.severity === 'high');

console.log(`
  🔴 تنبيهات حرجة: ${critical.length}
  ${critical.map(a => `  • ${a.title}`).join('\n')}
  
  🟠 تنبيهات عالية: ${high.length}
  ${high.map(a => `  • ${a.title}`).join('\n')}
`);

// أرسل عبر قنوات مختلفة
alerts.forEach(alert => {
  if (alert.severity === 'critical') {
    sendSMS(alert.message);           // SMS للحرجة
    sendPushNotification(alert);       // Push فوري
  } else {
    sendEmail(alert);                  // Email للعالية
  }
});
```

---

## 🧪 تشغيل الاختبارات

```bash
# تشغيل جميع الاختبارات
node tests.js

# النتيجة:
# ✅ 16+ اختبار تمرير بنجاح
# 📊 النتائج: 16 نجح، 0 فشل
```

---

## 📚 الملفات الأساسية

```
قراءة سريعة:
├── 1️⃣ هذا الملف (QUICKSTART.md) — 5 دقائق
├── 2️⃣ PROJECT_SUMMARY.md — 15 دقيقة
└── 3️⃣ AI_INTEGRATION_GUIDE.md — 30 دقيقة

البحث المتقدم:
├── predictions.js — وثائق API مفصلة
├── responseEngine.js — توليد الإجراءات
├── alertSystem.js — نظام التنبيهات
└── DEVELOPMENT_PLAN.md — خطة كاملة
```

---

## 🎯 الحالات الاستخدام الشائعة

### Use Case 1️⃣: مراقبة

```javascript
// تحديث كل 30 ثانية
setInterval(() => {
  const assessment = wasl.assessCrisis();
  updateUI(assessment);
}, 30000);
```

### Use Case 2️⃣: تنبيهات تلقائية

```javascript
const assessment = wasl.assessCrisis();
if (assessment.crisisPrediction.likelihood > 70) {
  const alerts = wasl.getAlerts();
  alerts.forEach(alert => {
    if (alert.severity === 'critical') {
      notifyOperations(alert);
    }
  });
}
```

### Use Case 3️⃣: تقارير يومية

```javascript
// كل صباح 7 صباحاً
schedule('0 7 * * *', () => {
  const assessment = wasl.assessCrisis();
  const plan = wasl.getResponsePlan();
  sendDailyReport({
    assessment,
    plan,
    timestamp: new Date()
  });
});
```

---

## 🔧 التكامل مع index.html

### الطريقة 1️⃣: داخل السكريبت الموجود

```html
<!-- في index.html -->
<script>
  // بعد تحميل البيانات
  fetch('data.json')
    .then(r => r.json())
    .then(data => {
      const wasl = new WaslAI(data);
      
      // تحديث الواجهة
      document.getElementById('crisisLevel').textContent = 
        wasl.assessCrisis().crisisPrediction.likelihood;
      
      // عرض الخطة
      const plan = wasl.getResponsePlan();
      displayPlan(plan);
    });
</script>
```

### الطريقة 2️⃣: ملف منفصل

```html
<!-- في index.html -->
<script src="src/waslAI.js"></script>
<script src="app.js"></script>

<!-- في app.js -->
const missionData = loadData();
const wasl = new WaslAI(missionData);
runDashboard(wasl);
```

---

## ⚠️ المشاكل الشائعة

### مشكلة 1️⃣: البيانات غير متوافقة

```javascript
// ❌ خطأ: أسماء أعمدة مختلفة
const data = [{ 
  response: 15,    // خطأ: يجب 'Response Time (min)'
  dispatch: 2
}];

// ✅ صحيح
const data = [{
  'Response Time (min)': 15,
  'Dispatch Time (min)': 2
}];
```

### مشكلة 2️⃣: أداء بطيء

```javascript
// ❌ خطأ: إعادة حساب في كل مرة
for (let i = 0; i < 100; i++) {
  wasl.assessCrisis();  // بطيء جداً!
}

// ✅ صحيح: استخدام النتيجة مباشرة
const assessment = wasl.assessCrisis();
// استخدم assessment بدلاً من إعادة الحساب
```

---

## 📞 الدعم السريع

```
1️⃣ تشغيل الاختبارات:
   node tests.js

2️⃣ اقرأ الأخطاء:
   اختبرالأخطاء تخبرك بالمشكلة بوضوح

3️⃣ تحقق من البيانات:
   console.log(missionData[0]) ← أسماء الأعمدة

4️⃣ ابحث في الملفات:
   - PROJECT_SUMMARY.md للملخص
   - AI_INTEGRATION_GUIDE.md للتفاصيل
```

---

## ✨ ملخص سريع جداً

```javascript
// كل ما تحتاجه:
const wasl = new WaslAI(data);

// 4 دوال فقط:
wasl.assessCrisis();        // التقييم
wasl.getResponsePlan();     // الخطة
wasl.getAlerts();           // التنبيهات
wasl.getDashboardSummary(); // لوحة التحكم

// كل شيء مُعاد!
```

---

## 🎉 الخطوات التالية

- [ ] أضف `waslAI.js` إلى `index.html`
- [ ] جرّب أول `new WaslAI(data)`
- [ ] عرّض النتائج في الواجهة
- [ ] اقرأ `AI_INTEGRATION_GUIDE.md` للمتقدمين
- [ ] راجع `DEVELOPMENT_PLAN.md` للمستقبل

---

**الإصدار:** 2.0.0  
**الحالة:** ✅ جاهز للعمل  
**الوقت المتوقع:** 5-10 دقائق للبدء
