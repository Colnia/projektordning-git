export interface Phase {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  startDate: Date;
  endDate: Date;
  status: string;
  completionRate: number;
  color?: string;
  isTemporary?: boolean;
  resources?: Array<{
    id: string | number;
    name: string;
    hoursPerDay: number;
  }>;
}

export interface Resource {
  id: string;
  name: string;
  hoursPerDay?: number;
}

export interface Assignment {
  id?: string;
  resourceId: string;
  projectId: string;
  phaseId: string;
  startDate: string | Date;
  endDate: string | Date;
  hoursPerDay: number;
} 