import { openDB } from 'idb'

const DB_NAME = 'site-hub-db'
const DB_VERSION = 1
const STORE_NAME = 'site-hub-root'
const ROOT_KEY = 'app-data'

let dbPromise

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' })
        }
      },
    })
  }

  return dbPromise
}

export const readRootRecord = async () => {
  const db = await getDB()
  return db.get(STORE_NAME, ROOT_KEY)
}

export const writeRootRecord = async (value) => {
  const db = await getDB()
  const record = { key: ROOT_KEY, ...value }
  await db.put(STORE_NAME, record)
  return record
}
