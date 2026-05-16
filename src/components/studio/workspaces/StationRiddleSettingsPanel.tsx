import {
  createEmptyRrrInteraction,
  withRiddleType,
  type RiddleEntry,
  type RrrFieldTestIssueTag,
  type RrrFieldTestStatus,
} from '@/schema';
import {
  RRR_FIELD_TEST_ISSUE_TAG_OPTIONS,
  RRR_FIELD_TEST_STATUS_OPTIONS,
  fromRrrFieldTestDateTimeLocalValue,
  getRrrFieldTestStatusLabel,
  toRrrFieldTestDateTimeLocalValue,
} from '@/rrr';
import { LazyRrrInteractionEditor } from './LazyRrrInteractionEditor';

interface StationRiddleSettingsPanelProps {
  station: RiddleEntry;
  onPatchStation: (patch: Partial<RiddleEntry>) => void;
}

export function StationRiddleSettingsPanel({
  station,
  onPatchStation,
}: StationRiddleSettingsPanelProps) {
  const isText = station.riddleType === 'text';
  const isModular = station.riddleType === 'modular';
  const fieldTestStatus = station.fieldTestStatus ?? 'not_tested';
  const fieldTestIssueTags = station.fieldTestIssueTags ?? [];
  const fieldTestNotes = station.fieldTestNotes ?? '';
  const fieldTestTestedAt = station.fieldTestTestedAt ?? '';

  function patchFieldTestStatus(status: RrrFieldTestStatus) {
    onPatchStation({
      fieldTestStatus: status,
      fieldTestTestedAt:
        status === 'not_tested'
          ? undefined
          : station.fieldTestTestedAt ?? new Date().toISOString(),
    });
  }

  function toggleFieldTestIssueTag(
    tag: RrrFieldTestIssueTag,
    checked: boolean,
  ) {
    const nextTags = checked
      ? [...new Set([...fieldTestIssueTags, tag])]
      : fieldTestIssueTags.filter((entry) => entry !== tag);
    onPatchStation({ fieldTestIssueTags: nextTags });
  }

  return (
    <div className="stq-edit-panel-field">
      <RiddleTypeSwitch
        station={station}
        isText={isText}
        isModular={isModular}
        onPatchStation={onPatchStation}
      />
      {isModular && (
        <>
          <FieldTestMetadataForm
            status={fieldTestStatus}
            issueTags={fieldTestIssueTags}
            notes={fieldTestNotes}
            testedAt={fieldTestTestedAt}
            onStatusChange={patchFieldTestStatus}
            onIssueTagChange={toggleFieldTestIssueTag}
            onTestedAtChange={(fieldTestTestedAt) =>
              onPatchStation({ fieldTestTestedAt })
            }
            onNotesChange={(fieldTestNotes) =>
              onPatchStation({ fieldTestNotes })
            }
          />
          <LazyRrrInteractionEditor
            interaction={station.interaction ?? createEmptyRrrInteraction()}
            stationId={station.id}
            fieldTestIssueTags={fieldTestIssueTags}
            stationTitle={getStationTitle(station)}
            onChange={(interaction) => onPatchStation({ interaction })}
          />
        </>
      )}
    </div>
  );
}

function RiddleTypeSwitch({
  station,
  isText,
  isModular,
  onPatchStation,
}: {
  station: RiddleEntry;
  isText: boolean;
  isModular: boolean;
  onPatchStation: (patch: Partial<RiddleEntry>) => void;
}) {
  return (
    <>
      <div className="stq-edit-panel-label">Riddle type</div>
      <div
        className="stq-riddle-type-switch"
        role="group"
        aria-label="Riddle type"
      >
        <button
          type="button"
          className={`stq-riddle-type-switch__option${isText ? ' is-active' : ''}`}
          aria-pressed={isText}
          onClick={() => onPatchStation(withRiddleType(station, 'text'))}
        >
          Text
        </button>
        <button
          type="button"
          className={`stq-riddle-type-switch__option${isModular ? ' is-active' : ''}`}
          aria-pressed={isModular}
          onClick={() => onPatchStation(withRiddleType(station, 'modular'))}
        >
          Modulares Rätsel
        </button>
      </div>
    </>
  );
}

function FieldTestMetadataForm({
  status,
  issueTags,
  notes,
  testedAt,
  onStatusChange,
  onIssueTagChange,
  onTestedAtChange,
  onNotesChange,
}: {
  status: RrrFieldTestStatus;
  issueTags: RrrFieldTestIssueTag[];
  notes: string;
  testedAt: string;
  onStatusChange: (status: RrrFieldTestStatus) => void;
  onIssueTagChange: (tag: RrrFieldTestIssueTag, checked: boolean) => void;
  onTestedAtChange: (value: string | undefined) => void;
  onNotesChange: (value: string) => void;
}) {
  return (
    <div className="stq-rrr-field-test-status">
      <div>
        <span>Feldtest-Status</span>
        <strong>{getRrrFieldTestStatusLabel(status)}</strong>
      </div>
      <select
        className="stq-rrr-editor__select"
        value={status}
        onChange={(event) =>
          onStatusChange(event.target.value as RrrFieldTestStatus)
        }
      >
        {RRR_FIELD_TEST_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div
        className="stq-rrr-field-test-tags"
        aria-label="Feldtest-Problem-Tags"
      >
        {RRR_FIELD_TEST_ISSUE_TAG_OPTIONS.map((option) => (
          <label key={option.value} className="stq-rrr-check">
            <input
              type="checkbox"
              checked={issueTags.includes(option.value)}
              onChange={(event) =>
                onIssueTagChange(option.value, event.target.checked)
              }
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      <label className="stq-rrr-field">
        <span>Getestet am</span>
        <input
          type="datetime-local"
          value={toRrrFieldTestDateTimeLocalValue(testedAt)}
          onChange={(event) =>
            onTestedAtChange(
              fromRrrFieldTestDateTimeLocalValue(event.target.value),
            )
          }
        />
      </label>
      <label className="stq-rrr-field">
        <span>Feldtest-Notizen</span>
        <textarea
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Optional: Beobachtungen, Gerätehinweise oder offene Punkte"
        />
      </label>
    </div>
  );
}

function getStationTitle(station: RiddleEntry): string {
  return (
    station.de.location ||
    station.en.location ||
    station.it.location ||
    `Station ${station.number}`
  );
}
