export interface Schedule {
  id?: number;
  name: string;
  daysOfWeek: boolean[]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  hour: number;
  minute: number;
  motivationPercentage: number; // 0-100
  isEnabled: boolean;
}
