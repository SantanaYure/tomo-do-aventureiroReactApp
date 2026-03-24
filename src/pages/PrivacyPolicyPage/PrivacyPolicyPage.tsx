import { Link } from 'react-router-dom'
import { PRIVACY_SECTIONS, PRIVACY_LAST_UPDATED } from '../../components/PrivacyPolicyModal/privacySections'
import styles from './PrivacyPolicyPage.module.css'

export function PrivacyPolicyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.headerIcon} aria-hidden="true">📜</span>
          <h1 className={styles.title}>Política de Privacidade</h1>
          <p className={styles.subtitle}>Tomo do Aventureiro</p>
          <p className={styles.lastUpdated}>Última atualização: {PRIVACY_LAST_UPDATED}</p>
        </header>

        <nav className={styles.toc} aria-label="Índice">
          <p className={styles.tocTitle}>Sumário</p>
          <ol className={styles.tocList}>
            {PRIVACY_SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className={styles.tocLink}>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className={styles.ornament} aria-hidden="true">✦ ✦ ✦</div>

        <main className={styles.content}>
          {PRIVACY_SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className={styles.section}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              <div className={styles.sectionBody}>{section.content}</div>
            </section>
          ))}
        </main>

        <div className={styles.ornament} aria-hidden="true">✦ ✦ ✦</div>

        <footer className={styles.footer}>
          <p>© 2025 Tomo do Aventureiro. Todos os direitos reservados.</p>
          <Link to="/login" className={styles.backLink}>← Voltar ao login</Link>
        </footer>
      </div>
    </div>
  )
}
