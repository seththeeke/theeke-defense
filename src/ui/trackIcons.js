const TRACK_ICONS = {
  'amazon-office': `
    <svg class="track-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="5" y="3" width="14" height="18" rx="1"/>
      <path d="M9 8h.01M12 8h.01M15 8h.01"/>
      <path d="M9 12h.01M12 12h.01M15 12h.01"/>
      <path d="M9 16h.01M12 16h.01M15 16h.01"/>
      <path d="M10 21h4"/>
    </svg>
  `,
  broadway: `
    <svg class="track-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  `,
  'theeke-house': `
    <svg class="track-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M3 10.5L12 3l9 7.5"/>
      <path d="M5 9.5V20h14V9.5"/>
      <path d="M10 20v-6h4v6"/>
    </svg>
  `,
};

export function getTrackIconHtml(trackId) {
  return `<span class="track-icon-wrap">${TRACK_ICONS[trackId] ?? ''}</span>`;
}
