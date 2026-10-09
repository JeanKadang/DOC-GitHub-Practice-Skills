// Finds the explainer graphics a lesson page embeds: ![alt](../graphics/name.svg).
const EMBED = /!\[([^\]]*)\]\((\.\.\/graphics\/[^)\s]+\.svg)\)/g;

export function embeddedGraphics(pageSource) {
  return [...pageSource.matchAll(EMBED)].map((match) => ({ alt: match[1].trim(), path: match[2] }));
}
