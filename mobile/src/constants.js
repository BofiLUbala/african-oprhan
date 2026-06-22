export const API = 'http://localhost:8000/api'

export const AFRICAN_COUNTRIES = [
  { code: "AO", name: "Angola" }, { code: "BJ", name: "Bénin" }, { code: "BW", name: "Botswana" },
  { code: "BF", name: "Burkina Faso" }, { code: "BI", name: "Burundi" }, { code: "CM", name: "Cameroun" },
  { code: "CV", name: "Cap-Vert" }, { code: "CF", name: "République centrafricaine" },
  { code: "KM", name: "Comores" }, { code: "CG", name: "Congo-Brazzaville" },
  { code: "CD", name: "République démocratique du Congo" }, { code: "CI", name: "Côte d'Ivoire" },
  { code: "DJ", name: "Djibouti" }, { code: "EG", name: "Égypte" }, { code: "GQ", name: "Guinée équatoriale" },
  { code: "ER", name: "Érythrée" }, { code: "SZ", name: "Eswatini" }, { code: "ET", name: "Éthiopie" },
  { code: "GA", name: "Gabon" }, { code: "GM", name: "Gambie" }, { code: "GH", name: "Ghana" },
  { code: "GN", name: "Guinée" }, { code: "GW", name: "Guinée-Bissau" }, { code: "KE", name: "Kenya" },
  { code: "LS", name: "Lesotho" }, { code: "LR", name: "Liberia" }, { code: "LY", name: "Libye" },
  { code: "MG", name: "Madagascar" }, { code: "MW", name: "Malawi" }, { code: "ML", name: "Mali" },
  { code: "MR", name: "Mauritanie" }, { code: "MU", name: "Maurice" }, { code: "MA", name: "Maroc" },
  { code: "MZ", name: "Mozambique" }, { code: "NA", name: "Namibie" }, { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" }, { code: "RW", name: "Rwanda" }, { code: "ST", name: "Sao Tomé-et-Principe" },
  { code: "SN", name: "Sénégal" }, { code: "SC", name: "Seychelles" }, { code: "SL", name: "Sierra Leone" },
  { code: "SO", name: "Somalie" }, { code: "ZA", name: "Afrique du Sud" }, { code: "SS", name: "Soudan du Sud" },
  { code: "SD", name: "Soudan" }, { code: "TZ", name: "Tanzanie" }, { code: "TG", name: "Togo" },
  { code: "TN", name: "Tunisie" }, { code: "UG", name: "Ouganda" }, { code: "ZM", name: "Zambie" },
  { code: "ZW", name: "Zimbabwe" },
]

export const ROLE_LABELS = {
  director: 'Directeur d\'Orphelinat',
  ambassador: 'Ambassadeur',
  supermaster: 'Super Master',
  federation: 'Fédération',
  partner: 'Partenaire',
}

export const ROLE_NAV = {
  director: [
    { label: 'Tableau de bord', key: 'dashboard' },
    { label: 'Enfants', key: 'enfants' },
    { label: 'Projets', key: 'projets' },
    { label: 'Documents', key: 'documents' },
    { label: 'Communication', key: 'communication' },
    { label: 'Paramètres', key: 'parametres' },
  ],
  ambassador: [
    { label: 'Tableau de bord', key: 'dashboard' },
    { label: 'Multi-orphelinats', key: 'multiOrphelinats' },
    { label: 'Validation', key: 'validationLocale' },
    { label: 'Projets', key: 'projets' },
    { label: 'Rapports', key: 'rapports' },
    { label: 'Communication', key: 'communication' },
    { label: 'Paramètres', key: 'parametres' },
  ],
  supermaster: [
    { label: 'Tableau de bord', key: 'dashboard' },
    { label: 'Système', key: 'systeme' },
    { label: 'Utilisateurs', key: 'users' },
    { label: 'Orphelinats', key: 'orphelinats' },
    { label: 'Rapports', key: 'rapports' },
    { label: 'Communication', key: 'communication' },
    { label: 'Paramètres', key: 'parametres' },
  ],
  federation: [
    { label: 'Tableau de bord', key: 'dashboard' },
    { label: 'Utilisateurs', key: 'users' },
    { label: 'Orphelinats', key: 'orphelinats' },
    { label: 'Partenaires', key: 'partenaires' },
    { label: 'Rapports', key: 'rapports' },
    { label: 'Communication', key: 'communication' },
    { label: 'Paramètres', key: 'parametres' },
  ],
  partner: [
    { label: 'Tableau de bord', key: 'dashboard' },
    { label: 'Besoins', key: 'besoins' },
    { label: 'Projets', key: 'projets' },
    { label: 'Parrainages', key: 'parrainages' },
    { label: 'Rapports', key: 'rapports' },
    { label: 'Communication', key: 'communication' },
    { label: 'Paramètres', key: 'parametres' },
  ],
}

export const ROLE_STATS = {
  director: [
    { label: 'ENFANTS', value: '24', sub: 'CAPACITÉ : 95%', color: '#f59e0b' },
    { label: 'PROJETS', value: '6', sub: 'ACTIFS', color: '#3b82f6' },
    { label: 'AMBASSADEURS', value: '12', sub: 'CONNECTÉS', color: '#a855f7' },
    { label: 'DEMANDES', value: '5', sub: 'CRITIQUES', color: '#ef4444' },
  ],
  ambassador: [
    { label: 'ORPHELINATS', value: '8', sub: 'SUIVIS', color: '#f59e0b' },
    { label: 'PROJETS', value: '12', sub: 'EN COURS', color: '#3b82f6' },
    { label: 'VALIDATIONS', value: '28', sub: 'CE MOIS', color: '#22c55e' },
    { label: 'ALERTES', value: '3', sub: 'NON RÉSOLUES', color: '#ef4444' },
  ],
  supermaster: [
    { label: 'UTILISATEURS', value: '156', sub: 'ACTIFS : 42', color: '#3b82f6' },
    { label: 'CENTRES', value: '12', sub: 'OPÉRATIONNELS', color: '#22c55e' },
    { label: 'AMBASSADEURS', value: '12', sub: 'EN POSTE', color: '#f59e0b' },
    { label: 'ALERTES', value: '0', sub: 'CRITIQUES', color: '#ef4444' },
  ],
  federation: [
    { label: 'ORPHELINATS', value: '12', sub: 'SUPERVISÉS', color: '#f59e0b' },
    { label: 'AMBASSADEURS', value: '12', sub: 'ACTIFS', color: '#3b82f6' },
    { label: 'PARTENAIRES', value: '6', sub: 'ACTIFS', color: '#22c55e' },
    { label: 'VALIDATIONS', value: '8', sub: 'EN ATTENTE', color: '#ef4444' },
  ],
  partner: [
    { label: 'CONTRIBUTIONS', value: '12', sub: 'PROJETS', color: '#f59e0b' },
    { label: 'PARRAINAGES', value: '3', sub: 'ENFANTS', color: '#3b82f6' },
    { label: 'DONS', value: '5', sub: 'CETTE ANNÉE', color: '#22c55e' },
    { label: 'RAPPORTS', value: '8', sub: 'DISPO.', color: '#a855f7' },
  ],
}

export const ROLE_PAGES = {
  director: {
    dashboard: { title: 'Tableau de bord général', subtitle: "Vue d'ensemble de l'état de l'orphelinat.", categories: [
      { id: 'D1', title: 'Résumé des opérations', subtitle: '5 Alertes', count: 5 },
      { id: 'D2', title: 'Indicateurs de performance', subtitle: '12 Métriques', count: 12 },
      { id: 'D3', title: 'Actions prioritaires', subtitle: '3 En attente', count: 3 },
      { id: 'D4', title: 'Calendrier', subtitle: '8 Événements', count: 8 },
    ]},
    enfants: { title: 'Profil Complet', subtitle: 'Dossier numérique complet de chaque enfant.', categories: [
      { id: 'E1', title: 'Profil & identité', subtitle: 'Nom, prénom, sexe, âge, photo', count: 24 },
      { id: 'E2', title: 'Situation familiale', subtitle: 'Parents, tuteurs, fratrie, historique', count: 24 },
      { id: 'E3', title: 'Documents administratifs', subtitle: 'Acte de naissance, pièces, décisions', count: 24 },
      { id: 'E4', title: 'Santé & médical', subtitle: 'Groupe sanguin, vaccins, allergies, traitements', count: 24 },
      { id: 'E5', title: 'Scolarité', subtitle: 'Établissement, classe, résultats, bulletins', count: 24 },
    ]},
    parametres: { title: 'Paramètres', subtitle: 'Configuration du compte.', categories: [
      { id: 'S1', title: 'Profil utilisateur', subtitle: 'Photo, mot de passe', count: 3 },
      { id: 'S2', title: 'Notifications', subtitle: 'Alertes et rappels', count: 6 },
      { id: 'S3', title: 'Sécurité', subtitle: 'Authentification', count: 4 },
      { id: 'S4', title: 'Configuration', subtitle: 'Paramètres système', count: 2 },
    ]},
  },
  ambassador: {
    dashboard: { title: 'Tableau de bord', subtitle: "Vue d'ensemble des orphelinats suivis.", categories: [
      { id: 'D1', title: 'Orphelinats actifs', subtitle: '8 Centres', count: 8 },
      { id: 'D2', title: 'Alertes en cours', subtitle: '3 Non résolues', count: 3 },
      { id: 'D3', title: 'Projets en suivi', subtitle: '12 Projets', count: 12 },
      { id: 'D4', title: 'Dons vérifiés', subtitle: '45 Ce mois', count: 45 },
    ]},
    parametres: { title: 'Paramètres', subtitle: 'Configuration du compte.', categories: [
      { id: 'S1', title: 'Profil', subtitle: 'Photo, mot de passe', count: 3 },
      { id: 'S2', title: 'Notifications', subtitle: 'Alertes', count: 6 },
      { id: 'S3', title: 'Sécurité', subtitle: 'Authentification', count: 4 },
      { id: 'S4', title: 'Configuration', subtitle: 'Préférences', count: 2 },
    ]},
  },
  supermaster: {
    dashboard: { title: 'Supervision générale', subtitle: "Administration centrale du système.", categories: [
      { id: 'D1', title: 'État du système', subtitle: 'Opérationnel', count: 100 },
      { id: 'D2', title: 'Utilisateurs actifs', subtitle: '42 Connectés', count: 42 },
      { id: 'D3', title: 'Alertes sécurité', subtitle: '0 Critique', count: 0 },
      { id: 'D4', title: 'Maintenance', subtitle: 'Planifiée', count: 2 },
    ]},
    parametres: { title: 'Paramètres', subtitle: 'Configuration globale.', categories: [
      { id: 'S1', title: 'Profil', subtitle: 'Informations', count: 3 },
      { id: 'S2', title: 'Sécurité', subtitle: 'Accès et logs', count: 4 },
      { id: 'S3', title: 'Notifications', subtitle: 'Alertes système', count: 6 },
      { id: 'S4', title: 'API', subtitle: 'Jetons et clés', count: 2 },
    ]},
  },
  federation: {
    dashboard: { title: "Tableau de bord de la Fédération", subtitle: "Gouvernance centrale des orphelinats.", categories: [
      { id: 'D1', title: 'Activités en cours', subtitle: '32 Actions', count: 32 },
      { id: 'D2', title: 'Validations requises', subtitle: '8 En attente', count: 8 },
      { id: 'D3', title: 'Partenariats actifs', subtitle: '6 Partenaires', count: 6 },
      { id: 'D4', title: 'Rapports du mois', subtitle: '4 Reçus', count: 4 },
    ]},
    parametres: { title: 'Paramètres', subtitle: 'Configuration du compte.', categories: [
      { id: 'S1', title: 'Profil', subtitle: 'Informations', count: 3 },
      { id: 'S2', title: 'Sécurité', subtitle: 'Accès', count: 4 },
      { id: 'S3', title: 'Notifications', subtitle: 'Alertes', count: 6 },
      { id: 'S4', title: 'Configuration', subtitle: 'Préférences', count: 2 },
    ]},
  },
  partner: {
    dashboard: { title: 'Tableau de bord', subtitle: "Vue d'ensemble des contributions.", categories: [
      { id: 'D1', title: 'Mes contributions', subtitle: '12 Projets financés', count: 12 },
      { id: 'D2', title: 'Parrainages en cours', subtitle: '3 Enfants', count: 3 },
      { id: 'D3', title: 'Besoins urgents', subtitle: '5 Nouveaux', count: 5 },
      { id: 'D4', title: 'Rapports disponibles', subtitle: '8 Documents', count: 8 },
    ]},
    parametres: { title: 'Paramètres', subtitle: 'Configuration du compte.', categories: [
      { id: 'S1', title: 'Profil', subtitle: 'Mes informations', count: 3 },
      { id: 'S2', title: 'Notifications', subtitle: "Alertes d'activité", count: 6 },
      { id: 'S3', title: 'Sécurité', subtitle: 'Mot de passe', count: 4 },
      { id: 'S4', title: 'Configuration', subtitle: 'Préférences', count: 2 },
    ]},
  },
}

export const CATEGORY_ICONS = ['📋', '📈', '⚡', '📅', '📄', '🏫', '📢', '🤝', '👤', '🏠']

export const RECENT_ACTIVITIES = [
  { text: 'Rapport médical ajouté · S. Kone', time: 'il y a 10 min' },
  { text: 'Validation administrative · Dossier 04', time: 'il y a 1h' },
]

export const CHILD_FORMS = {
  'Profil & identité': {
    fields: [
      { label: 'Numéro unique', type: 'uid' },
      { label: 'Nom', type: 'text' },
      { label: 'Prénom', type: 'text' },
      { label: 'Sexe', type: 'select', options: ['Masculin', 'Féminin'] },
      { label: 'Date de naissance', type: 'date' },
      { label: 'Nationalité', type: 'select', options: AFRICAN_COUNTRIES.map(c => c.name) },
      { label: 'Adresse d\'origine', type: 'text' },
    ],
  },
  'Situation familiale': {
    fields: [
      { label: 'Parents connus', type: 'select', options: ['Oui', 'Non', 'Non renseigné'] },
      { label: 'Tuteurs', type: 'text' },
      { label: 'Fratrie', type: 'textarea' },
      { label: 'Historique familial', type: 'textarea' },
    ],
  },
  'Documents administratifs': {
    fields: [
      { label: 'Acte de naissance', type: 'file' },
      { label: 'Documents d\'identité', type: 'file' },
      { label: 'Décisions judiciaires', type: 'file' },
    ],
  },
  'Santé & médical': {
    fields: [
      { label: 'Groupe sanguin', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
      { label: 'Vaccinations', type: 'textarea' },
      { label: 'Allergies', type: 'textarea' },
      { label: 'Traitements', type: 'textarea' },
    ],
  },
  'Scolarité': {
    fields: [
      { label: 'Établissement', type: 'text' },
      { label: 'Classe', type: 'text' },
      { label: 'Résultats', type: 'textarea' },
      { label: 'Bulletins', type: 'file' },
    ],
  },
}

export function genChildUid(exclude = new Set()) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let uid
  do {
    uid = ''
    for (let i = 0; i < 12; i++) uid += chars[Math.floor(Math.random() * chars.length)]
  } while (exclude.has(uid))
  return uid
}

export function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

export function hueFromName(name) {
  if (!name) return 200
  return name.charCodeAt(0) * 37 % 360
}

export const COLORS = {
  bg: '#0b1121',
  bgCard: '#1e293b',
  bgCardAlt: '#0f172a',
  border: '#334155',
  borderLight: 'rgba(255,255,255,0.04)',
  text: '#e2e8f0',
  textMuted: '#64748b',
  textBody: '#94a3b8',
  accent: '#f59e0b',
  accentDim: 'rgba(245,158,11,0.1)',
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
}
