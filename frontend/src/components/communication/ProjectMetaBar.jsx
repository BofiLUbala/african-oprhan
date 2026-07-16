import React from 'react'
import CIcon from './icons'

/**
 * Bandeau de métadonnées d'un projet publié — réutilisé partout où un
 * `Project` est affiché (Accueil, PublicAccueil, listes Communication,
 * Historique) au lieu de ré-écrire code/expéditeur/dates/statut à chaque
 * endroit. Ne dépend d'aucun état de EclatSocialApp : peut être monté aussi
 * bien dans le module authentifié que dans PublicAccueil (visiteur anonyme).
 *
 * Toutes les données (code, createur_nom, createur_role, date_debut,
 * date_fin, date_status) viennent déjà du backend (ProjetListSerializer) —
 * ce composant ne fait aucun calcul de date, il affiche uniquement.
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

export default function ProjectMetaBar({ project, compact = false }) {
  if (!project) return null
  const status = project.date_status ? DATE_STATUS[project.date_status] : null
  const roleLabel = ROLE_LABELS[project.createur_role] || project.createur_role

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
    </div>
  )
}
