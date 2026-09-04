# 🚀 Wasl AI Platform — Developer Guide

## 📋 نظرة عامة الملفات الجديدة

تم إضافة 5 ملفات جديدة كاملة لتحويل Wasl إلى **منصة ذكاء اصطناعي متكاملة للاستجابة للأزمات**:

```
src/
├── predictions.js          (700+ lines) — محرك التنبؤ والكشف عن الشذوذ
├── responseEngine.js        (650+ lines) — نظام الاستجابة الذكية
├── alertSystem.js          (550+ lines) — نظام التنبيهات الفعال
├── waslAI.js               (450+ lines) — التكامل الرئيسي (orchestrator)
└── core.js    (existing)   — محسبات KPI الأساسية

tests.js                   (400+ lines) — اختبارات شاملة
DEVELOPMENT_PLAN.md       — خطة التطوير الكاملة
AI_INTEGRATION_GUIDE.md   — هذا الملف
```

---

## 🎯 الوحدات الرئيسية

### 1️⃣ **predictions.js** — محرك التنبؤ الذكي

#### الوظائف الرئيسية:

```javascript
// 1. كشف الشذوذ الإحصائية
detectAnomalies(rows, threshold = 2.5)
// → يكتشف النقاط الشاذة باستخدام Z-Score
// → يعيد: { type, severity, value, zScore, message }

// 2. تحليل الاتجاهات
analyzeTrend(values, window = 14)
// → يحسب اتجاه الأداء الصاعد/الهابط
// → يعيد: { slope, direction, confidence, volatility }

// 3. التنبؤ بانتهاك العتبات
predictThresholdBreach(historicalValues, threshold, daysAhead = 3)
// → يتوقع ما إذا كان سيتم تجاوز حد معين قريباً
// → يعيد: { willBreak, daysUntilBreach, confidence }

// 4. التنبؤ بالأزمات
predictCrisisLikelihood(rows, kpis, anomalies, historicalKPIs)
// → يحسب احتمالية 0-100 لحدوث أزمة
// → يعيد: { likelihood, factors, recommendation, message }

// 5. تقييم مخاطر المراكز
scoreCenterRisks(rows, kpis)
// → يحسب درجة الخطر لكل مركز (critical, high, medium, low)
// → يعيد: { centerId, riskScore, riskLevel, factors }
```

#### أمثلة الاستخدام:

```javascript
// مثال 1: كشف شذوذ بسيط
const anomalies = detectAnomalies(missionRecords);
console.log(`تم اكتشاف ${anomalies.length} شذوذ`);

// مثال 2: التنبؤ بالأزمات
import { predictCrisisLikelihood, calcKPIs, detectAnomalies } from './core.js';
const kpis = calcKPIs(missionRecords);
const anomalies = detectAnomalies(missionRecords);
const crisis = predictCrisisLikelihood(missionRecords, kpis, anomalies);

if (crisis.likelihood > 70) {
  console.log('⚠️ أزمة وشيكة! ' + crisis.message);
  crisis.factors.forEach(f => console.log(`  • ${f.name}: ${f.points} نقطة`));
}
```

---

### 2️⃣ **responseEngine.js** — نظام الاستجابة الفعال

#### الوظائف الرئيسية:

```javascript
// 1. إجراءات فورية (0-5 دقائق)
generateImmediateActions(crisisPrediction, kpis, centerRisks)
// → توصيات للتدخل الفوري
// → مثال: زيادة الفريق، نقل المهام

// 2. إجراءات قصيرة الأجل (5-30 دقيقة)
generateShortTermActions(crisisPrediction, anomalies, kpis)
// → توصيات للاستقرار
// → مثال: تنسيق مع مراكز أخرى، تحسين الجداول

// 3. إجراءات متوسطة الأجل (30 دقيقة - ساعات)
generateMediumTermActions(crisisPrediction, anomalies, kpis)
// → توصيات للتحسين المستمر
// → مثال: تدريب سريع، جلب موارد احتياطية

// 4. تحسين توزيع الموارد
optimizeResourceAllocation(kpis, totalTeams = 100, reservePercent = 20)
// → يوزع الفريق بشكل أمثل لتقليل أوقات الاستجابة
// → يعيد: { centerId, recommendedTeams, allocation%, expectedImpact }

// 5. ترتيب التوصيات حسب الأثر
rankRecommendations(allActions, crisisLikelihood)
// → يرتب الإجراءات من الأهم للأقل أهمية

// 6. خطة استجابة شاملة
generateComprehensiveResponsePlan(crisis, anomalies, kpis, centerRisks)
// → يجمع كل شيء في خطة منسقة
```

#### أمثلة الاستخدام:

```javascript
import { generateComprehensiveResponsePlan } from './responseEngine.js';

const plan = generateComprehensiveResponsePlan(
  crisisPrediction,
  anomalies,
  kpis,
  centerRisks
);

console.log(`مستوى الأزمة: ${plan.crisisLevel}`);
console.log(`عدد الإجراءات: ${plan.summary.totalActions}`);

// تنفيذ الإجراءات الفورية
plan.phases.immediate.actions.forEach(action => {
  console.log(`🚨 ${action.detail}`);
  // إرسال إلى النظام المناسب
});
```

---

### 3️⃣ **alertSystem.js** — نظام التنبيهات الذكي

#### الوظائف الرئيسية:

```javascript
// 1. إنشاء تنبيهات
generateAlerts(anomalies, crisisPrediction, kpis, previousAlerts)
// → ينشئ تنبيهات قابلة للتنفيذ فقط
// → يمنع إزعاج المستخدم بتنبيهات متكررة

// 2. إزالة التكرار
deduplicateAlerts(alerts, recentAlerts, deduplicationWindow)
// → يزيل التنبيهات المتطابقة خلال فترة زمنية

// 3. تجميع التنبيهات
groupAlerts(alerts)
// → يجمع التنبيهات الممانثلة لتقليل الفوضى

// 4. تصعيد التنبيهات
escalateAlert(alert, escalationTime)
// → يزيد أولوية التنبيهات غير المعالجة

// 5. اختيار قنوات التسليم
selectDeliveryChannels(severity)
// → critical → [web, email, sms, push, webhook]
// → high → [web, email, push]
// → medium → [web, email]
// → low → [web]

// 6. تنسيق التنبيهات للقناة
formatAlertForChannel(alert, channel)
// → يصيغ التنبيه بشكل مناسب لـ SMS أو Email أو Push

// 7. تتبع فعالية التنبيهات
analyzeAlertEffectiveness(pastAlerts)
// → يحسب معدل الاستجابة والفعالية
// → يساعد في تحسين النظام
```

#### أمثلة الاستخدام:

```javascript
import { generateAlerts, deduplicateAlerts, escalateAlert } from './alertSystem.js';

// إنشاء وتنظيف التنبيهات
const rawAlerts = generateAlerts(anomalies, crisis, kpis, previousAlerts);
const deduped = deduplicateAlerts(rawAlerts, recentAlerts);
const grouped = groupAlerts(deduped);

// إرسال للقنوات المناسبة
grouped.forEach(alert => {
  const channels = selectDeliveryChannels(alert.severity);
  channels.forEach(channel => {
    const formatted = formatAlertForChannel(alert, channel);
    sendAlert(channel, formatted); // إرسال فعلي
  });
});
```

---

### 4️⃣ **waslAI.js** — Orchestrator الرئيسي

هذا الملف يجمع **كل الوحدات معاً** في واجهة واحدة سهلة الاستخدام:

#### الوظائف الرئيسية:

```javascript
class WaslAI {
  // 1. التقييم الشامل للأزمة
  assessCrisis()
  // → يعمل كل شيء: KPI + anomalies + prediction + risks
  // → يعيد: { kpis, anomalies, crisisPrediction, centerRisks }

  // 2. الحصول على خطة الاستجابة
  getResponsePlan()
  // → يعيد خطة التدخل الشاملة

  // 3. الحصول على التنبيهات النشطة
  getAlerts()
  // → يعيد قائمة التنبيهات المصنفة حسب الأولوية

  // 4. ملخص لوحة التحكم
  getDashboardSummary()
  // → مثالي للعرض الفوري في الواجهة
  // → يتضمن: health meter, key metrics, alerts, anomalies
}
```

#### أمثلة الاستخدام:

```javascript
import WaslAI from './waslAI.js';

// إنشاء النظام
const wasl = new WaslAI(missionRecords, {
  responsiveThreshold: 15,  // دقائق
  lateRateThreshold: 10     // النسبة المئوية
});

// تقييم الأزمة الحالية
const assessment = wasl.assessCrisis();
console.log(`النوع الرئيسي: ${assessment.crisisPrediction.likelihood}%`);

// الحصول على الخطة
const plan = wasl.getResponsePlan();
console.log(plan.summary);  // ملخص سريع
console.log(plan.phases.immediate.actions);  // إجراءات فورية

// للعرض في لوحة التحكم
const dashboard = wasl.getDashboardSummary();
renderDashboard(dashboard);
```

---

## 🔌 التكامل مع index.html

### الطريقة 1️⃣: التكامل الكامل

```html
<!-- في index.html -->
<script src="src/core.js"></script>
<script src="src/predictions.js"></script>
<script src="src/responseEngine.js"></script>
<script src="src/alertSystem.js"></script>
<script src="src/waslAI.js"></script>

<script>
  // عند تحميل البيانات
  const wasl = new WaslAI(missionData);
  const assessment = wasl.assessCrisis();
  
  // تحديث لوحة التحكم
  updateDashanteil(wasl.getDashboardSummary());
  
  // عرض التنبيهات
  const alerts = wasl.getAlerts();
  displayAlerts(alerts);
  
  // عرض الخطة
  const plan = wasl.getResponsePlan();
  showResponsePlan(plan);
</script>
```

### الطريقة 2️⃣: استخدام وحدات محددة

```javascript
// استخدام modular
import { calcKPIs, detectBreaches } from './core.js';
import { detectAnomalies, predictCrisisLikelihood } from './predictions.js';
import { generateComprehensiveResponsePlan } from './responseEngine.js';

const kpis = calcKPIs(data);
const anomalies = detectAnomalies(data);
const crisis = predictCrisisLikelihood(data, kpis, anomalies);
const plan = generateComprehensiveResponsePlan(crisis, anomalies, kpis, []);
```

---

## 🧪 تشغيل الاختبارات

```bash
# تشغيل جميع الاختبارات
node tests.js

# نتيجة متوقعة:
# 🧪 WASL AI System Test Suite
# ✅ Prediction: Z-Score calculation
# ✅ Prediction: Anomaly detection
# ...
# 📊 Results: 18 passed, 0 failed
```

---

## 📊 مثال كامل: سير العمل الفعلي

```javascript
// 1. تحميل البيانات
const missionRecords = await loadCSVData('missions.csv');

// 2. إنشاء نظام Wasl AI
const wasl = new WaslAI(missionRecords);

// 3. تقييم الوضع الحالي
const assessment = wasl.assessCrisis();

// 4. طباعة التقرير
console.log('📊 تقرير الأزمة الحالي');
console.log(' '.repeat(40));
console.log(`الوقت: ${new Date().toLocaleString('ar-SA')}`);
console.log(`احتمال الأزمة: ${assessment.crisisPrediction.likelihood}%`);
console.log(`الشذوذ المكتشفة: ${assessment.anomalies.length}`);
console.log('\n⚠️ العوامل الرئيسية:');
assessment.crisisPrediction.factors.forEach(f => {
  console.log(`  • ${f.name}: ${f.points} نقطة`);
});

// 5. الحصول على الخطة
const plan = wasl.getResponsePlan();
console.log('\n🚨 الخطة الفورية (0-5 دقائق):');
plan.phases.immediate.actions.forEach(a => {
  console.log(`  ✓ ${a.action}`);
  console.log(`     → ${a.detail}`);
});

// 6. التنبيهات
const alerts = wasl.getAlerts();
console.log(`\n🔔 عدد التنبيهات: ${alerts.length}`);
alerts.filter(a => a.severity === 'critical').forEach(a => {
  console.log(`  🔴 ${a.title}`);
});

// 7. لوحة التحكم
const dashboard = wasl.getDashboardSummary();
console.log(`\n📈 صحة النظام: ${dashboard.healthMeter.score}/100`);
console.log(`متوسط وقت الاستجابة: ${dashboard.keyMetrics.avgResponse} د`);
console.log(`معدل التأخير: ${dashboard.keyMetrics.lateRate}%`);
```

---

## 🎯 الخطوات التالية للتطوير

- [ ] تكامل مع Google Sheets Live
- [ ] إرسال تقارير تلقائية عبر WhatsApp
- [ ] لوحة تحكم متقدمة مع رسوم بيانية حية
- [ ] تطبيق موبايل (PWA)
- [ ] نموذج ML متقدم للتنبؤ
- [ ] تصنيف الحالات الحرجة تلقائياً
- [ ] تكامل مع الأنظمة الخارجية (وزارة الصحة، الهلال الأحمر)

---

## 📚 المراجع السريعة

| الملف | الحجم | الوظيفة الرئيسية |
|------|-------|-----------------|
| predictions.js | 700+ | كشف الشذوذ والتنبؤ |
| responseEngine.js | 650+ | توليد الإجراءات |
| alertSystem.js | 550+ | إدارة التنبيهات |
| waslAI.js | 450+ | التكامل الرئيسي |
| tests.js | 400+ | الاختبارات الشاملة |

---

**الإصدار:** 2.0.0 (AI-Powered)  
**آخر تحديث:** 2026-03-10  
**الراعي:** Mohammad Alshehri  
**الترخيص:** MIT
