import type { RrrInteraction } from '@/rrr';
import { RrrMockPreview } from '@/components/rrr-author/RrrMockPreview';

const DEMO_INTERACTION: RrrInteraction = {
  schemaVersion: 1,
  modules: [
    {
      id: 'demo_compass',
      type: 'compass_align',
      label: 'Nach Osten schauen',
      config: {
        targetDegrees: 90,
        tolerance: 12,
      },
    },
    {
      id: 'demo_gps',
      type: 'gps_enter',
      label: 'Beim Testpunkt stehen',
      config: {
        lat: 46.4983,
        lng: 11.3548,
        radiusMeters: 25,
      },
    },
    {
      id: 'demo_stillness',
      type: 'hold_still',
      label: 'Stillhalten',
      config: {},
    },
    {
      id: 'demo_answer',
      type: 'text_answer',
      label: 'Kennwort eingeben',
      config: {
        answer: 'meran',
      },
    },
  ],
  condition: {
    type: 'all_of',
    children: [
      { type: 'module', moduleId: 'demo_compass' },
      { type: 'module', moduleId: 'demo_gps' },
      { type: 'module', moduleId: 'demo_stillness' },
      { type: 'module', moduleId: 'demo_answer' },
    ],
  },
};

export function RrrRuntimeDemo() {
  return (
    <section className="stq-rrr-demo" aria-label="Demo für modulares Rätsel">
      <div className="stq-rrr-demo__header">
        <div>
          <p>Entwicklungsseite</p>
          <h1>Demo für modulares Rätsel</h1>
        </div>
        <span>Nur Testwerte</span>
      </div>

      <div className="stq-rrr-demo__grid">
        <article className="stq-rrr-demo__panel">
          <h2>Beispielhafter Rätselablauf</h2>
          <p>
            Eine Lösungsregel kombiniert Richtung, Zielbereich, Stillhalten und
            Textantwort. Nutze die Testwerte, um jeden Baustein zu erfüllen.
          </p>
          <dl className="stq-rrr-demo__facts">
            <div>
              <dt>Zielrichtung</dt>
              <dd>90 Grad, +/- 12</dd>
            </div>
            <div>
              <dt>GPS-Ziel</dt>
              <dd>46.4983, 11.3548 within 25 m</dd>
            </div>
            <div>
              <dt>Kennwort</dt>
              <dd>meran</dd>
            </div>
          </dl>
        </article>

        <RrrMockPreview interaction={DEMO_INTERACTION} />
      </div>
    </section>
  );
}
