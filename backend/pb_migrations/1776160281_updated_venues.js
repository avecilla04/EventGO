/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1128838045")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id != \"\"",
    "viewRule": "@request.auth.id != \"\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1128838045")

  // update collection data
  unmarshal({
    "listRule": "user_id = @request.auth.id",
    "viewRule": "user_id = @request.auth.id"
  }, collection)

  return app.save(collection)
})
