function ModuleCard({ description, title }) {
  return (
    <article className="module-card">
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  )
}

export default ModuleCard

