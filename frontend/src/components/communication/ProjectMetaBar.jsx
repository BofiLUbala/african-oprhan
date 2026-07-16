import React from 'react'
import CIcon from './icons'

/**
 * Bandeau de métadonnées d'un projet publié — réutilisé partout où un
 * `Project` est affiché (Accueil, PublicAccueil, listes Communication,
 * Historique, cartes Partenaire) au lieu de ré-écrire code/expéditeur/dates/
 * statut/barre de progression à chaque endroit. Ne dépend d'aucun état de
 * EclatSocialApp : peut être monté aussi bien dans le module authentifié que
 * dans PublicAccueil (visiteur anonyme) ou les cartes Partenaire.
 *
 * Toutes les données (code, createur_nom, createur_role, date_debut,
 * date_fin, date_status, candidatures_count) viennent déjà du backend
 * (ProjetListSerializer) — ce composant ne fait que le calcul du % de délai
 * écoulé, aucun appel réseau.
 */
// Project.createur_role utilise les valeurs françaises de
// projets/constants.py ROLES_CREATEUR (directeur/ambassadeur/federation),
// distinctes de User.role (director/ambassador/federation/...).
const ROLE_LABELS = {
  directeur: "Chef d'orphelinat", ambassadeur: 'Ambassadeur', federation: 'Fédération',
  director: "Chef d'orphelinat", ambassador: 'Ambassadeur',
  supermaster: 'Super Master', partner: 'Partenaire',
}

const DATE_STATUS = {
  active: { label: 'Actif', icon: 'check', color: '#22c55e' },
  ending_soon: { label: 'Se termine bientôt', icon: 'clock', color: '#f59e0b' },
  closed: { label: 'Clôturé', icon: 'x', color: '#ef4444' },
}

function fmtDate(d) {
  if (!d) return null
  try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return d }
}

// % du délai écoulé entre date_debut et date_fin — toujours calculable dès
// que les deux dates existent (obligatoires à la création), donc la barre
// s'affiche de façon cohérente sur CHAQUE projet, quel que soit l'endroit où
// il est affiché (contrairement à un ancien indicateur basé sur budget_total,
// absent sur certains projets).
function timeProgress(project) {
  const start = project.date_debut ? new Date(project.date_debut) : null
  const end = project.date_fin ? new Date(project.date_fin) : null
  if (!start || !end || end <= start) return null
  const now = new Date()
  if (now <= start) return 0
  if (now >= end) return 100
  return Math.round(((now - start) / (end - start)) * 100)
}

export default function ProjectMetaBar({ project, compact = false }) {
  if (!project) return null
  const status = project.date_status ? DATE_STATUS[project.date_status] : null
  const roleLabel = ROLE_LABELS[project.createur_role] || project.createur_role
  const pct = timeProgress(project)
  const nbPostulations = Number(project.candidatures_count) || 0
  const goal = Number(project.budget_total) || 0
  const raised = Number(project.montant_collecte) || 0

  return (
    <div className={`proj-meta-bar${compact ? ' proj-meta-bar-compact' : ''}`}>
      <div className="proj-meta-row">
        {project.code && <span className="proj-meta-code"><CIcon name="hash" size={11} /> {project.code}</span>}
        {project.createur_nom && (
          <span className="proj-meta-sender">
            {project.createur_nom}{roleLabel ? <span className="proj-meta-role"> · {roleLabel}</span> : null}
          </span>
        )}
      </div>
      <div className="proj-meta-row">
        {project.created_at && <span className="proj-meta-date"><CIcon name="clock" size={11} /> Publié le {fmtDate(project.created_at)}</span>}
        {(project.date_debut || project.date_fin) && (
          <span className="proj-meta-date">
            {fmtDate(project.date_debut) || '—'} → {fmtDate(project.date_fin) || '—'}
          </span>
        )}
      </div>
      {status && (
        <span className="proj-meta-status" style={{ '--status-color': status.color }}>
          <CIcon name={status.icon} size={11} /> {status.label}
        </span>
      )}
      <div className="proj-meta-progress">
        <div className="proj-meta-progress-track"><div className="proj-meta-progress-fill" style={{ width: `${pct ?? 0}%`, opacity: pct == null ? 0.3 : 1 }} /></div>
        <span className="proj-meta-progress-label">
          {pct == null ? 'Dates non définies' : `${pct}% du délai écoulé`}
          {goal > 0 && ` · ${raised.toLocaleString('fr-FR')} € / ${goal.toLocaleString('fr-FR')} €`}
          {' · '}{nbPostulations} postulation{nbPostulations !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
