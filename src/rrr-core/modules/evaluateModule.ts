import type { RrrModule } from '../types';
import type {
  DirectionHotColdProximity,
  ProximityHintState,
  RrrModuleResult,
  RrrRuntimeEvaluationInput,
  RrrRuntimeStatus,
} from '../evaluator/types';

export function evaluateModule(
  module: RrrModule,
  input: RrrRuntimeEvaluationInput,
): RrrModuleResult {
  const timeoutResult = evaluateTimeout(module, input);
  if (timeoutResult) {
    return timeoutResult;
  }

  switch (module.type) {
    case 'text_answer':
      return evaluateTextAnswer(module, input);
    case 'multi_choice':
      return evaluateMultiChoice(module, input);
    case 'compass_align':
      return evaluateCompassAlign(module, input);
    case 'direction_hotcold':
      return evaluateDirectionHotCold(module, input);
    case 'hold_still':
      return evaluateHoldStill(module, input);
    case 'gps_enter':
      return evaluateGpsEnter(module, input);
    case 'proximity_hint':
      return evaluateProximityHint(module, input);
    case 'qr_scan':
      return evaluateQrScan(module, input);
    case 'code_word':
      return evaluateCodeWord(module, input);
    case 'sequential_code':
      return evaluateSequentialCode(module, input);
    case 'timer_wait':
      return evaluateTimerWait(module, input);
    case 'photo_check_manual':
      return evaluatePhotoCheckManual(module, input);
    case 'object_found':
      return evaluateObjectFound(module, input);
  }
}

function evaluateMultiChoice(
  module: RrrModule,
  input: RrrRuntimeEvaluationInput,
): RrrModuleResult {
  const question = readString(module.config.question);
  const options = readStringArray(module.config.options);
  const correctOptionIndexes = readNumberArray(
    module.config.correctOptionIndexes,
  );
  const selectedIndexes =
    input.userInput.multiChoiceSelectionsByModuleId?.[module.id] ?? [];

  if (!question.trim()) {
    return moduleResult(module, 'running', 'Noch keine Auswahlfrage festgelegt');
  }
  if (options.filter((option) => option.trim() !== '').length === 0) {
    return moduleResult(module, 'running', 'Noch keine Antwortoptionen festgelegt');
  }
  if (correctOptionIndexes.length === 0) {
    return moduleResult(module, 'running', 'Noch keine richtige Option festgelegt');
  }
  if (selectedIndexes.length === 0) {
    return moduleResult(module, 'running', 'Warte auf Auswahl');
  }

  const validOptionIndexes = new Set(
    options
      .map((option, index) => (option.trim() === '' ? undefined : index))
      .filter((index): index is number => index !== undefined),
  );
  const correctSet = normalizeIndexSet(
    correctOptionIndexes.filter((index) => validOptionIndexes.has(index)),
  );
  const selectedSet = normalizeIndexSet(
    selectedIndexes.filter((index) => validOptionIndexes.has(index)),
  );
  const matches = setsEqual(correctSet, selectedSet);

  return moduleResult(
    module,
    matches ? 'success' : 'failed',
    matches ? 'Auswahl passt' : 'Auswahl passt nicht',
  );
}

function evaluateTimeout(
  module: RrrModule,
  input: RrrRuntimeEvaluationInput,
): RrrModuleResult | null {
  const timeoutMs = readPositiveNumber(module.timeoutMs);
  if (!timeoutMs || input.activeModuleId !== module.id) {
    return null;
  }

  const session = input.session;
  const alreadyTimedOut = session?.timedOutModuleIds.includes(module.id) ?? false;
  const startedAt = session?.activeStepStartedAtMs;
  const nowMs = input.nowMs;
  const elapsedMs =
    isFiniteNumber(startedAt) && isFiniteNumber(nowMs) ? nowMs - startedAt : 0;

  if (!alreadyTimedOut && elapsedMs < timeoutMs) {
    return null;
  }

  const attempts =
    (session?.attemptsByModuleId[module.id] ?? 0) + (alreadyTimedOut ? 0 : 1);
  const maxAttempts = readPositiveNumber(module.retry?.maxAttempts);
  const retryable = maxAttempts === undefined || attempts < maxAttempts;

  return moduleResult(
    module,
    'failed',
    retryable
      ? 'Zeit abgelaufen. Noch einmal versuchen.'
      : 'Zeit abgelaufen.',
    {
      timedOut: true,
      retryable,
      attempts,
      maxAttempts,
      elapsedMs,
      timeoutMs,
    },
  );
}

function evaluateTextAnswer(
  module: RrrModule,
  input: RrrRuntimeEvaluationInput,
): RrrModuleResult {
  const expected = readString(module.config.answer);
  const actual = input.userInput.textAnswer ?? '';
  const caseSensitive = Boolean(module.config.caseSensitive);

  if (!expected.trim()) {
    return moduleResult(module, 'running', 'Noch keine erwartete Antwort festgelegt');
  }
  if (!actual.trim()) {
    return moduleResult(module, 'running', 'Warte auf Antwort');
  }

  const matches = caseSensitive
    ? actual === expected
    : actual.trim().toLowerCase() === expected.trim().toLowerCase();

  return moduleResult(
    module,
    matches ? 'success' : 'failed',
    matches ? 'Antwort passt' : 'Antwort passt nicht',
  );
}

function evaluateCompassAlign(
  module: RrrModule,
  input: RrrRuntimeEvaluationInput,
): RrrModuleResult {
  const headingDegrees = input.mockState.headingDegrees;
  if (!isFiniteNumber(headingDegrees)) {
    return moduleResult(module, 'running', 'Warte auf Richtung');
  }

  const targetDegrees = normalizeDegrees(readNumber(module.config.targetDegrees));
  const tolerance = Math.max(0, readNumber(module.config.tolerance));
  const delta = headingDelta(headingDegrees, targetDegrees);
  const aligned = delta <= tolerance;

  return moduleResult(
    module,
    aligned ? 'success' : 'running',
    aligned
      ? `Innerhalb von ${tolerance} Grad`
      : `${Math.round(delta)} Grad vom Ziel entfernt`,
  );
}

function evaluateDirectionHotCold(
  module: RrrModule,
  input: RrrRuntimeEvaluationInput,
): RrrModuleResult {
  const headingDegrees = input.mockState.headingDegrees;
  if (!isFiniteNumber(headingDegrees)) {
    return moduleResult(module, 'running', 'Warte auf Richtung');
  }

  const feedback = getDirectionHotColdFeedback({
    headingDegrees,
    targetDegrees: readNumber(module.config.targetDegrees),
    successTolerance:
      module.config.successTolerance === undefined
        ? undefined
        : readNumber(module.config.successTolerance),
  });

  return moduleResult(
    module,
    feedback.proximity === 'correct' ? 'success' : 'running',
    getDirectionHotColdMessage(feedback.proximity, feedback.deltaDegrees),
    undefined,
    feedback,
  );
}

function evaluateHoldStill(
  module: RrrModule,
  input: RrrRuntimeEvaluationInput,
): RrrModuleResult {
  return moduleResult(
    module,
    input.mockState.isStill ? 'success' : 'running',
    input.mockState.isStill ? 'Stillhalten aktiv' : 'Warte auf Stillhalten',
  );
}

function evaluateGpsEnter(
  module: RrrModule,
  input: RrrRuntimeEvaluationInput,
): RrrModuleResult {
  const { gpsLat, gpsLng } = input.mockState;
  if (!isFiniteNumber(gpsLat) || !isFiniteNumber(gpsLng)) {
    return moduleResult(module, 'running', 'Warte auf GPS-Position');
  }

  const targetLat = readNumber(module.config.lat);
  const targetLng = readNumber(module.config.lng);
  const radiusMeters = Math.max(0, readNumber(module.config.radiusMeters));
  const distance = distanceMeters(gpsLat, gpsLng, targetLat, targetLng);
  const inside = distance <= radiusMeters;

  return moduleResult(
    module,
    inside ? 'success' : 'running',
    inside
      ? `Innerhalb von ${radiusMeters} m Radius`
      : `${Math.round(distance)} m vom Ziel entfernt`,
  );
}

function evaluateProximityHint(
  module: RrrModule,
  input: RrrRuntimeEvaluationInput,
): RrrModuleResult {
  const { gpsLat, gpsLng } = input.mockState;
  if (!isFiniteNumber(gpsLat) || !isFiniteNumber(gpsLng)) {
    return moduleResult(module, 'running', 'Warte auf GPS-Position');
  }

  const feedback = getProximityHintFeedback({
    currentLat: gpsLat,
    currentLng: gpsLng,
    targetLat: readNumber(module.config.lat),
    targetLng: readNumber(module.config.lng),
    successRadiusMeters: readNumber(module.config.successRadiusMeters),
  });

  return moduleResult(
    module,
    feedback.proximity === 'inside_target_radius' ? 'success' : 'running',
    getProximityHintMessage(feedback.proximity, feedback.distanceMeters),
    undefined,
    undefined,
    feedback,
  );
}

function evaluateQrScan(
  module: RrrModule,
  input: RrrRuntimeEvaluationInput,
): RrrModuleResult {
  const expected = readString(module.config.expectedValue);
  const actual = input.userInput.qrScanValue ?? '';

  if (!expected.trim()) {
    return moduleResult(
      module,
      'running',
      'Noch kein erwarteter QR-Wert festgelegt',
    );
  }
  if (!actual.trim()) {
    return moduleResult(module, 'running', 'Warte auf QR-Wert');
  }

  const matches = actual.trim() === expected.trim();
  return moduleResult(
    module,
    matches ? 'success' : 'failed',
    matches ? 'QR-Wert passt' : 'QR-Wert passt nicht',
  );
}

function evaluateCodeWord(
  module: RrrModule,
  input: RrrRuntimeEvaluationInput,
): RrrModuleResult {
  const expected = readString(module.config.code);
  const actual = input.userInput.codeWordValue ?? '';
  const caseSensitive = Boolean(module.config.caseSensitive);

  if (!expected.trim()) {
    return moduleResult(module, 'running', 'Noch kein Codewort festgelegt');
  }
  if (!actual.trim()) {
    return moduleResult(module, 'running', 'Warte auf Codewort');
  }

  const matches = caseSensitive
    ? actual === expected
    : actual.trim().toLowerCase() === expected.trim().toLowerCase();

  return moduleResult(
    module,
    matches ? 'success' : 'failed',
    matches ? 'Codewort passt' : 'Codewort passt nicht',
  );
}

function evaluateSequentialCode(
  module: RrrModule,
  input: RrrRuntimeEvaluationInput,
): RrrModuleResult {
  const expected = readString(module.config.code);
  const actual = input.userInput.sequentialCodeValue ?? '';
  const caseSensitive = Boolean(module.config.caseSensitive);

  if (!expected.trim()) {
    return moduleResult(module, 'running', 'Noch kein gesammelter Code festgelegt');
  }
  if (!actual.trim()) {
    return moduleResult(module, 'running', 'Warte auf gesammelten Code');
  }

  const matches = caseSensitive
    ? actual === expected
    : actual.trim().toLowerCase() === expected.trim().toLowerCase();

  return moduleResult(
    module,
    matches ? 'success' : 'failed',
    matches ? 'Gesammelter Code passt' : 'Gesammelter Code passt nicht',
  );
}

function evaluateTimerWait(
  module: RrrModule,
  input: RrrRuntimeEvaluationInput,
): RrrModuleResult {
  const durationMs = readPositiveNumber(module.config.durationMs);
  if (!durationMs) {
    return moduleResult(module, 'running', 'Noch keine Wartezeit festgelegt');
  }

  if (input.activeModuleId && input.activeModuleId !== module.id) {
    return moduleResult(module, 'running', 'Warte auf diesen Schritt');
  }

  const startedAt = input.session?.activeStepStartedAtMs;
  if (!isFiniteNumber(startedAt) || !isFiniteNumber(input.nowMs)) {
    return moduleResult(
      module,
      'running',
      `Wartezeit startet: ${formatDuration(durationMs)}`,
    );
  }

  const elapsedMs = Math.max(0, input.nowMs - startedAt);
  const remainingMs = Math.max(0, durationMs - elapsedMs);
  if (remainingMs > 0) {
    return moduleResult(
      module,
      'running',
      `Noch ${formatDuration(remainingMs)} warten`,
    );
  }

  return moduleResult(module, 'success', 'Wartezeit erfüllt');
}

function evaluateObjectFound(
  module: RrrModule,
  input: RrrRuntimeEvaluationInput,
): RrrModuleResult {
  const prompt = readString(module.config.prompt);
  if (!prompt.trim()) {
    return moduleResult(
      module,
      'running',
      'Noch keine Fund-Bestätigung festgelegt',
    );
  }

  const confirmed =
    input.userInput.objectFoundModuleIds?.includes(module.id) ?? false;

  return moduleResult(
    module,
    confirmed ? 'success' : 'running',
    confirmed ? 'Fund bestätigt' : 'Warte auf Bestätigung',
  );
}

function evaluatePhotoCheckManual(
  module: RrrModule,
  input: RrrRuntimeEvaluationInput,
): RrrModuleResult {
  const prompt = readString(module.config.prompt);
  if (!prompt.trim()) {
    return moduleResult(
      module,
      'running',
      'Noch keine Foto-Aufgabe festgelegt',
    );
  }

  const confirmed =
    input.userInput.photoCheckManualModuleIds?.includes(module.id) ?? false;

  return moduleResult(
    module,
    confirmed ? 'success' : 'running',
    confirmed ? 'Foto-Aufgabe bestätigt' : 'Warte auf Bestätigung',
  );
}

function moduleResult(
  module: RrrModule,
  status: RrrRuntimeStatus,
  message: string,
  timeout?: RrrModuleResult['timeout'],
  directionHotCold?: RrrModuleResult['directionHotCold'],
  proximityHint?: RrrModuleResult['proximityHint'],
): RrrModuleResult {
  const result: RrrModuleResult = {
    id: module.id,
    label: module.label,
    type: module.type,
    status,
    message,
  };
  if (timeout) {
    result.timeout = timeout;
  }
  if (directionHotCold) {
    result.directionHotCold = directionHotCold;
  }
  if (proximityHint) {
    result.proximityHint = proximityHint;
  }
  return result;
}

export function getDirectionHotColdFeedback({
  headingDegrees,
  targetDegrees,
  successTolerance,
}: {
  headingDegrees: number;
  targetDegrees: number;
  successTolerance?: number;
}): NonNullable<RrrModuleResult['directionHotCold']> {
  const normalizedHeading = normalizeDegrees(headingDegrees);
  const normalizedTarget = normalizeDegrees(targetDegrees);
  const tolerance = normalizeSuccessTolerance(successTolerance);
  const delta = headingDelta(normalizedHeading, normalizedTarget);

  return {
    proximity: getDirectionHotColdProximity(delta, tolerance),
    headingDegrees: normalizedHeading,
    targetDegrees: normalizedTarget,
    deltaDegrees: delta,
    successTolerance: tolerance,
  };
}

function getDirectionHotColdProximity(
  deltaDegrees: number,
  successTolerance: number,
): DirectionHotColdProximity {
  if (deltaDegrees <= successTolerance) {
    return 'correct';
  }
  if (deltaDegrees <= Math.max(30, successTolerance * 2)) {
    return 'very_warm';
  }
  if (deltaDegrees <= 75) {
    return 'warm';
  }
  if (deltaDegrees <= 135) {
    return 'cold';
  }
  return 'very_cold';
}

function getDirectionHotColdMessage(
  proximity: DirectionHotColdProximity,
  deltaDegrees: number,
): string {
  const roundedDelta = Math.round(deltaDegrees);
  const messages: Record<DirectionHotColdProximity, string> = {
    correct: 'Richtung korrekt',
    very_warm: `Sehr warm (${roundedDelta} Grad entfernt)`,
    warm: `Warm (${roundedDelta} Grad entfernt)`,
    cold: `Kalt (${roundedDelta} Grad entfernt)`,
    very_cold: `Sehr kalt (${roundedDelta} Grad entfernt)`,
  };
  return messages[proximity];
}

function normalizeSuccessTolerance(value: number | undefined): number {
  return Math.max(
    0,
    value === undefined || !Number.isFinite(value) ? 15 : value,
  );
}

export function getProximityHintFeedback({
  currentLat,
  currentLng,
  targetLat,
  targetLng,
  successRadiusMeters,
}: {
  currentLat: number;
  currentLng: number;
  targetLat: number;
  targetLng: number;
  successRadiusMeters: number;
}): NonNullable<RrrModuleResult['proximityHint']> {
  const radius = Math.max(0, successRadiusMeters);
  const distance = distanceMeters(currentLat, currentLng, targetLat, targetLng);

  return {
    proximity: getProximityHintState(distance, radius),
    distanceMeters: distance,
    targetLat,
    targetLng,
    currentLat,
    currentLng,
    successRadiusMeters: radius,
  };
}

function getProximityHintState(
  distance: number,
  successRadiusMeters: number,
): ProximityHintState {
  if (distance <= successRadiusMeters) {
    return 'inside_target_radius';
  }
  if (distance <= Math.max(successRadiusMeters * 2, 25)) {
    return 'very_near';
  }
  if (distance <= Math.max(successRadiusMeters * 5, 75)) {
    return 'near';
  }
  if (distance <= Math.max(successRadiusMeters * 15, 250)) {
    return 'getting_closer';
  }
  return 'far';
}

function getProximityHintMessage(
  proximity: ProximityHintState,
  distanceMetersValue: number,
): string {
  const roundedDistance = Math.round(distanceMetersValue);
  const messages: Record<ProximityHintState, string> = {
    inside_target_radius: 'Im Zielradius',
    very_near: `Sehr nah (${roundedDistance} m entfernt)`,
    near: `Nah (${roundedDistance} m entfernt)`,
    getting_closer: `Näher kommen (${roundedDistance} m entfernt)`,
    far: `Weit entfernt (${roundedDistance} m entfernt)`,
  };
  return messages[proximity];
}

function headingDelta(a: number, b: number): number {
  const delta = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return Math.min(delta, 360 - delta);
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function distanceMeters(
  latA: number,
  lngA: number,
  latB: number,
  lngB: number,
): number {
  const earthRadiusMeters = 6371000;
  const latDelta = toRadians(latB - latA);
  const lngDelta = toRadians(lngB - lngA);
  const startLat = toRadians(latA);
  const endLat = toRadians(latB);
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2;
  return (
    2 *
    earthRadiusMeters *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((entry) => (typeof entry === 'string' ? entry : ''))
    : [];
}

function readNumberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          if (typeof entry === 'number') return entry;
          if (typeof entry === 'string') return Number(entry);
          return Number.NaN;
        })
        .filter((entry) => Number.isInteger(entry) && entry >= 0)
    : [];
}

function normalizeIndexSet(indexes: number[]): Set<number> {
  return new Set(indexes.filter((index) => Number.isInteger(index) && index >= 0));
}

function setsEqual(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const value of a) {
    if (!b.has(value)) {
      return false;
    }
  }
  return true;
}

function readNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function readPositiveNumber(value: unknown): number | undefined {
  const number = readNumber(value);
  return number > 0 ? number : undefined;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function formatDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${Math.ceil(durationMs)} ms`;
  }
  return `${Math.ceil(durationMs / 1000)} s`;
}
