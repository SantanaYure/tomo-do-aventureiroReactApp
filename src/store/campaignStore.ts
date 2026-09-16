import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { db } from '../services/firebase'
import type {
  Campaign,
  CampaignMember,
  CreateCampaignDTO,
  JoinCampaignDTO,
} from '../types/campaign/campaign'
import { generateInviteCode, normalizeInviteCode } from '../utils/inviteCode'

export function normalizeCampaign(id: string, data: Record<string, unknown>): Campaign {
  const memberIdsRaw = Array.isArray(data.memberIds) ? data.memberIds : []
  const dmId = typeof data.dmId === 'string' ? data.dmId : ''
  const memberIds = Array.from(new Set([dmId, ...memberIdsRaw])).filter(Boolean) as string[]

  return {
    id,
    name: typeof data.name === 'string' ? data.name : 'Nova Mesa',
    description: typeof data.description === 'string' ? data.description : '',
    system: 'dnd5e_2024',
    dmId,
    dmName: typeof data.dmName === 'string' ? data.dmName : 'Mestre',
    inviteCode: typeof data.inviteCode === 'string' ? data.inviteCode : '',
    memberIds,
    bannerUrl: typeof data.bannerUrl === 'string' ? data.bannerUrl : null,
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
    archived: Boolean(data.archived),
  }
}

export function normalizeCampaignMember(
  userId: string,
  data: Record<string, unknown>,
): CampaignMember {
  return {
    userId,
    displayName: typeof data.displayName === 'string' ? data.displayName : 'Aventureiro',
    photoURL: typeof data.photoURL === 'string' ? data.photoURL : null,
    role: data.role === 'dm' ? 'dm' : 'player',
    joinedAt: typeof data.joinedAt === 'number' ? data.joinedAt : Date.now(),
    characterSheetId: typeof data.characterSheetId === 'string' ? data.characterSheetId : null,
    characterName: typeof data.characterName === 'string' ? data.characterName : null,
    characterClass: typeof data.characterClass === 'string' ? data.characterClass : null,
    characterAvatarUrl:
      typeof data.characterAvatarUrl === 'string' ? data.characterAvatarUrl : null,
  }
}

// ── Firestore Helpers ────────────────────────────────────────────────────────

export function getCampaignsCollection() {
  return collection(db, 'campaigns')
}

export function getCampaignDoc(campaignId: string) {
  return doc(db, 'campaigns', campaignId)
}

export function getMembersCollection(campaignId: string) {
  return collection(db, 'campaigns', campaignId, 'members')
}

export function getMemberDoc(campaignId: string, userId: string) {
  return doc(db, 'campaigns', campaignId, 'members', userId)
}

// ── CRUD Operations ──────────────────────────────────────────────────────────

/**
 * Cria uma nova campanha e registra o criador como DM na subcoleção de membros.
 */
export async function createCampaign(
  dmId: string,
  dmName: string,
  dto: CreateCampaignDTO,
  dmPhotoURL?: string | null,
): Promise<Campaign> {
  const campaignsRef = getCampaignsCollection()
  const newCampaignRef = doc(campaignsRef)
  const now = Date.now()
  const inviteCode = generateInviteCode()

  const campaignData: Omit<Campaign, 'id'> = {
    name: dto.name.trim() || 'Nova Mesa',
    description: dto.description?.trim() || '',
    system: 'dnd5e_2024',
    dmId,
    dmName: dmName.trim() || 'Mestre',
    inviteCode,
    memberIds: [dmId],
    bannerUrl: dto.bannerUrl || null,
    createdAt: now,
    updatedAt: now,
    archived: false,
  }

  await setDoc(newCampaignRef, campaignData)

  // Adiciona o DM à subcoleção de membros
  const dmMember: CampaignMember = {
    userId: dmId,
    displayName: dmName.trim() || 'Mestre',
    photoURL: dmPhotoURL || null,
    role: 'dm',
    joinedAt: now,
    characterSheetId: null,
    characterName: null,
    characterClass: null,
    characterAvatarUrl: null,
  }

  await setDoc(getMemberDoc(newCampaignRef.id, dmId), dmMember)

  return {
    id: newCampaignRef.id,
    ...campaignData,
  }
}

/**
 * Busca uma campanha pelo ID.
 */
export async function getCampaign(campaignId: string): Promise<Campaign | null> {
  const snapshot = await getDoc(getCampaignDoc(campaignId))
  if (!snapshot.exists()) return null
  return normalizeCampaign(snapshot.id, snapshot.data())
}

/**
 * Busca uma campanha ativa pelo código de convite.
 */
export async function getCampaignByInviteCode(rawCode: string): Promise<Campaign | null> {
  const normalized = normalizeInviteCode(rawCode)
  if (!normalized) return null

  const q = query(
    getCampaignsCollection(),
    where('inviteCode', '==', normalized),
    where('archived', '==', false),
  )

  const querySnapshot = await getDocs(q)
  if (querySnapshot.empty) return null

  const firstDoc = querySnapshot.docs[0]
  return normalizeCampaign(firstDoc.id, firstDoc.data())
}

/**
 * Entra em uma campanha através de um código de convite.
 */
export async function joinCampaignByCode(
  userId: string,
  userDisplayName: string,
  userPhotoURL: string | null | undefined,
  dto: JoinCampaignDTO,
): Promise<{ campaign: Campaign; member: CampaignMember }> {
  const campaign = await getCampaignByInviteCode(dto.inviteCode)
  if (!campaign) {
    throw new Error('Mesa não encontrada com o código fornecido.')
  }

  const memberRef = getMemberDoc(campaign.id, userId)
  const existingMemberSnap = await getDoc(memberRef)

  const now = Date.now()
  const isDm = campaign.dmId === userId

  const memberData: CampaignMember = {
    userId,
    displayName: userDisplayName.trim() || 'Aventureiro',
    photoURL: userPhotoURL || null,
    role: isDm ? 'dm' : 'player',
    joinedAt: existingMemberSnap.exists()
      ? (existingMemberSnap.data().joinedAt as number) || now
      : now,
    characterSheetId: dto.characterSheetId || null,
    characterName: dto.characterName || null,
    characterClass: dto.characterClass || null,
    characterAvatarUrl: dto.characterAvatarUrl || null,
  }

  // Grava membro e adiciona userId aos memberIds da campanha
  await setDoc(memberRef, memberData, { merge: true })
  await updateDoc(getCampaignDoc(campaign.id), {
    memberIds: arrayUnion(userId),
    updatedAt: now,
  })

  return { campaign, member: memberData }
}

/**
 * Atualiza os dados de uma campanha (restrito ao DM).
 */
export async function updateCampaign(
  campaignId: string,
  updates: Partial<Pick<Campaign, 'name' | 'description' | 'bannerUrl' | 'archived'>>,
): Promise<void> {
  const campaignRef = getCampaignDoc(campaignId)
  await updateDoc(campaignRef, {
    ...updates,
    updatedAt: Date.now(),
  })
}

/**
 * Vincula ou atualiza a ficha de personagem de um membro na mesa.
 */
export async function updateMemberCharacter(
  campaignId: string,
  userId: string,
  character: {
    characterSheetId: string | null
    characterName: string | null
    characterClass: string | null
    characterAvatarUrl: string | null
  },
): Promise<void> {
  const memberRef = getMemberDoc(campaignId, userId)
  await updateDoc(memberRef, {
    ...character,
  })
}

/**
 * Remove um membro da campanha (ou quando o jogador sai por conta própria).
 */
export async function removeMember(campaignId: string, userId: string): Promise<void> {
  const memberRef = getMemberDoc(campaignId, userId)
  await deleteDoc(memberRef)
  await updateDoc(getCampaignDoc(campaignId), {
    memberIds: arrayRemove(userId),
    updatedAt: Date.now(),
  })
}

/**
 * Regenera o código de convite de uma campanha.
 */
export async function regenerateInviteCode(campaignId: string): Promise<string> {
  const newCode = generateInviteCode()
  await updateDoc(getCampaignDoc(campaignId), {
    inviteCode: newCode,
    updatedAt: Date.now(),
  })
  return newCode
}
