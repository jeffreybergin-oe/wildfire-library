// lib/bookSynopsis.js

export async function getBookSynopsis(rawIsbn) {
  if (!rawIsbn) return null;

  // Strip dashes and spaces so both ISBN-10 and ISBN-13 work cleanly
  const isbn = String(rawIsbn).replace(/[^0-9X]/gi, '');
  if (!isbn) return null;

  // 1. Try Google Books first (best coverage for synopses)
  try {
    const gbRes = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`,
      { next: { revalidate: 86400 } } // Cache in Next.js for 24 hours
    );

    if (gbRes.ok) {
      const gbData = await gbRes.json();
      const description = gbData.items?.[0]?.volumeInfo?.description;
      if (description) {
        // Google Books occasionally includes simple HTML tags (<b>, <i>, <br>)
        return description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
  } catch (err) {
    console.error('Google Books lookup failed:', err);
  }

  // 2. Fallback to Open Library (true open-source)
  try {
    const olRes = await fetch(`https://openlibrary.org/isbn/${isbn}.json`, {
      headers: { 'User-Agent': 'WildfireLibrary (hello@wildfirelibrary.com)' },
      next: { revalidate: 86400 },
    });

    if (olRes.ok) {
      const edition = await olRes.json();
      const workKey = edition.works?.[0]?.key; // e.g., "/works/OL45804W"

      if (workKey) {
        const workRes = await fetch(`https://openlibrary.org${workKey}.json`, {
          headers: { 'User-Agent': 'WildfireLibrary (hello@wildfirelibrary.com)' },
          next: { revalidate: 86400 },
        });

        if (workRes.ok) {
          const work = await workRes.json();
          // Open Library returns description as either a string or { value: "..." }
          const rawDesc =
            typeof work.description === 'string'
              ? work.description
              : work.description?.value;

          if (rawDesc) return rawDesc.trim();
        }
      }
    }
  } catch (err) {
    console.error('Open Library lookup failed:', err);
  }

  return null;
}
