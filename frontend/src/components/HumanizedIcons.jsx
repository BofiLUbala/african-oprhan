import React from 'react';

// Common style for humanized feel
const baseProps = {
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  style: { filter: 'drop-shadow(0px 1.5px 2px rgba(0,0,0,0.06))' }
};

export const HumanizedPlayIcon = ({ size = 24, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} style={{...baseProps.style, ...style}}>
    {/* Slightly wonky triangle for organic feel */}
    <path d="M7 4.5C7 3.5 8 2.8 9 3.4L19 10.2C20 10.8 20 12.2 19 12.8L9 19.6C8 20.2 7 19.5 7 18.5V4.5Z" />
  </svg>
);

export const HumanizedIdIcon = ({ size = 24, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} style={{...baseProps.style, ...style}}>
    {/* Hand-drawn ID card badge */}
    <rect x="3" y="4" width="18" height="16" rx="3.5" ry="3.5" />
    <path d="M7.5 10c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5c0 1.4-1.1 2.5-2.5 2.5S7.5 11.4 7.5 10z" />
    <path d="M6 16c1.5-2 3.5-2.5 8-2.5" />
    <line x1="14" y1="9" x2="18" y2="9" />
    <line x1="14" y1="13" x2="16" y2="13" />
  </svg>
);

export const HumanizedDownloadIcon = ({ size = 24, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} style={{...baseProps.style, ...style}}>
    {/* Curved arrow and wavy line */}
    <path d="M12 3v13.5" />
    <path d="M7 11.5l4.3 4.8c.4.4 1 .4 1.4 0L17 11.5" />
    <path d="M4 20.5c3-1 6 .5 8 0s5-1 8 0" />
  </svg>
);

export const HumanizedCheckIcon = ({ size = 24, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} style={{...baseProps.style, ...style}}>
    {/* Expressive swoosh checkmark */}
    <path d="M5 12.5l4.5 4.5c.3.3.8.3 1.1 0L21 5.5" />
  </svg>
);

export const HumanizedWarningIcon = ({ size = 24, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} style={{...baseProps.style, ...style}}>
    {/* Organic triangle alert */}
    <path d="M10.3 4.2c.8-1.5 2.6-1.5 3.4 0l7.2 13.5c.7 1.4-.3 3.3-1.7 3.3H4.8c-1.4 0-2.4-1.9-1.7-3.3L10.3 4.2z" />
    <line x1="12" y1="9" x2="12" y2="14" />
    <circle cx="12" cy="17.5" r="1.5" fill={color} stroke="none" />
  </svg>
);

export const HumanizedUserIcon = ({ size = 24, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} style={{...baseProps.style, ...style}}>
    {/* Softly drawn user figure */}
    <path d="M20 21v-1.5c0-3-2.5-5.5-5.5-5.5h-5C6.5 14 4 16.5 4 19.5V21" />
    <circle cx="12" cy="7" r="4.5" />
  </svg>
);

export const HumanizedDocumentIcon = ({ size = 24, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} style={{...baseProps.style, ...style}}>
    {/* Paper with a folded edge and wavy lines */}
    <path d="M14 2.5H6.5c-1.1 0-2 .9-2 2v15c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V8.5L14 2.5z" />
    <polyline points="14 2.5 14 8.5 20 8.5" />
    <path d="M8 13.5h8M8 17.5h6" />
  </svg>
);

export const HumanizedBuildingIcon = ({ size = 24, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} style={{...baseProps.style, ...style}}>
    <rect x="4" y="3" width="16" height="19" rx="2" ry="2" />
    <path d="M9 22V17h6v5" />
    <path d="M8 7.5h2M14 7.5h2M8 11.5h2M14 11.5h2" />
  </svg>
);

export const HumanizedChartIcon = ({ size = 24, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} style={{...baseProps.style, ...style}}>
    <line x1="3" y1="21" x2="21" y2="21" />
    <path d="M5 16h4v4H5zM10 10h4v10h-4zM15 4h4v16h-4z" />
  </svg>
);

/* ── Navigation : flèches légèrement courbées, tracées à la main ───────── */

export const HumanizedArrowLeftIcon = ({ size = 24, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} style={{...baseProps.style, ...style}}>
    {/* trait légèrement ondulé + pointe ouverte */}
    <path d="M20 12.2c-4.6-.5-9.2-.4-13.8.1" />
    <path d="M10.8 6.4C9.2 8.2 7.6 10 6 12c1.7 1.9 3.4 3.7 5.1 5.4" />
  </svg>
);

export const HumanizedArrowRightIcon = ({ size = 24, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} style={{...baseProps.style, ...style}}>
    <path d="M4 11.8c4.6.5 9.2.4 13.8-.1" />
    <path d="M13.2 17.6c1.6-1.8 3.2-3.6 4.8-5.6-1.7-1.9-3.4-3.7-5.1-5.4" />
  </svg>
);

export const HumanizedChevronRightIcon = ({ size = 24, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} style={{...baseProps.style, ...style}}>
    <path d="M9.2 5.4c2.1 2.2 4.1 4.4 6 6.7-1.9 2.2-3.9 4.4-5.9 6.5" />
  </svg>
);

export const HumanizedRefreshIcon = ({ size = 24, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} style={{...baseProps.style, ...style}}>
    {/* boucle ouverte, imparfaite, avec deux pointes */}
    <path d="M20 8.5A8.4 8.4 0 0 0 5.2 7.4" />
    <path d="M4 15.6a8.4 8.4 0 0 0 14.8 1" />
    <path d="M20.4 3.6v5h-5" />
    <path d="M3.6 20.4v-5h5" />
  </svg>
);

export const HumanizedBellIcon = ({ size = 24, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} style={{...baseProps.style, ...style}}>
    {/* cloche aux épaules douces */}
    <path d="M18.2 16.5c-.9-1-1.4-2.2-1.4-3.5V10a4.9 4.9 0 0 0-9.8 0v3c0 1.3-.5 2.5-1.4 3.5-.4.5 0 1.2.6 1.2h11.4c.6 0 1-.7.6-1.2z" />
    <path d="M10.2 20.6a2 2 0 0 0 3.6 0" />
  </svg>
);

export const HumanizedSyringeIcon = ({ size = 24, color = "currentColor", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...baseProps} style={{...baseProps.style, ...style}}>
    <path d="M15.5 4.2 19.8 8.5" />
    <path d="M13.4 6.3 17.7 10.6l-8 8H5.4v-4.3z" />
    <path d="M11 8.7l2.2 2.2M8.8 10.9l2.2 2.2" />
  </svg>
);

/**
 * Séparateur « ancien vers nouveau » / « début vers fin ».
 * Remplace le caractere-fleche utilise comme icone dans les libelles.
 */
export const HumanizedArrowSeparator = ({ size = 16, color = "currentColor", style = {} }) => (
  <HumanizedArrowRightIcon
    size={size}
    color={color}
    style={{ verticalAlign: 'middle', flexShrink: 0, ...style }}
  />
);
