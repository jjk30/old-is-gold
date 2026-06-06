import React from 'react'

/*
 * MacroIcon — three small line-icons (protein / carbs / fat) for the
 * Nutrition page macro cards. Mirrors FoodIcon's IconSvg pattern: a
 * 0 0 24 24 viewBox, no fill, currentColor stroke, round caps/joins.
 * No width/height on the svg — the coin's CSS sets a fixed pixel size.
 */
const MACRO_PATHS = {
  protein: '<path d="M4 9.5v5M6.5 7v10M17.5 7v10M20 9.5v5M6.5 12h11"/>',
  carbs: '<path d="M12 21V9"/><path d="M12 9c-.3-2-2-3.2-3.8-3.4C8.1 7.6 9.9 8.8 12 9zM12 9c.3-2 2-3.2 3.8-3.4C15.9 7.6 14.1 8.8 12 9z"/><path d="M12 13.5c-.3-1.8-1.8-2.9-3.4-3.1C8.3 12.3 9.9 13.4 12 13.5zM12 13.5c.3-1.8 1.8-2.9 3.4-3.1C15.7 12.3 14.1 13.4 12 13.5z"/>',
  fat: '<path d="M12 2.8c3.6 4.6 5.6 7.7 5.6 10.4a5.6 5.6 0 0 1-11.2 0c0-2.7 2-5.8 5.6-10.4z"/><path d="M12 18.4V10"/><path d="M12 18.4c-.4-2.8.6-5.4 3.9-6.8C16.2 14.4 15 17 12 18.4zM12 18.4c.4-2.8-.6-5.4-3.9-6.8C7.8 14.4 9 17 12 18.4z"/>',
}

// Shared wrapper (same look as FoodIcon's IconSvg). Path markup injected verbatim.
function IconSvg({ paths }) {
  return (
    <svg
      viewBox="0 0 24 24"
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

export function MacroIcon({ kind }) {
  return <IconSvg paths={MACRO_PATHS[kind] || MACRO_PATHS.protein} />
}

export default MacroIcon
