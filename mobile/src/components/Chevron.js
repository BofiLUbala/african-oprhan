import React from 'react';
import { View } from 'react-native';

/**
 * Chevron dessiné à la main (sans SVG, sans emoji, sans dépendance) :
 * un carré tourné à 45° dont on ne garde que deux bords adjacents.
 * Rendu chaleureux via des coins légèrement arrondis.
 */
export default function Chevron({ size = 9, color = '#94a3b8', dir = 'right', thickness = 2 }) {
  const rotate = { right: '45deg', left: '-135deg', up: '-45deg', down: '135deg' }[dir] || '45deg';
  return (
    <View
      style={{
        width: size,
        height: size,
        borderTopWidth: thickness,
        borderRightWidth: thickness,
        borderColor: color,
        borderTopRightRadius: 1.5,
        transform: [{ rotate }],
      }}
    />
  );
}
