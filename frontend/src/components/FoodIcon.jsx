import React from 'react'

/*
 * FoodIcon — small themed line-icon set for the "Log Your Meals" screen.
 *
 * The 13 SVG path strings below are copied verbatim from the mockup's ICONS
 * object (old-is-gold-log-meals.html). Each icon renders inside a 0 0 24 24
 * viewBox with stroke="currentColor", so it inherits the color of the gold
 * coin it sits in.
 */
const ICON_PATHS = {
  poultry: '<path d="M13.6 10.8c-1.7-1.7-1.5-4.6.5-6.6s4.9-2.2 6.6-.5 1.5 4.6-.5 6.6-4.9 2.2-6.6.5z"/><path d="M13 11.4 7.4 17"/><circle cx="6.2" cy="18.2" r="1.9"/>',
  meat: '<path d="M4.5 12c0-3.2 3.4-5.1 7.4-5.1s7.4 1.9 7.4 5.1-3.4 5.1-7.4 5.1S4.5 15.2 4.5 12z"/><path d="M16.3 8.9c1.4 1.6 1.4 4.6 0 6.2"/><path d="M8 11c1.1.6 1.1 1.4 0 2"/>',
  egg: '<path d="M12 4.2c3 0 6 4.2 6 8.1A6 6 0 0 1 6 12.3c0-3.9 3-8.1 6-8.1z"/>',
  fish: '<path d="M3.2 12c2.8-3.6 8.6-4.6 12.4-1.1 1-1.3 2.4-1.8 3.4-1.9-.5 1.4-.5 3.4 0 4.9-1-.1-2.4-.6-3.4-1.9C11.8 15.6 6 14.6 3.2 12z"/><circle cx="7" cy="11.4" r="0.7" fill="currentColor" stroke="none"/>',
  bowl: '<path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0z"/><path d="M9 8c0-1.3.9-2 .9-2.2M13.4 8c0-1.3.9-2 .9-2.2"/>',
  banana: '<path d="M5.3 8.2c0 6.4 5 10.6 11.4 10.6 1.3 0 1.7-1.1.7-1.8-4.7-.9-8.2-4.4-8.6-9.1-.1-1.1-1.5-1-1.9 0z"/>',
  fruit: '<path d="M12 8.4C10.6 6.9 6.8 6.6 6.8 10.4c0 3.2 2.2 6.5 3.7 6.5.8 0 1-.5 1.5-.5s.7.5 1.5.5c1.5 0 3.7-3.3 3.7-6.5 0-3.8-3.8-3.5-5.2-2z"/><path d="M12 8.4c-.2-2 .9-3.2 2.6-3.6"/>',
  glass: '<path d="M7 5.2h10l-1.2 13.4a1 1 0 0 1-1 .9H9.2a1 1 0 0 1-1-.9z"/><path d="M7.6 10.2h8.8"/>',
  cup: '<path d="M5 8.2h11v5.6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 9.4h1.8a2 2 0 0 1 0 4H16"/><path d="M8 4.4c0 1-.8 1.4-.8 2.4M11 4.4c0 1-.8 1.4-.8 2.4"/>',
  bread: '<path d="M5.5 11a4 4 0 0 1 4-4h5a4 4 0 0 1 4 4 1.2 1.2 0 0 1-1.2 1.2V17a1 1 0 0 1-1 1H7.7a1 1 0 0 1-1-1v-4.8A1.2 1.2 0 0 1 5.5 11z"/>',
  cheese: '<path d="M4 16.5 18 8l2.2 8.5z"/><circle cx="9" cy="14.5" r="0.7" fill="currentColor" stroke="none"/><circle cx="13" cy="13.6" r="0.6" fill="currentColor" stroke="none"/>',
  burger: '<path d="M5 10a7 7 0 0 1 14 0z"/><path d="M4.6 13h14.8"/><path d="M5.4 15.6h13.2a3 3 0 0 1-3 3H8.4a3 3 0 0 1-3-3z"/>',
  default: '<path d="M7 4v6M5 4v3.2a2 2 0 0 0 4 0V4M7 10v10"/><path d="M16.5 4c-1.6 0-2.7 2.2-2.7 5.2s1.1 4.2 2.7 4.2V20"/>',
}

/*
 * Ordered keyword map. categoryFor() lowercases the food name and returns the
 * FIRST category whose keyword appears in it; otherwise 'default'. Order
 * matters (e.g. "fish" is checked before "meat").
 */
const CATEGORY_KEYWORDS = [
  ['fish', ['fish', 'salmon', 'tuna', 'shrimp', 'prawn']],
  ['poultry', ['chicken', 'turkey']],
  ['meat', ['beef', 'pork', 'lamb', 'mutton', 'bacon', 'ham']],
  ['egg', ['egg', 'omelette', 'omelet']],
  ['banana', ['banana']],
  ['fruit', ['apple', 'orange', 'mango', 'berry', 'grape', 'pear', 'fruit']],
  ['glass', ['milk', 'yogurt', 'yoghurt', 'lassi', 'smoothie']],
  ['cup', ['coffee', 'tea', 'chai']],
  ['cheese', ['cheese', 'paneer', 'tofu', 'butter']],
  ['burger', ['burger', 'pizza']],
  ['bread', ['bread', 'toast', 'roti', 'chapati', 'paratha', 'dosa', 'sandwich', 'bun', 'naan', 'idli']],
  ['bowl', ['rice', 'oat', 'noodle', 'pasta', 'dal', 'daal', 'biryani', 'porridge', 'cereal', 'soup', 'curry']],
]

export function categoryFor(name) {
  const n = (name || '').toLowerCase()
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((k) => n.includes(k))) return category
  }
  return 'default'
}

// Shared wrapper so every icon shares one consistent line-art look. The path
// markup is injected verbatim; circles in the source set their own fill.
function IconSvg({ paths }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="100%"
      height="100%"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: paths }}
    />
  )
}

// Map a food name to its themed icon.
export function FoodIcon({ name }) {
  return <IconSvg paths={ICON_PATHS[categoryFor(name)]} />
}

// Raw default (fork-and-knife) icon — used for the page heading coin.
export function DefaultFoodIcon() {
  return <IconSvg paths={ICON_PATHS.default} />
}

export default FoodIcon
