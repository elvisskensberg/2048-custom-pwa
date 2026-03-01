// ---------------------------------------------------------------------------
// Monopoly Deal – Card ID → image filename mapping
// Cards with images render as <img>, others fall back to CSS rendering.
// ---------------------------------------------------------------------------

/** Map of card ID → image filename (relative to /cards/) */
const IMAGE_BY_ID: Record<string, string> = {
  // Money cards (all denominations covered)
  'm-1a': 'money-1m.png', 'm-1b': 'money-1m.png', 'm-1c': 'money-1m.png',
  'm-1d': 'money-1m.png', 'm-1e': 'money-1m.png', 'm-1f': 'money-1m.png',
  'm-2a': 'money-2m.png', 'm-2b': 'money-2m.png', 'm-2c': 'money-2m.png',
  'm-2d': 'money-2m.png', 'm-2e': 'money-2m.png',
  'm-3a': 'money-3m.png', 'm-3b': 'money-3m.png', 'm-3c': 'money-3m.png',
  'm-4a': 'money-4m.png', 'm-4b': 'money-4m.png', 'm-4c': 'money-4m.png',
  'm-5a': 'money-5m.png', 'm-5b': 'money-5m.png',
  'm-10': 'money-10m.png',

  // Property cards (only those with cropped images)
  'p-brown-1': 'prop-mediterranean.png',
  'p-brown-2': 'prop-baltic.png',
  'p-lb-1': 'prop-oriental.png',
  'p-lb-2': 'prop-vermont.png',
  'p-lb-3': 'prop-connecticut.png',
  'p-pink-1': 'prop-st-charles.png',
  'p-pink-2': 'prop-states-ave.png',
  'p-pink-3': 'prop-virginia-ave.png',
  'p-ora-1': 'prop-st-james.png',
  'p-ora-2': 'prop-tennessee.png',
  'p-ora-3': 'prop-new-york.png',
  'p-red-1': 'prop-kentucky.png',
  'p-red-2': 'prop-indiana.png',
  'p-red-3': 'prop-illinois.png',
  'p-yel-1': 'prop-atlantic.png',
  'p-yel-2': 'prop-ventnor.png',
  'p-yel-3': 'prop-marvin-gardens.png',
  'p-grn-1': 'prop-pacific.png',
  'p-grn-2': 'prop-north-carolina.png',
  'p-grn-3': 'prop-pennsylvania-ave.png',
  'p-db-1': 'prop-park-place.png',
  'p-db-2': 'prop-boardwalk.png',
  'p-rr-1': 'prop-reading-rr.png',
  'p-rr-2': 'prop-pennsylvania-rr.png',
  'p-rr-3': 'prop-bo-rr.png',
  'p-rr-4': 'prop-short-line.png',
  'p-util-1': 'prop-electric-co.png',
  'p-util-2': 'prop-water-works.png',

  // Action cards (all types covered)
  'a-db-1': 'action-deal-breaker.png', 'a-db-2': 'action-deal-breaker.png',
  'a-jsn-1': 'action-just-say-no.png', 'a-jsn-2': 'action-just-say-no.png', 'a-jsn-3': 'action-just-say-no.png',
  'a-sly-1': 'action-sly-deal.png', 'a-sly-2': 'action-sly-deal.png', 'a-sly-3': 'action-sly-deal.png',
  'a-fd-1': 'action-forced-deal.png', 'a-fd-2': 'action-forced-deal.png',
  'a-fd-3': 'action-forced-deal.png', 'a-fd-4': 'action-forced-deal.png',
  'a-dc-1': 'action-debt-collector.png', 'a-dc-2': 'action-debt-collector.png', 'a-dc-3': 'action-debt-collector.png',
  'a-bday-1': 'action-birthday.png', 'a-bday-2': 'action-birthday.png', 'a-bday-3': 'action-birthday.png',
  'a-pg-1': 'action-pass-go.png', 'a-pg-2': 'action-pass-go.png', 'a-pg-3': 'action-pass-go.png',
  'a-pg-4': 'action-pass-go.png', 'a-pg-5': 'action-pass-go.png', 'a-pg-6': 'action-pass-go.png',
  'a-pg-7': 'action-pass-go.png', 'a-pg-8': 'action-pass-go.png', 'a-pg-9': 'action-pass-go.png',
  'a-pg-10': 'action-pass-go.png',
  'a-dtr-1': 'action-double-rent.png', 'a-dtr-2': 'action-double-rent.png',

  // Building cards
  'b-house-1': 'action-house.png', 'b-house-2': 'action-house.png', 'b-house-3': 'action-house.png',
  'b-hotel-1': 'action-hotel.png', 'b-hotel-2': 'action-hotel.png',

  // Wild property cards
  'w-br-lb': 'wild-brown-lightblue.png',
  'w-pk-or-1': 'wild-pink-orange.png', 'w-pk-or-2': 'wild-pink-orange.png',
  'w-rd-yl-1': 'wild-red-yellow.png', 'w-rd-yl-2': 'wild-red-yellow.png',
  'w-gr-db': 'wild-green-darkblue.png',
  'w-lb-rr': 'wild-railroad-utility.png',
  'w-rr-ut': 'wild-lightblue-railroad.png',
  'w-rainbow-1': 'wild-rainbow.png', 'w-rainbow-2': 'wild-rainbow.png',

  // Rent cards
  'r-db-gr-1': 'action-rent-2color.png', 'r-db-gr-2': 'action-rent-2color.png',
  'r-lb-br-1': 'action-rent-2color.png', 'r-lb-br-2': 'action-rent-2color.png',
  'r-pk-or-1': 'action-rent-2color.png', 'r-pk-or-2': 'action-rent-2color.png',
  'r-rd-yl-1': 'action-rent-2color.png', 'r-rd-yl-2': 'action-rent-2color.png',
  'r-rr-ut-1': 'action-rent-2color.png', 'r-rr-ut-2': 'action-rent-2color.png',
  'r-wild-1': 'action-rent-multi.png', 'r-wild-2': 'action-rent-multi.png', 'r-wild-3': 'action-rent-multi.png',
}

/**
 * Returns the image URL for a card, or undefined if no image exists.
 * Images are served from /cards/ in the public directory.
 */
export function getCardImageUrl(cardId: string): string | undefined {
  const filename = IMAGE_BY_ID[cardId]
  return filename ? `/cards/${filename}` : undefined
}
