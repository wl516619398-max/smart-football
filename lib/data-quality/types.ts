export type DataQualitySeverity = "info" | "warning" | "error";

export type DataQualityIssue = {
  data_type: "matches" | "teams" | "odds";
  check_type: string;
  severity: DataQualitySeverity;
  message: string;
};
