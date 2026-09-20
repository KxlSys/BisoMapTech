import { useEffect } from "react";
import {
  DEFAULT_META,
  SITE_URL,
  type PageMeta,
} from "@/lib/page-meta";

/**
 * Applique le titre et les balises de partage de la page courante, et restaure
 * les valeurs du site au démontage.
 *
 * Ces balises servent l'onglet du navigateur, les favoris et l'historique. Les
 * robots d'aperçu (WhatsApp, Facebook, Slack) n'exécutent pas JavaScript et ne
 * les verront jamais : c'est la fonction edge `api/share-preview` qui les sert.
 */
export function usePageMeta(meta: Partial<PageMeta> | null) {
  const { title, description, image, url, type, card } = meta ?? {};

  useEffect(() => {
    if (!title && !description) return;

    const resolved: PageMeta = {
      title: title || DEFAULT_META.title,
      description: description || DEFAULT_META.description,
      image: image || DEFAULT_META.image,
      url:
        url ||
        (typeof window !== "undefined"
          ? `${SITE_URL}${window.location.pathname}`
          : DEFAULT_META.url),
      type: type || DEFAULT_META.type,
      card: card || DEFAULT_META.card,
    };

    const previousTitle = document.title;
    document.title = resolved.title;

    const restore = applyMetaTags(resolved);

    return () => {
      document.title = previousTitle;
      restore();
    };
  }, [title, description, image, url, type, card]);
}

/** Écrit les balises et renvoie la fonction qui rétablit les valeurs précédentes. */
function applyMetaTags(meta: PageMeta): () => void {
  const entries: Array<[selector: string, attribute: string, value: string]> = [
    ['meta[name="description"]', "content", meta.description],
    ['link[rel="canonical"]', "href", meta.url],
    ['meta[property="og:type"]', "content", meta.type],
    ['meta[property="og:url"]', "content", meta.url],
    ['meta[property="og:title"]', "content", meta.title],
    ['meta[property="og:description"]', "content", meta.description],
    ['meta[property="og:image"]', "content", meta.image],
    ['meta[name="twitter:card"]', "content", meta.card],
    ['meta[name="twitter:title"]', "content", meta.title],
    ['meta[name="twitter:description"]', "content", meta.description],
    ['meta[name="twitter:image"]', "content", meta.image],
  ];

  const undo: Array<() => void> = [];

  for (const [selector, attribute, value] of entries) {
    const element = document.head.querySelector(selector);
    if (!element) continue;
    const previous = element.getAttribute(attribute);
    element.setAttribute(attribute, value);
    undo.push(() => {
      if (previous === null) element.removeAttribute(attribute);
      else element.setAttribute(attribute, previous);
    });
  }

  return () => undo.forEach((fn) => fn());
}
