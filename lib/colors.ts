// Palette de couleurs officielle "Mon Agenda Pédago"
// Ces valeurs sont fixes et ne doivent JAMAIS être modifiées/inventées.
// Source: palette fournie par l'utilisatrice.

export interface PaletteColor {
  name: string
  hex: string
}

export const PALETTE: PaletteColor[] = [
  { name: 'Fennel', hex: '#EBDEC0' },
  { name: 'Sage', hex: '#E5EBDF' },
  { name: 'Ash Yellow', hex: '#FDC685' },
  { name: 'Cherry Blossom', hex: '#FECDBE' },
  { name: 'Garden Leaf', hex: '#B5BE91' },
  { name: 'Possibly Pink', hex: '#F4DACB' },
  { name: 'Peony', hex: '#E79897' },
  { name: 'Blue Basil', hex: '#C8DCD5' },
  { name: 'Carrot', hex: '#EEB47C' },
  { name: 'Pink Eraser', hex: '#EE9988' },
  { name: 'Bluebell', hex: '#B7CBDB' },
  { name: 'Sprout Green', hex: '#BBCDC2' },
  { name: 'Honey', hex: '#FCC88A' },
  { name: 'Radish', hex: '#EC96A3' },
  { name: 'Salt Blue', hex: '#7B9D9F' },
  { name: 'Dewpoint', hex: '#C5D0D0' },
  { name: 'Fairyols Dream', hex: '#B44A88' },
  { name: 'Pancake', hex: '#E8E8E8' },
  { name: 'Atomic Tangerine', hex: '#F78E70' },
  { name: 'Wisteria Purple', hex: '#C8B3CA' },
]

// Couleur par défaut (première de la palette, ton pastel doux)
export const DEFAULT_PRIMARY_COLOR = PALETTE[6].hex // Peony, ton rosé chaleureux proche de l'ancien template

// Gris très pâle utilisé pour les journées de congé / non-scolaires,
// à l'écran ET à l'impression. Ne pas confondre avec "Pancake" de la palette
// (qui reste disponible comme couleur d'événement normale).
export const HOLIDAY_GRAY = '#F3F3F1'
export const HOLIDAY_GRAY_BORDER = '#E2E2DE'

export function getPaletteHex(name: string): string | undefined {
  return PALETTE.find(c => c.name.toLowerCase() === name.toLowerCase())?.hex
}
