# Data Dictionary — Wasl Platform (وصل)

## Overview

This document defines all data fields used in the Wasl Medical Transport Intelligence Platform. All data in this repository is **synthetic/demo** data generated for demonstration purposes.

**No real patient information is included in this repository.**

---

## Mission Record (`Medical-Transport-Analytics.xlsx`)

Sheet: `Daily Operations Data`

| Field | Arabic | Type | Description | Example |
|-------|--------|------|-------------|---------|
| `mission_id` | رقم المهمة | String | Unique mission identifier | `MSN-2024-001` |
| `date` | التاريخ | Date | Mission date (YYYY-MM-DD) | `2024-01-15` |
| `center_name` | اسم المركز | String | Originating center name | `مركز الرياض الشمالي` |
| `center_id` | رقم المركز | Integer | Center reference ID (1–20) | `3` |
| `paramedic_name` | اسم المسعف | String | Assigned paramedic name | `أحمد محمد` |
| `paramedic_id` | رقم المسعف | Integer | Paramedic reference ID (1–219) | `47` |
| `referral_type` | نوع الإحالة | Enum | Mission urgency type | `Life-Saving` / `Routine` |
| `response_time_min` | وقت الاستجابة (دقيقة) | Float | Time from call to unit mobilization | `12.5` |
| `dispatch_time_min` | وقت التحرك (دقيقة) | Float | Time from dispatch to departure | `4.8` |
| `mission_duration_min` | مدة المهمة (دقيقة) | Float | Total mission duration | `127.3` |
| `destination_hospital` | المستشفى المستقبِل | String | Target hospital name | `H1` / `H2` |
| `mission_status` | حالة المهمة | Enum | Completion status | `Completed` / `Cancelled` |
| `late_flag` | تأخر في التحرك | Boolean | Whether dispatch exceeded threshold | `true` / `false` |
| `shift` | الوردية | Enum | Work shift | `Morning` / `Evening` / `Night` |
| `vehicle_id` | رقم المركبة | String | Ambulance unit identifier | `AMB-003` |
| `month` | الشهر | Integer | Mission month (1–12) | `6` |
| `day_of_week` | يوم الأسبوع | String | Day name | `Monday` |
| `hour_of_day` | ساعة اليوم | Integer | Mission start hour (0–23) | `14` |

---

## KPI Definitions

### Response Time (وقت الاستجابة)

```
Response Time = Time ambulance mobilizes − Time call received
Target: ≤ 15 minutes
Critical: > 20 minutes
```

### Dispatch Time (وقت التحرك)

```
Dispatch Time = Time unit departs center − Time dispatch order issued
Target: ≤ 8 minutes
Critical: > 12 minutes
```

### Mission Duration (مدة المهمة)

```
Mission Duration = Time mission closes − Time dispatch order issued
Includes: travel, patient assessment, transfer, handover
```

### Late Rate (معدل التأخير)

```
Late Rate = (Missions where Dispatch Time > Threshold) / Total Missions × 100
Target: ≤ 5% (i.e., at most 5% late missions)
```

### Emergency Rate (نسبة الطوارئ)

```
Emergency Rate = Life-Saving Missions / Total Missions × 100
Current: 35.1%
```

### H1 Hospital Share (حصة مستشفى H1)

```
H1 Share = Missions to H1 / Total Missions × 100
Current: 72.1% (imbalanced — target: more even distribution)
```

---

## Center Reference

| ID | Center Name (Arabic) | Center Name (English) | Region |
|----|---------------------|----------------------|--------|
| 1 | مركز الرياض الشمالي | North Riyadh Center | Riyadh |
| 2 | مركز الرياض الجنوبي | South Riyadh Center | Riyadh |
| 3 | مركز الرياض الشرقي | East Riyadh Center | Riyadh |
| 4 | مركز الرياض الغربي | West Riyadh Center | Riyadh |
| 5 | مركز وسط الرياض | Central Riyadh Center | Riyadh |
| ... | ... | ... | ... |
| 20 | مركز العاصمة | Capital Center | Riyadh |

*Full center list available in the platform's Center Management module.*

---

## User Roles

| Role | Arabic | Access Level | Description |
|------|--------|-------------|-------------|
| `admin` | مدير النظام | Full access | All data, settings, reports |
| `manager` | مدير العمليات | Center-level | Own center data, all KPIs |
| `dispatcher` | المرسِل | Limited | Active missions, dispatch queue |

---

## Alert Thresholds (Configurable)

| KPI | Default Threshold | Alert Type |
|-----|-------------------|------------|
| Response Time | > 15 min | Warning |
| Response Time | > 20 min | Critical |
| Dispatch Time | > 8 min | Warning |
| Late Rate | > 95% | Warning |
| Emergency Rate | > 50% | Informational |

---

## Data Privacy Notes

> **IMPORTANT:** All data in this repository is **synthetic** and does not represent real patients.

When deploying Wasl in a production environment:

1. All patient names must be replaced with anonymous IDs
2. Personal identifiers (National ID, phone numbers) must never be stored
3. Data must be encrypted at rest and in transit
4. Access must be logged with timestamps
5. Compliance with Saudi PDPL (Personal Data Protection Law) is required

See [SECURITY.md](../SECURITY.md) for the full PDPL compliance roadmap.

---

*Last updated: 2026-02-27*
*Wasl Data Dictionary v1.3.0*
