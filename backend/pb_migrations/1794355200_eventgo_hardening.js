/// <reference path="../pb_data/types.d.ts" />

// Endurece reglas de acceso, valida datos y añade índices.
//
// - users: `type` solo puede ser "cliente" o "comerciante" y no se puede cambiar
//   después del registro. Se elimina `has_venue` (se desincronizaba y bloqueaba
//   la creación de eventos); ahora la regla comprueba directamente que el local
//   pertenece al comerciante.
// - venues / events: nadie puede crear ni modificar registros a nombre de otro
//   usuario, ni asociar un evento a un local ajeno, ni falsear las vistas.
// - events.cover: solo imágenes de hasta 5 MB, con miniaturas para cargar rápido.
// - venue_follows: un usuario solo puede seguir una vez el mismo local.
migrate((app) => {
  // ---------- users ----------
  // Normaliza los tipos existentes ("Comerciante" -> "comerciante", vacío -> "cliente").
  app.db().newQuery("UPDATE users SET type = LOWER(TRIM(type))").execute();
  app.db().newQuery("UPDATE users SET type = 'cliente' WHERE type NOT IN ('cliente', 'comerciante')").execute();

  const users = app.findCollectionByNameOrId("users");
  const typeField = users.fields.getByName("type");
  typeField.required = true;
  typeField.pattern = "^(cliente|comerciante)$";
  users.fields.getByName("name").max = 100;
  users.fields.getByName("business_name").max = 100;
  if (users.fields.getByName("has_venue")) {
    users.fields.removeByName("has_venue");
  }
  users.updateRule = 'id = @request.auth.id && @request.body.type:isset = false';
  app.save(users);

  // ---------- venues ----------
  const venues = app.findCollectionByNameOrId("venues");
  venues.fields.getByName("name").max = 100;
  venues.fields.getByName("address").max = 200;
  venues.fields.getByName("description").max = 2000;
  venues.fields.getByName("instagram").max = 60;
  venues.listRule = '@request.auth.id != ""';
  venues.viewRule = '@request.auth.id != ""';
  venues.createRule = '@request.auth.type = "comerciante" && user_id = @request.auth.id';
  venues.updateRule = 'user_id = @request.auth.id && (@request.body.user_id:isset = false || @request.body.user_id = @request.auth.id)';
  venues.deleteRule = 'user_id = @request.auth.id';
  venues.indexes = ["CREATE INDEX `idx_venues_user_id` ON `venues` (`user_id`)"];
  app.save(venues);

  // ---------- events ----------
  const events = app.findCollectionByNameOrId("events");
  events.fields.getByName("title").max = 120;
  events.fields.getByName("description").maxSize = 5000;
  events.fields.getByName("venue").required = true;
  const cover = events.fields.getByName("cover");
  cover.mimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  cover.maxSize = 5 * 1024 * 1024;
  cover.thumbs = ["640x360", "1600x0"];
  events.listRule = "";
  events.viewRule = "";
  events.createRule =
    '@request.auth.type = "comerciante" && user_id = @request.auth.id && venue.user_id = @request.auth.id && @request.body.views:isset = false';
  events.updateRule =
    'user_id = @request.auth.id' +
    ' && (@request.body.user_id:isset = false || @request.body.user_id = @request.auth.id)' +
    ' && (@request.body.venue:isset = false || @request.body.venue.user_id = @request.auth.id)' +
    ' && @request.body.views:isset = false';
  events.deleteRule = 'user_id = @request.auth.id';
  events.indexes = [
    "CREATE INDEX `idx_events_date` ON `events` (`date`)",
    "CREATE INDEX `idx_events_venue` ON `events` (`venue`)",
    "CREATE INDEX `idx_events_user_id` ON `events` (`user_id`)",
  ];
  app.save(events);

  // ---------- venue_follows ----------
  // Elimina duplicados antes de crear el índice único.
  app.db().newQuery(
    "DELETE FROM venue_follows WHERE rowid NOT IN (SELECT MIN(rowid) FROM venue_follows GROUP BY user, venue)"
  ).execute();
  const follows = app.findCollectionByNameOrId("venue_follows");
  follows.indexes = ["CREATE UNIQUE INDEX `idx_venue_follows_user_venue` ON `venue_follows` (`user`, `venue`)"];
  app.save(follows);
}, (app) => {
  // Sin vuelta atrás automática: las reglas anteriores permitían suplantar a otros usuarios.
});
