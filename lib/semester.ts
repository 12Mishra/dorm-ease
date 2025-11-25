const SEMESTER_TEMPLATES = [
  { name: "Spring", startMonth: 1, startDay: 10, endMonth: 6, endDay: 30 },
  { name: "Fall", startMonth: 7, startDay: 1, endMonth: 12, endDay: 20 },
] as const;

export type SemesterLabel =
  `${(typeof SEMESTER_TEMPLATES)[number]["name"]} ${number}`;

/**
 * Generates a chronologically ordered list of upcoming semester labels.
 */
export function generateSemesters(count = 6): SemesterLabel[] {
  const now = new Date();
  let year = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  let templateIndex = currentMonth < SEMESTER_TEMPLATES[1].startMonth ? 0 : 1;
  const semesters: SemesterLabel[] = [];

  while (semesters.length < count) {
    const template = SEMESTER_TEMPLATES[templateIndex];
    semesters.push(`${template.name} ${year}` as SemesterLabel);

    templateIndex += 1;
    if (templateIndex >= SEMESTER_TEMPLATES.length) {
      templateIndex = 0;
      year += 1;
    }
  }

  return semesters;
}

/**
 * Converts a semester label (e.g. "Spring 2025") into ISO start and end dates.
 */
export function getSemesterDates(label: string) {
  const match = label.match(/^(Spring|Fall)\s+(\d{4})$/);
  if (!match) {
    return null;
  }

  const [, name, yearString] = match;
  const template = SEMESTER_TEMPLATES.find((entry) => entry.name === name);
  if (!template) {
    return null;
  }

  const year = Number.parseInt(yearString, 10);

  const startDate = new Date(
    Date.UTC(year, template.startMonth - 1, template.startDay)
  );
  const endDate = new Date(
    Date.UTC(year, template.endMonth - 1, template.endDay)
  );

  return {
    start_date: startDate.toISOString().slice(0, 10),
    end_date: endDate.toISOString().slice(0, 10),
  };
}
