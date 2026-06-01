import ModuleCard from '../components/common/ModuleCard'
import { erpModules } from '../config/modules'

function Dashboard() {
  return (
    <>
      <section className="hero-panel" id="dashboard">
        <p className="eyebrow">Phase 1 Foundation</p>
        <h2>ERP structure for school operations</h2>
        <p>
          A clean project shell for admissions, attendance, fees, staff, inventory,
          and reporting workflows.
        </p>
      </section>

      <section className="section" id="modules">
        <div className="section-header">
          <p className="eyebrow">Core Areas</p>
          <h2>Module scaffold</h2>
        </div>
        <div className="module-grid">
          {erpModules.map((module) => (
            <ModuleCard key={module.title} {...module} />
          ))}
        </div>
      </section>

      <section className="section phase-strip" id="phase">
        <p className="eyebrow">Status</p>
        <h2>Phase 1 only</h2>
        <p>Project folders, application shell, API health endpoint, and environment examples are in place.</p>
      </section>
    </>
  )
}

export default Dashboard

