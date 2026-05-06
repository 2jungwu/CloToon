export default function AssetsPage() {
  return (
    <section className="page-shell">
      <div className="page-heading">
        <p className="eyebrow">Assets</p>
        <h1>자산 설정</h1>
        <p>캐릭터, 배경, 폰트 설정은 Phase 3에서 구현됩니다.</p>
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
        <h2>캐릭터와 제작 자산</h2>
        <p>clo 같은 캐릭터 설명 Markdown, 표정 이미지, 배경과 폰트 프로필을 이곳에서 관리할 예정입니다.</p>
      </div>
    </section>
  );
}
