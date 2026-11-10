/// <reference path="../pb_data/types.d.ts" />

// POST /api/eventgo/events/{id}/view
// Suma una visita al evento. Solo usuarios con sesión iniciada.
// Se hace con una única sentencia SQL atómica para que nadie pueda fijar
// el contador a mano (la regla de update de `events` prohíbe tocar `views`).
routerAdd(
  "POST",
  "/api/eventgo/events/{id}/view",
  (e) => {
    const id = e.request.pathValue("id");

    const result = e.app
      .db()
      .newQuery("UPDATE events SET views = COALESCE(views, 0) + 1 WHERE id = {:id}")
      .bind({ id: id })
      .execute();

    if (result.rowsAffected() === 0) {
      throw new NotFoundError("Evento no encontrado.");
    }

    return e.json(200, { ok: true });
  },
  $apis.requireAuth()
);
