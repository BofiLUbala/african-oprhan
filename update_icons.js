const fs = require('fs');
const path = require('path');

const jsxPath = path.join(__dirname, 'frontend/src/App.jsx');
let jsx = fs.readFileSync(jsxPath, 'utf8');

const ICONS = {
  '🏠': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{marginRight: 8}}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
  '👤': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{marginRight: 8}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
  '💬': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{marginRight: 8}}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
  '🔔': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{marginRight: 8}}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
  '⚙️': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{marginRight: 8}}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
  '🔍': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{marginRight: 8}}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
  '✏️': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{marginRight: 8}}><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>',
  '🚪': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{marginRight: 8}}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>'
};

// Quick replacement for EclatSocialApp nav
jsx = jsx.replace(/>🏠 Accueil<\/button>/g, '>{' + JSON.stringify(ICONS['🏠']) + '} Accueil</button>'.replace(/"/g, "'").replace(/'<svg/, '<svg').replace(/<\/svg>'/, '</svg>'));
jsx = jsx.replace(/>👤 Profil<\/button>/g, '>{' + JSON.stringify(ICONS['👤']) + '} Profil</button>'.replace(/"/g, "'").replace(/'<svg/, '<svg').replace(/<\/svg>'/, '</svg>'));
jsx = jsx.replace(/>💬 Messages /g, '>{' + JSON.stringify(ICONS['💬']) + '} Messages '.replace(/"/g, "'").replace(/'<svg/, '<svg').replace(/<\/svg>'/, '</svg>'));
jsx = jsx.replace(/>🔔 Notifications<\/button>/g, '>{' + JSON.stringify(ICONS['🔔']) + '} Notifications</button>'.replace(/"/g, "'").replace(/'<svg/, '<svg').replace(/<\/svg>'/, '</svg>'));
jsx = jsx.replace(/>⚙️ Paramètres<\/button>/g, '>{' + JSON.stringify(ICONS['⚙️']) + '} Paramètres</button>'.replace(/"/g, "'").replace(/'<svg/, '<svg').replace(/<\/svg>'/, '</svg>'));

// Bottom nav replacement
jsx = jsx.replace(/<span className="es-nav-icon">🏠<\/span>/g, '<span className="es-nav-icon">{' + JSON.stringify(ICONS['🏠']).replace(/"/g, "'").replace(/'<svg/, '<svg').replace(/<\/svg>'/, '</svg>') + '}</span>');
jsx = jsx.replace(/<span className="es-nav-icon">🔍<\/span>/g, '<span className="es-nav-icon">{' + JSON.stringify(ICONS['🔍']).replace(/"/g, "'").replace(/'<svg/, '<svg').replace(/<\/svg>'/, '</svg>') + '}</span>');
jsx = jsx.replace(/<span className="es-nav-icon">🔔<\/span>/g, '<span className="es-nav-icon">{' + JSON.stringify(ICONS['🔔']).replace(/"/g, "'").replace(/'<svg/, '<svg').replace(/<\/svg>'/, '</svg>') + '}</span>');
jsx = jsx.replace(/<span className="es-nav-icon">👤<\/span>/g, '<span className="es-nav-icon">{' + JSON.stringify(ICONS['👤']).replace(/"/g, "'").replace(/'<svg/, '<svg').replace(/<\/svg>'/, '</svg>') + '}</span>');

fs.writeFileSync(jsxPath, jsx);
console.log('Icons updated!');
