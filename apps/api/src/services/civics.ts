/**
 * civics.ts — government & law reference (free, no key). Pulls recent US federal regulations,
 * rules, and executive orders from the Federal Register. Returns a compact string, or null.
 * (For legal concepts/definitions, the encyclopedia tool already covers the general explanation.)
 */
export async function govRegulations(topic: string): Promise<string | null> {
  try {
    const r = await fetch(`https://www.federalregister.gov/api/v1/documents.json?per_page=4&order=newest&conditions[term]=${encodeURIComponent(topic)}`);
    if (!r.ok) return null;
    const d = (await r.json()) as { results?: { title: string; type?: string; publication_date?: string; agencies?: { name?: string }[] }[] };
    const docs = d.results ?? [];
    if (!docs.length) return null;
    const lines = docs.map((x) => `- ${x.title} (${x.type ?? 'document'}, ${x.publication_date ?? ''}${x.agencies?.[0]?.name ? `, ${x.agencies[0].name}` : ''})`).join('\n');
    return `US Federal Register — recent items on "${topic}" (summarize the relevant ones; note this is regulatory info, not legal advice):\n${lines}`;
  } catch { return null; }
}
