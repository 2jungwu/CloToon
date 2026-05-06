export default function SettingsPage() {
  return (
    <section className="page-shell">
      <div className="page-heading">
        <p className="eyebrow">Settings</p>
        <h1>설정</h1>
        <p>Provider 설정은 Phase 5에서 구현됩니다.</p>
      </div>
      <div className="placeholder-panel">
        <div className="accent-strip" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <h2>로컬 제작 환경</h2>
        <p>Gemini API 키, mock provider, export 품질 옵션을 나중에 이 화면에서 조정합니다.</p>
      </div>
    </section>
  );
}
