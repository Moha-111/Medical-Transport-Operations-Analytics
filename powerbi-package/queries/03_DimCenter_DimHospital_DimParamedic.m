// ============================================================
// Dimension queries (reference FactOperations)
// Create each as a NEW query in Power BI: right-click FactOperations > Reference
// Then paste the body below.
// ============================================================

// -------- DimCenter --------
let
    Source = FactOperations,
    Selected = Table.SelectColumns(Source, {"Center Name"}),
    Distinct = Table.Distinct(Selected),
    Sorted = Table.Sort(Distinct, {{"Center Name", Order.Ascending}})
in
    Sorted

// -------- DimHospital --------
let
    Source = FactOperations,
    Selected = Table.SelectColumns(Source, {"To"}),
    Renamed = Table.RenameColumns(Selected, {{"To", "Hospital"}}),
    Distinct = Table.Distinct(Renamed),
    Sorted = Table.Sort(Distinct, {{"Hospital", Order.Ascending}})
in
    Sorted

// -------- DimParamedic --------
let
    Source = FactOperations,
    Selected = Table.SelectColumns(Source, {"Paramedic"}),
    Distinct = Table.Distinct(Selected),
    Sorted = Table.Sort(Distinct, {{"Paramedic", Order.Ascending}})
in
    Sorted

// -------- DimShift --------
let
    Source = FactOperations,
    Selected = Table.SelectColumns(Source, {"Shift Period"}),
    Distinct = Table.Distinct(Selected),
    Sorted = Table.Sort(Distinct, {{"Shift Period", Order.Ascending}})
in
    Sorted
