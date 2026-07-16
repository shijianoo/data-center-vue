export type AutoReviewStatus = "Passed" | "Failed" | "Error" | "NoRule"
export type ManualReviewStatus = "Valid" | "Invalid" | "Fault" | "Suspect" | "AboveUpperLimit" | "BelowLowerLimit"

export interface PageResult<T> { items: T[], total: number, pageNumber: number, pageSize: number }
export interface Station { id: string, mn: string, name: string, groupName?: string, longitude?: number, latitude?: number, status: string, address?: string, lastSeenAt?: string, metadataJson?: string }
export interface ParameterCatalogGroup { id: string, parentId?: string | null, name: string, parameterKind: "Monitoring" | "System", sortOrder?: number }
export interface ParameterDefinition { id: string, code: string, name: string, parameterKind: string, catalogGroupId?: string, dataType: string, unit?: string, decimalPlaces?: number, primaryMetricSuffix?: string, sortOrder?: number, description?: string }
export interface ParameterGroup { id: string, name: string, groupKind: string, reportIntervalMinutes: number, sortOrder?: number }
export interface StationParameterBinding { id: string, parameterDefinitionId: string, stationParameterGroupId: string, displayNameOverride?: string, unitOverride?: string, decimalPlacesOverride?: number, sortOrder?: number, parameterDefinition?: ParameterDefinition, stationParameterGroup?: ParameterGroup }
export interface ReviewRule { id: string, code: string, name: string, implementationKey: "Range" | "Comparison" | "ConsecutiveSameValue" | "CircularGeofence", parameterDefinitionId: string, defaultConfigJson: string, configSchemaJson: string, description?: string }
export interface ReviewRuleBinding { id: string, ruleDefinitionId: string, stationId: string, configOverrideJson: string, priority: number, ruleDefinition?: ReviewRule, station?: Station }
export interface MeasurementColumn { parameterDefinitionId: string, code: string, name: string, unit?: string, decimalPlaces?: number, kind: string, dataType?: string }
export interface MeasurementCell { pointId: string | null, valueText: string | null, numericValue?: number | null, receivedAt?: string, autoReviewStatus?: AutoReviewStatus, autoReviewResultsJson?: string, manualReview?: { currentLevel: number, currentStatus?: ManualReviewStatus, reviewer?: string, comment?: string } }
export interface MeasurementRow { time: string, values: Record<string, MeasurementCell | null> }
export interface MeasurementResult { stationId: string, stationName: string, parameterGroupId: string, parameterGroupName: string, reportIntervalMinutes: number, granularity: string, columns: MeasurementColumn[], rows: MeasurementRow[] }
export interface DataRate { parameter: Pick<ParameterDefinition, "code" | "name" | "unit">, expectedCount: number, receivedCount: number, validCount: number, missingCount: number, duplicateCount: number, acquisitionRate: number | null, validityRate: number | null }
export interface LatestMeasurement { parameter: ParameterDefinition & { groupName?: string }, point: MeasurementCell & { observedAt?: string, effectiveValueText?: string } | null }
export interface StationLatest { mn: string, stationName: string, groupName?: string, parameters: LatestMeasurement[] }
