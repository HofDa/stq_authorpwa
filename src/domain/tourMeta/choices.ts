/**
 * Centralised choice catalogs for the tour meta editor.
 *
 * Every catalog exposes stable, machine-readable ids — these end up in
 * `tour.publicMeta` / `tour.authoringMeta` / `tour.aiContext` and feed the
 * AI prompt builder (PR-44). Labels are German because the authoring UI
 * is German; the export pipeline never reads labels back, so renaming a
 * label is safe but renaming an id requires a migration.
 *
 * Adding a new option: append to the relevant catalog with a new id.
 * Removing or renaming an id: bump the schema version and migrate.
 */

export interface ChoiceOption {
  /** Stable, machine-readable id. Persisted in tour data. */
  id: string;
  /** German label rendered in chips/buttons. */
  label: string;
  /** Optional short hint shown next to the chip. */
  description?: string;
  /** Optional grouping inside a catalog (e.g. by section). */
  category?: string;
  /** Marks the option as a sensible default the UI can highlight. */
  recommended?: boolean;
}

export const audienceChoices: ChoiceOption[] = [
  {
    id: 'families',
    label: 'Familien',
    description: 'Gemischte Gruppe aus Kindern und Erwachsenen',
    recommended: true,
  },
  {
    id: 'children_6_8',
    label: 'Kinder 6–8',
    description: 'Sehr kurze Texte, einfache Aufgaben',
  },
  {
    id: 'children_8_12',
    label: 'Kinder 8–12',
    description: 'Ideale Rätsel-Zielgruppe',
    recommended: true,
  },
  {
    id: 'teens',
    label: 'Jugendliche',
    description: 'Weniger kindliche Ansprache',
  },
  {
    id: 'schools_primary',
    label: 'Grundschule',
    description: 'Didaktisch stark geführt',
  },
  {
    id: 'schools_middle',
    label: 'Mittelschule',
    description: 'Mehr Fachinhalt möglich',
  },
  {
    id: 'tourists',
    label: 'Tourist:innen',
    description: 'Ortskontext und Orientierung wichtig',
  },
  {
    id: 'locals',
    label: 'Einheimische',
    description: 'Neue Perspektive auf bekannte Orte',
  },
  {
    id: 'adults',
    label: 'Erwachsene',
    description: 'Weniger verspielt, mehr Kontext',
  },
  {
    id: 'experts',
    label: 'Fachpublikum',
    description: 'Höhere fachliche Dichte',
  },
];

export const toneChoices: ChoiceOption[] = [
  { id: 'playful', label: 'spielerisch', recommended: true },
  { id: 'scientific_light', label: 'leicht wissenschaftlich', recommended: true },
  { id: 'mysterious', label: 'mystisch' },
  { id: 'adventurous', label: 'abenteuerlich' },
  { id: 'warm', label: 'warmherzig' },
  { id: 'dry_humor', label: 'trockener Humor' },
  { id: 'poetic', label: 'poetisch' },
  { id: 'clear_plain', label: 'klar & einfach' },
  { id: 'museum_like', label: 'museal' },
  { id: 'serious', label: 'seriös' },
];

export const avoidToneChoices: ChoiceOption[] = [
  { id: 'too_childish', label: 'zu kindisch' },
  { id: 'too_academic', label: 'zu akademisch' },
  { id: 'too_marketing', label: 'zu werblich' },
  { id: 'too_many_exclamation_marks', label: 'zu viele Ausrufezeichen' },
  { id: 'generic_ai_phrases', label: 'KI-Floskeln' },
  { id: 'moralizing', label: 'belehrend' },
  { id: 'kitsch', label: 'kitschig' },
  { id: 'lore_overload', label: 'zu viel Lore' },
];

export const themeChoices: ChoiceOption[] = [
  { id: 'biodiversity', label: 'Biodiversität' },
  { id: 'wild_bees', label: 'Wildbienen' },
  { id: 'birds', label: 'Vögel' },
  { id: 'trees', label: 'Bäume' },
  { id: 'fungi', label: 'Pilze' },
  { id: 'soil', label: 'Boden' },
  { id: 'water', label: 'Wasser' },
  { id: 'history', label: 'Geschichte' },
  { id: 'architecture', label: 'Architektur' },
  { id: 'myth', label: 'Mythos' },
  { id: 'local_culture', label: 'Lokalkultur' },
  { id: 'orientation', label: 'Orientierung' },
];

export const riddleTypeChoices: ChoiceOption[] = [
  {
    id: 'counting',
    label: 'Zählen',
    description: 'Objekte am Ort zählen',
    recommended: true,
  },
  {
    id: 'observation',
    label: 'Beobachtung',
    description: 'Etwas Sichtbares erkennen',
    recommended: true,
  },
  { id: 'symbol_matching', label: 'Symbole zuordnen', recommended: true },
  { id: 'simple_code', label: 'Einfacher Code', recommended: true },
  { id: 'direction', label: 'Richtung finden' },
  { id: 'sequence', label: 'Reihenfolge' },
  { id: 'text_answer', label: 'Textantwort' },
  { id: 'number_answer', label: 'Zahlantwort' },
  { id: 'multiple_choice', label: 'Multiple Choice' },
  { id: 'photo_task', label: 'Foto-Aufgabe' },
  { id: 'qr', label: 'QR-Code' },
  { id: 'nfc', label: 'NFC' },
  { id: 'compass', label: 'Kompass' },
  { id: 'audio', label: 'Audio-Hinweis' },
  { id: 'pattern_recognition', label: 'Muster erkennen' },
];

export const avoidRiddleTypeChoices: ChoiceOption[] = [
  { id: 'requires_google', label: 'Google-Suche nötig' },
  { id: 'private_property', label: 'Privatgrund nötig' },
  { id: 'dangerous_action', label: 'gefährliche Aktion' },
  { id: 'too_much_reading', label: 'zu viel Lesen' },
  { id: 'knowledge_only', label: 'reines Vorwissen' },
  { id: 'ambiguous_counting', label: 'unklares Zählen' },
  { id: 'weather_dependent', label: 'stark wetterabhängig' },
];

export const didacticModeChoices: ChoiceOption[] = [
  { id: 'observation', label: 'Beobachten', recommended: true },
  { id: 'counting', label: 'Zählen' },
  { id: 'compare', label: 'Vergleichen' },
  { id: 'classify', label: 'Einordnen' },
  { id: 'micro_discovery', label: 'kleine Entdeckung', recommended: true },
  { id: 'movement', label: 'Bewegung' },
  { id: 'orientation', label: 'Orientierung' },
  { id: 'story_progression', label: 'Storyfortschritt' },
  { id: 'scientific_fact', label: 'Fachfakt' },
  { id: 'reflection', label: 'Reflexion' },
];

export const aiGuardrailChoices: ChoiceOption[] = [
  {
    id: 'do_not_invent_gps',
    label: 'Keine GPS-Koordinaten erfinden',
    recommended: true,
  },
  {
    id: 'do_not_invent_history',
    label: 'Keine lokalen historischen Fakten erfinden',
    recommended: true,
  },
  {
    id: 'mark_uncertain_facts',
    label: 'Unsichere Fakten markieren',
    recommended: true,
  },
  {
    id: 'do_not_overwrite',
    label: 'Bestehende Inhalte nicht ungefragt überschreiben',
    recommended: true,
  },
  {
    id: 'separate_story_and_meta',
    label: 'Story und Meta nicht vermischen',
    recommended: true,
  },
  { id: 'no_private_property', label: 'Kein Privatgrund' },
  { id: 'no_dangerous_actions', label: 'Keine gefährlichen Aktionen' },
  { id: 'no_disturbing_animals', label: 'Keine Tiere stören' },
  { id: 'no_collecting_plants', label: 'Keine Pflanzen entnehmen' },
  { id: 'keep_text_short', label: 'Texte kurz halten' },
];

export const safetyRuleChoices: ChoiceOption[] = [
  { id: 'no_climbing', label: 'Nicht klettern' },
  { id: 'stay_on_paths', label: 'Auf Wegen bleiben' },
  { id: 'cross_roads_carefully', label: 'Straßen vorsichtig queren' },
  { id: 'adult_supervision', label: 'Kinder nur mit Begleitung' },
  { id: 'daylight_only', label: 'Nur bei Tageslicht' },
  { id: 'avoid_ice', label: 'Nicht bei Eis/Schnee' },
  { id: 'respect_nature', label: 'Natur respektieren' },
  { id: 'do_not_touch_nests', label: 'Nester nicht berühren' },
];

/**
 * Catalog index — used by tests, by the UI when it wants to render a
 * label from a stored id, and by the AI prompt builder so it can resolve
 * `tour.publicMeta.themes = ["birds"]` back to "Vögel" before sending.
 */
export const TOUR_META_CHOICE_CATALOGS = {
  audience: audienceChoices,
  tone: toneChoices,
  avoidTone: avoidToneChoices,
  theme: themeChoices,
  riddleType: riddleTypeChoices,
  avoidRiddleType: avoidRiddleTypeChoices,
  didacticMode: didacticModeChoices,
  aiGuardrail: aiGuardrailChoices,
  safetyRule: safetyRuleChoices,
} as const;

export type TourMetaChoiceCatalogId = keyof typeof TOUR_META_CHOICE_CATALOGS;

/**
 * Resolves a stored id back to its catalog entry. Returns `undefined` if
 * the id has been removed from the catalog (call sites can fall back to
 * the raw id string).
 */
export function findChoice(
  catalog: TourMetaChoiceCatalogId,
  id: string,
): ChoiceOption | undefined {
  return TOUR_META_CHOICE_CATALOGS[catalog].find((option) => option.id === id);
}

export function findChoiceLabel(
  catalog: TourMetaChoiceCatalogId,
  id: string,
): string {
  return findChoice(catalog, id)?.label ?? id;
}
