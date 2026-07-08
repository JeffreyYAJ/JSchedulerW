import type { Programme, Student } from './api';
import { programmeHasDiscours } from './api';

export type SlotKey = 'lecture' | 'sketch1' | 'sketch2' | 'sketch3' | 'discours';

export type AssignmentsState = Record<SlotKey, { 1: string; 2: string }>;

export const SLOT_TO_TYPE: Record<SlotKey, string> = {
  lecture: 'Lecture',
  sketch1: 'Sketch 1',
  sketch2: 'Sketch 2',
  sketch3: 'Sketch 3',
  discours: 'Discours',
};

export function emptyAssignments(): AssignmentsState {
  return {
    lecture: { 1: '', 2: '' },
    sketch1: { 1: '', 2: '' },
    sketch2: { 1: '', 2: '' },
    sketch3: { 1: '', 2: '' },
    discours: { 1: '', 2: '' },
  };
}

function sortByPriority(students: Student[], priorityIds: Set<number>): Student[] {
  return [...students].sort((a, b) => {
    const aP = priorityIds.has(a.id) ? 0 : 1;
    const bP = priorityIds.has(b.id) ? 0 : 1;
    if (aP !== bP) return aP - bP;
    const aDate = a.date_dernier_expose || '';
    const bDate = b.date_dernier_expose || '';
    return aDate.localeCompare(bDate);
  });
}

function pickOne(
  pool: Student[],
  used: Set<number>,
  filter: (s: Student) => boolean
): Student | null {
  const candidate = pool.find((s) => !used.has(s.id) && filter(s));
  if (!candidate) return null;
  used.add(candidate.id);
  return candidate;
}

function pickPair(
  pool: Student[],
  used: Set<number>
): [Student, Student] | null {
  for (const first of pool) {
    if (used.has(first.id)) continue;
    const second = pool.find(
      (s) => !used.has(s.id) && s.id !== first.id && s.genre === first.genre
    );
    if (second) {
      used.add(first.id);
      used.add(second.id);
      return [first, second];
    }
  }
  return null;
}

export function buildSmartSuggestions(
  students: Student[],
  priorityIds: Set<number>,
  programme: Programme,
  alreadyAssignedIds: Set<number>
): AssignmentsState {
  const result = emptyAssignments();
  const used = new Set(alreadyAssignedIds);
  const pool = sortByPriority(students, priorityIds);

  const lecteur = pickOne(pool, used, (s) => s.genre === 'H');
  if (lecteur) result.lecture[1] = String(lecteur.id);

  if (programmeHasDiscours(programme)) {
    const orateur = pickOne(pool, used, (s) => s.genre === 'H');
    if (orateur) result.discours[1] = String(orateur.id);
  } else {
    const duo3 = pickPair(pool, used);
    if (duo3) {
      result.sketch3[1] = String(duo3[0].id);
      result.sketch3[2] = String(duo3[1].id);
    }
  }

  const duo1 = pickPair(pool, used);
  if (duo1) {
    result.sketch1[1] = String(duo1[0].id);
    result.sketch1[2] = String(duo1[1].id);
  }

  const duo2 = pickPair(pool, used);
  if (duo2) {
    result.sketch2[1] = String(duo2[0].id);
    result.sketch2[2] = String(duo2[1].id);
  }

  return result;
}

export function assignmentsToPayloads(
  programmeId: number,
  assignments: AssignmentsState,
  programme: Programme
): Array<{ id_programme: number; id_eleve: number; type_expose: string; role: string }> {
  const payloads: Array<{
    id_programme: number;
    id_eleve: number;
    type_expose: string;
    role: string;
  }> = [];

  const slots: SlotKey[] = ['lecture', 'sketch1', 'sketch2'];
  if (programmeHasDiscours(programme)) {
    slots.push('discours');
  } else {
    slots.push('sketch3');
  }

  for (const key of slots) {
    const roles = assignments[key];
    const typeExpose = SLOT_TO_TYPE[key];
    if (roles[1]) {
      payloads.push({
        id_programme: programmeId,
        id_eleve: parseInt(roles[1], 10),
        type_expose: typeExpose,
        role: 'Titulaire',
      });
    }
    if (roles[2]) {
      payloads.push({
        id_programme: programmeId,
        id_eleve: parseInt(roles[2], 10),
        type_expose: typeExpose,
        role: 'Partenaire',
      });
    }
  }

  return payloads;
}

export function getActiveAssignmentKey(
  activeSlot: string,
  programme: Programme
): SlotKey {
  if (activeSlot === 'sketch3') {
    return programmeHasDiscours(programme) ? 'discours' : 'sketch3';
  }
  return activeSlot as SlotKey;
}
