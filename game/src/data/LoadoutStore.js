import { DEFAULT_LOADOUT, WEAPON_LIST, canEquipInSlot } from './weapons.js';

export const LOADOUT_SLOT_COUNT = 25;
const STORAGE_KEY = 'unblockedtdm.loadouts.v1';
const ACTIVE_KEY = 'unblockedtdm.activeLoadout';
const weaponsById = new Map(WEAPON_LIST.map((weapon) => [weapon.id, weapon]));

const defaultEntry = (index) => ({
  name: index === 0 ? 'Balanced' : `Loadout ${String(index + 1).padStart(2, '0')}`,
  primaryId: DEFAULT_LOADOUT.primary.id,
  secondaryId: DEFAULT_LOADOUT.secondary.id
});

function safeStorage() {
  try { return window.localStorage; } catch { return null; }
}

function validIndex(index) {
  const numeric = Number(index);
  return Number.isInteger(numeric) && numeric >= 0 && numeric < LOADOUT_SLOT_COUNT ? numeric : 0;
}

function sanitizeName(value, index) {
  const cleaned = String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, 24);
  return cleaned || `Loadout ${String(index + 1).padStart(2, '0')}`;
}

function sanitizeEntry(entry, index) {
  const primary = weaponsById.get(entry?.primaryId);
  const secondary = weaponsById.get(entry?.secondaryId);
  if (!canEquipInSlot(primary, 'primary') || !canEquipInSlot(secondary, 'secondary') || primary.id === secondary.id) {
    return defaultEntry(index);
  }
  return {
    name: sanitizeName(entry?.name, index),
    primaryId: primary.id,
    secondaryId: secondary.id
  };
}

export class LoadoutStore {
  constructor(storage = safeStorage()) {
    this.storage = storage;
    this.entries = this.readEntries();
    this.activeIndex = this.readActiveIndex();
    this.persist();
  }

  readEntries() {
    if (!this.storage) return Array.from({ length: LOADOUT_SLOT_COUNT }, (_, index) => defaultEntry(index));
    try {
      const parsed = JSON.parse(this.storage.getItem(STORAGE_KEY) || 'null');
      return Array.from({ length: LOADOUT_SLOT_COUNT }, (_, index) => sanitizeEntry(parsed?.[index], index));
    } catch {
      return Array.from({ length: LOADOUT_SLOT_COUNT }, (_, index) => defaultEntry(index));
    }
  }

  readActiveIndex() {
    if (!this.storage) return 0;
    try { return validIndex(Number(this.storage.getItem(ACTIVE_KEY) || 0)); } catch { return 0; }
  }

  persist() {
    if (!this.storage) return;
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
      this.storage.setItem(ACTIVE_KEY, String(this.activeIndex));
    } catch {}
  }

  all() {
    return this.entries.map((entry, index) => ({ ...entry, index, ...this.resolveEntry(entry) }));
  }

  resolveEntry(entry) {
    return {
      primary: weaponsById.get(entry.primaryId) || DEFAULT_LOADOUT.primary,
      secondary: weaponsById.get(entry.secondaryId) || DEFAULT_LOADOUT.secondary
    };
  }

  get(index = this.activeIndex) {
    const safeIndex = validIndex(index);
    const entry = this.entries[safeIndex] || defaultEntry(safeIndex);
    return { ...entry, index: safeIndex, ...this.resolveEntry(entry) };
  }

  setActive(index) {
    this.activeIndex = validIndex(index);
    this.persist();
    return this.get(this.activeIndex);
  }

  save(index, { name, primary, secondary }) {
    const safeIndex = validIndex(index);
    if (!canEquipInSlot(primary, 'primary')) throw new Error('Invalid primary weapon for saved loadout.');
    if (!canEquipInSlot(secondary, 'secondary')) throw new Error('Invalid secondary weapon for saved loadout.');
    if (primary.id === secondary.id) throw new Error('The exact same weapon cannot occupy both slots.');
    this.entries[safeIndex] = {
      name: sanitizeName(name ?? this.entries[safeIndex]?.name, safeIndex),
      primaryId: primary.id,
      secondaryId: secondary.id
    };
    this.activeIndex = safeIndex;
    this.persist();
    return this.get(safeIndex);
  }

  rename(index, name) {
    const current = this.get(index);
    return this.save(index, { ...current, name });
  }

  resetSlot(index) {
    const safeIndex = validIndex(index);
    this.entries[safeIndex] = defaultEntry(safeIndex);
    this.activeIndex = safeIndex;
    this.persist();
    return this.get(safeIndex);
  }
}
