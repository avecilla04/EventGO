/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1128838045")

  // update collection data
  unmarshal({
    "name": "venues"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1128838045")

  // update collection data
  unmarshal({
    "name": "admin"
  }, collection)

  return app.save(collection)
})
