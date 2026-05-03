export interface ReportSchedule {
  id?: string;
  organization_id?: string;
  report_name: string;
  schedule_frequency: "daily" | "weekly" | "monthly";
  report_format: "csv" | "pdf" | "both";
}

export async function createReportSchedule(
  schedule: ReportSchedule
): Promise<ReportSchedule> {
  console.warn("Report scheduling is currently disabled/stubbed.");
  return schedule;
}

export async function getReportSchedules(): Promise<ReportSchedule[]> {
  console.warn("Report scheduling is currently disabled/stubbed.");
  return [];
}

export async function deleteReportSchedule(id: string): Promise<void> {
  console.warn(`Report schedule deletion is currently disabled/stubbed for id: ${id}`);
}
