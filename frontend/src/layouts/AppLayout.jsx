function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">MLK ERP</p>
          <h1>Mother&apos;s Love Kids ERP</h1>
        </div>
        <nav aria-label="Main navigation">
          <a href="#dashboard">Dashboard</a>
          <a href="#modules">Modules</a>
          <a href="#phase">Phase 1</a>
        </nav>
      </aside>
      <main>{children}</main>
    </div>
  )
}

export default AppLayout

