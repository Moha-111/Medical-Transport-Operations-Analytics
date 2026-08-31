// ============================================================
// Query: FactOperations
// Purpose: Load & clean Daily Operations Data (fact table)
// Source: Medical-Transport-Analytics.xlsx
// ============================================================
let
    // 1) Parameterize the file path - update FilePath parameter in Power BI
    Source = Excel.Workbook(File.Contents(FilePath), null, true),
    Sheet  = Source{[Item="Daily Operations Data", Kind="Sheet"]}[Data],

    // 2) Promote headers
    Promoted = Table.PromoteHeaders(Sheet, [PromoteAllScalars=true]),

    // 3) Explicit typing (critical for DAX time intelligence)
    Typed = Table.TransformColumnTypes(Promoted, {
        {"Referral #",              Int64.Type},
        {"Referral Date",           type date},
        {"Acceptance Time",         type datetime},
        {"Medical Department",      type text},
        {"Referral Type",           type text},
        {"Center Name",             type text},
        {"From",                    type text},
        {"To",                      type text},
        {"Ops Report #",            Int64.Type},
        {"Ops Report Time",         type datetime},
        {"Departure Time",          type datetime},
        {"Arrival Time",            type datetime},
        {"Return to Center",        type datetime},
        {"Paramedic",               type text},
        {"Ambulance Code",          type text},
        {"Referral Reason",         type text},
        {"Dispatch Time (min)",     type number},
        {"Response Time (min)",     type number},
        {"Travel Time (min)",       type number},
        {"Total Response (min)",    type number},
        {"Mission Duration (min)",  type number},
        {"Performance Rating",      type text},
        {"Shift Period",            type text},
        {"Day of Week",             type text},
        {"Month",                   type text}
    }),

    // 4) Add helper columns for slicing & sorting
    WithHour = Table.AddColumn(Typed, "AcceptanceHour",
        each Time.Hour([Acceptance Time]), Int64.Type),

    WithWeekNo = Table.AddColumn(WithHour, "WeekOfYear",
        each Date.WeekOfYear([Referral Date]), Int64.Type),

    WithQuarter = Table.AddColumn(WithWeekNo, "Quarter",
        each "Q" & Text.From(Date.QuarterOfYear([Referral Date])), type text),

    WithMonthNo = Table.AddColumn(WithQuarter, "MonthNo",
        each Date.Month([Referral Date]), Int64.Type),

    WithDayNo = Table.AddColumn(WithMonthNo, "DayOfWeekNo",
        each Date.DayOfWeek([Referral Date], Day.Sunday) + 1, Int64.Type),

    // 5) SLA flag (binary for quick averages)
    WithSLA = Table.AddColumn(WithDayNo, "IsOnTime",
        each if [Performance Rating] = "Good" then 1 else 0, Int64.Type),

    // 6) Life-saving flag
    WithLifeSaving = Table.AddColumn(WithSLA, "IsLifeSaving",
        each if [Referral Type] = "Life-Saving" then 1 else 0, Int64.Type),

    // 7) Remove rows with missing critical fields
    Cleaned = Table.SelectRows(WithLifeSaving,
        each [Referral Date] <> null and [Total Response (min)] <> null)
in
    Cleaned
