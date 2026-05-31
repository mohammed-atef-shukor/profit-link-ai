import { getFirestore, type Firestore } from "firebase/firestore";

import { getFirebaseApp } from "./config";



let _db: Firestore | undefined;



/** Lazily initialized Firestore instance (singleton). */

export function getDb(): Firestore {

  if (!_db) {

    _db = getFirestore(getFirebaseApp());

  }

  return _db;

}



/**

 * Shared Firestore instance for modular v9 API.

 * Use: collection(db, "products"), doc(db, "users", uid), etc.

 *

 * Must be a real Firestore instance — Proxies break collection()/doc().

 */

export const db: Firestore = getDb();


