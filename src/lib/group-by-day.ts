export type DaySection<T> = { title: string; data: T[] };

const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' });
const dayLabelFormatter = new Intl.DateTimeFormat('en-NG', {
  timeZone: 'Africa/Lagos',
  dateStyle: 'long',
});

function dayKey(date: Date): string {
  return dayKeyFormatter.format(date);
}

export function groupByDay<T extends { at: string }>(items: T[]): DaySection<T>[] {
  const sortedItems = [...items].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const todayKey = dayKey(new Date());
  const yesterdayKey = dayKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const sections: DaySection<T>[] = [];
  let currentKey = '';

  for (const item of sortedItems) {
    const date = new Date(item.at);
    const key = dayKey(date);
    if (key !== currentKey) {
      currentKey = key;
      const title =
        key === todayKey
          ? 'Today'
          : key === yesterdayKey
            ? 'Yesterday'
            : dayLabelFormatter.format(date);
      sections.push({ title, data: [] });
    }
    sections[sections.length - 1]?.data.push(item);
  }
  return sections;
}
