import { getSection, saveSection, defaults } from '../lib/content.js';
import { isReady, getInitError } from '../lib/firebase.js';

const CARDS = [
  {
    url: 'https://bigbirdzhotchicken.com',
    title: 'Big Birdz Hot Chicken',
    description:
      'Marketing site and online ordering experience for a Nashville-style hot chicken restaurant — built mobile-first with a CMS the owners actually use.',
    tags: ['Web', 'CMS', 'Restaurant'],
  },
  {
    url: 'https://najah7.com',
    title: 'Najah7',
    description:
      'Bilingual (Arabic/English) marketing platform with RTL-first layouts, performance-tuned media, and a content workflow that lets non-technical editors ship in minutes.',
    tags: ['Next.js', 'i18n', 'RTL'],
  },
  {
    url: 'https://yafagoldencoffeeusa.com',
    title: 'Yafa Golden Coffee USA',
    description:
      'eCommerce storefront for a specialty Yemeni coffee brand — product catalog, checkout, and a story-driven landing experience designed to convert.',
    tags: ['eCommerce', 'Branding', 'Web'],
  },
];

async function main() {
  if (!isReady()) {
    console.error('Firebase not initialized:', getInitError()?.message);
    process.exit(1);
  }

  const current = (await getSection('work')) || defaults.work;

  const payload = {
    ...current,
    fields: current.fields || defaults.work.fields,
    cards: CARDS,
  };

  await saveSection('work', payload);
  console.log(`[work] replaced cards. Now showing ${CARDS.length} sites.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to update work cards:', err);
  process.exit(1);
});
