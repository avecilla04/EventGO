import { useEffect } from "react";

/** Cambia el título de la pestaña. Sustituye a react-helmet. */
export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} - EventGo` : "EventGo";
  }, [title]);
}
