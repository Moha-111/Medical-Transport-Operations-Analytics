// ============================================================
// Query: DimDate  (Date dimension for Time Intelligence)
// Range: 2025-01-01 to 2025-12-31
// Mark this table as a Date Table in Power BI (Table tools > Mark as date table)
// ============================================================
let
    StartDate = #date(2025, 1, 1),
    EndDate   = #date(2025, 12, 31),
    NumDays   = Duration.Days(EndDate - StartDate) + 1,

    Dates = List.Dates(StartDate, NumDays, #duration(1,0,0,0)),
    ToTable = Table.FromList(Dates, Splitter.SplitByNothing(), {"Date"}),
    TypedDate = Table.TransformColumnTypes(ToTable, {{"Date", type date}}),

    WithYear    = Table.AddColumn(TypedDate,   "Year",         each Date.Year([Date]), Int64.Type),
    WithQuarter = Table.AddColumn(WithYear,    "Quarter",      each "Q" & Text.From(Date.QuarterOfYear([Date])), type text),
    WithQuartNo = Table.AddColumn(WithQuarter, "QuarterNo",    each Date.QuarterOfYear([Date]), Int64.Type),
    WithMonth   = Table.AddColumn(WithQuartNo, "Month",        each Date.MonthName([Date]), type text),
    WithMonthNo = Table.AddColumn(WithMonth,   "MonthNo",      each Date.Month([Date]), Int64.Type),
    WithYrMonth = Table.AddColumn(WithMonthNo, "YearMonth",    each Text.From(Date.Year([Date])) & "-" & Text.PadStart(Text.From(Date.Month([Date])),2,"0"), type text),
    WithWeek    = Table.AddColumn(WithYrMonth, "WeekOfYear",   each Date.WeekOfYear([Date]), Int64.Type),
    WithDayName = Table.AddColumn(WithWeek,    "DayName",      each Date.DayOfWeekName([Date]), type text),
    WithDayNo   = Table.AddColumn(WithDayName, "DayOfWeekNo",  each Date.DayOfWeek([Date], Day.Sunday) + 1, Int64.Type),
    WithIsWknd  = Table.AddColumn(WithDayNo,   "IsWeekend",    each let d = Date.DayOfWeek([Date], Day.Sunday) in if d = 5 or d = 6 then 1 else 0, Int64.Type)
in
    WithIsWknd
