import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { apiGet, type AffectationDetail, type Programme, type Student, programmeHasDiscours } from './api';

export type ExportFormat = 'csv' | 'excel' | 'pdf';

interface PlanningRow {
  semaineDebut: string;
  semaineFin: string;
  typeProgramme: string;
  typeExpose: string;
  role: string;
  eleve: string;
  genre: string;
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadCsv(filename: string, rows: string[][]) {
  const content = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
  downloadBlob(filename, new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' }));
}

function formatDateFr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function fetchPlanningRows(programmeFilter?: number): Promise<{ rows: PlanningRow[]; students: Student[] }> {
  const [programmes, students] = await Promise.all([
    apiGet<Programme[]>('/programmes'),
    apiGet<Student[]>('/eleves'),
  ]);

  const filtered = programmeFilter
    ? programmes.filter((p) => p.id === programmeFilter)
    : programmes;

  const rows: PlanningRow[] = [];

  for (const prog of filtered) {
    const affectations = await apiGet<AffectationDetail[]>(`/programmes/${prog.id}/affectations`);
    const typeProgramme = programmeHasDiscours(prog) ? 'Discours' : 'Standard';

    if (affectations.length === 0) {
      rows.push({
        semaineDebut: prog.date_debut_semaine,
        semaineFin: prog.date_fin_semaine,
        typeProgramme,
        typeExpose: '',
        role: '',
        eleve: '(aucune affectation)',
        genre: '',
      });
      continue;
    }

    for (const a of affectations) {
      rows.push({
        semaineDebut: prog.date_debut_semaine,
        semaineFin: prog.date_fin_semaine,
        typeProgramme,
        typeExpose: a.type_expose,
        role: a.role,
        eleve: a.nom,
        genre: a.genre,
      });
    }
  }

  return { rows, students };
}

function planningToCsvRows(rows: PlanningRow[], students: Student[]): string[][] {
  const csvRows: string[][] = [
    ['Semaine début', 'Semaine fin', 'Type programme', 'Exposé', 'Rôle', 'Élève', 'Genre'],
    ...rows.map((r) => [
      r.semaineDebut,
      r.semaineFin,
      r.typeProgramme,
      r.typeExpose,
      r.role,
      r.eleve,
      r.genre,
    ]),
  ];

  csvRows.push([]);
  csvRows.push(['--- Élèves ---', '', '', '', '', '', '']);
  csvRows.push(['Nom', 'Genre', 'Dernier exposé', '', '', '', '']);
  for (const s of students) {
    csvRows.push([s.nom, s.genre, s.date_dernier_expose || '', '', '', '', '']);
  }

  return csvRows;
}

export function exportStudentsCsv(students: Student[]) {
  downloadCsv('eleves-jwscheduler.csv', [
    ['Nom', 'Genre', 'Dernier exposé'],
    ...students.map((s) => [s.nom, s.genre, s.date_dernier_expose || '']),
  ]);
}

export async function exportFullPlanningCsv(programmeId?: number) {
  const { rows, students } = await fetchPlanningRows(programmeId);
  const suffix = programmeId ? `-semaine-${programmeId}` : '';
  downloadCsv(`planning-jwscheduler${suffix}.csv`, planningToCsvRows(rows, students));
}

export async function exportFullPlanningExcel(programmeId?: number) {
  const { rows, students } = await fetchPlanningRows(programmeId);
  const suffix = programmeId ? `-semaine-${programmeId}` : '';

  const wb = XLSX.utils.book_new();

  const planningSheet = XLSX.utils.aoa_to_sheet([
    ['Semaine début', 'Semaine fin', 'Type programme', 'Exposé', 'Rôle', 'Élève', 'Genre'],
    ...rows.map((r) => [
      r.semaineDebut,
      r.semaineFin,
      r.typeProgramme,
      r.typeExpose,
      r.role,
      r.eleve,
      r.genre,
    ]),
  ]);
  XLSX.utils.book_append_sheet(wb, planningSheet, 'Planning');

  const elevesSheet = XLSX.utils.aoa_to_sheet([
    ['Nom', 'Genre', 'Dernier exposé'],
    ...students.map((s) => [s.nom, s.genre, s.date_dernier_expose || '']),
  ]);
  XLSX.utils.book_append_sheet(wb, elevesSheet, 'Élèves');

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  downloadBlob(
    `planning-jwscheduler${suffix}.xlsx`,
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  );
}

export async function exportFullPlanningPdf(programmeId?: number) {
  const { rows, students } = await fetchPlanningRows(programmeId);
  const suffix = programmeId ? `-semaine-${programmeId}` : '';

  const doc = new jsPDF({ orientation: programmeId ? 'portrait' : 'landscape' });
  doc.setFontSize(16);
  doc.text('JW Scheduler — Planning', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 14, 26);
  doc.setTextColor(0);

  if (programmeId && rows.length > 0) {
    const r = rows[0];
    doc.setFontSize(12);
    doc.text(
      `Semaine du ${formatDateFr(r.semaineDebut)} au ${formatDateFr(r.semaineFin)}`,
      14,
      36
    );
    doc.text(`Type : ${r.typeProgramme}`, 14, 44);
  }

  autoTable(doc, {
    startY: programmeId ? 52 : 32,
    head: [['Semaine début', 'Semaine fin', 'Programme', 'Exposé', 'Rôle', 'Élève', 'Genre']],
    body: rows.map((r) => [
      formatDateFr(r.semaineDebut),
      formatDateFr(r.semaineFin),
      r.typeProgramme,
      r.typeExpose,
      r.role,
      r.eleve,
      r.genre,
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 80;

  doc.setFontSize(12);
  doc.text('Élèves', 14, finalY + 14);

  autoTable(doc, {
    startY: finalY + 18,
    head: [['Nom', 'Genre', 'Dernier exposé']],
    body: students.map((s) => [s.nom, s.genre, s.date_dernier_expose || 'Jamais']),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [71, 85, 105] },
  });

  doc.save(`planning-jwscheduler${suffix}.pdf`);
}

export async function exportPlanning(format: ExportFormat, programmeId?: number) {
  switch (format) {
    case 'csv':
      await exportFullPlanningCsv(programmeId);
      break;
    case 'excel':
      await exportFullPlanningExcel(programmeId);
      break;
    case 'pdf':
      await exportFullPlanningPdf(programmeId);
      break;
  }
}
