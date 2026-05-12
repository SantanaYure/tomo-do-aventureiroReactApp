import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  addDoc,
  writeBatch,
  query,
  where,
} from 'firebase/firestore'
import type { SheetGroup } from '../types/system/dnd/SheetGroup'
import { db } from '../services/firebase'

const MAX_GROUP_NAME_LENGTH = 60

function getCollectionRef(uid: string) {
  return collection(db, 'users', uid, 'sheetGroups')
}

function getDocRef(uid: string, id: string) {
  return doc(db, 'users', uid, 'sheetGroups', id)
}

function normalizeGroupName(name: string): string {
  return name.trim().slice(0, MAX_GROUP_NAME_LENGTH)
}

export function normalizeSheetGroup(value: unknown, id: string, uid: string): SheetGroup {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const now = new Date().toISOString()
  return {
    id,
    userId: typeof raw.userId === 'string' ? raw.userId : uid,
    name: typeof raw.name === 'string' ? raw.name : '',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
  }
}

export async function createSheetGroup(uid: string, name: string): Promise<SheetGroup> {
  const normalizedName = normalizeGroupName(name)
  if (!normalizedName) throw new Error('Nome da mesa é obrigatório.')

  const timestamp = new Date().toISOString()
  const payload = {
    userId: uid,
    name: normalizedName,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  const ref = await addDoc(getCollectionRef(uid), payload)
  return { id: ref.id, ...payload }
}

export async function renameSheetGroup(
  uid: string,
  id: string,
  name: string,
): Promise<void> {
  const normalizedName = normalizeGroupName(name)
  if (!normalizedName) throw new Error('Nome da mesa é obrigatório.')

  const ref = getDocRef(uid, id)
  const existing = await getDoc(ref)
  const createdAt =
    existing.exists() && typeof existing.data().createdAt === 'string'
      ? (existing.data().createdAt as string)
      : new Date().toISOString()

  await setDoc(ref, {
    userId: uid,
    name: normalizedName,
    createdAt,
    updatedAt: new Date().toISOString(),
  })
}

/**
 * Exclui o grupo e remove o vínculo `groupId` das fichas (PJ, monstro e NPC)
 * que estavam associadas. As fichas não são apagadas — voltam para "Personagem Independente".
 */
export async function deleteSheetGroup(uid: string, id: string): Promise<void> {
  const charactersRef = collection(db, 'users', uid, 'characterSheets')
  const monstersRef = collection(db, 'users', uid, 'monsterSheets')

  const [charSnap, monsterSnap] = await Promise.all([
    getDocs(query(charactersRef, where('data.groupId', '==', id))),
    getDocs(query(monstersRef, where('data.groupId', '==', id))),
  ])

  if (charSnap.size > 0 || monsterSnap.size > 0) {
    const batch = writeBatch(db)
    const updatedAt = new Date().toISOString()

    charSnap.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        'data.groupId': '',
        updatedAt,
      })
    })

    monsterSnap.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        'data.groupId': '',
        updatedAt,
      })
    })

    await batch.commit()
  }

  await deleteDoc(getDocRef(uid, id))
}
