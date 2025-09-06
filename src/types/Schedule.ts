export interface Schedule {
  id?: number;
  name: string;
  frequency: 'Hourly' | 'Daily' | 'Weekly';
  hour: number;
  minute: number;
  motivationPercentage: number; // 0-100
  isEnabled: boolean;
}