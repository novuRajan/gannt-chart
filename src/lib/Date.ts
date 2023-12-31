export class DateHelper {
  private readonly _dates: string[];

  constructor(dates: string[]=[]) {
    this._dates = dates;
  }

  public earliestDate(): Date | undefined {
    return new Date(Math.min(...this.sanitizeDates().map((d: Date) => d.getTime())));
  }

  public latestDate(): Date | undefined {
    return new Date(Math.max(...this.sanitizeDates().map((d: Date) => d.getTime())));
  }

  public isBetween(_start: string, _end: string): boolean {
    const now = new Date()
    const start = new Date(_start)
    const end = new Date(_end)
    return now > start && now < end
  }
  private sanitizeDates(): Date[] {
    if (this._dates.length === 0) {
      return [];
    }

    const dates = this._dates.map((dateStr) => {
      const date = new Date(dateStr);

      return isNaN(date.getTime()) ? undefined : date;
    });

    return dates.filter(Boolean) as Date[];
  }
}
