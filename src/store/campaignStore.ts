import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../services/firebase'
import type {
  Campaign,
  CampaignMember,
  CampaignCreature,
  CharacterVitals,
  CreateCampaignDTO,
  JoinCampaignDTO,
} from '../types/campaign/campaign'
import type { CharacterSheet } from '../types/system/dnd/CharacterSheet'
import type { MonsterSheet } from '../types/system/dnd/monsterSheet'
import { generateInviteCode, normalizeInviteCode } from '../utils/inviteCode'

export const DND_CONDITIONS = [
  'Abalado',
  'Agarrado',
  'Atordoado',
  'Caído',
  'Cego',
  'Enfeitiçado',
  'Envenenado',
  'Exaustão',
  'Impedido',
  'Incapacitado',
  'Inconsciente',
  'Invisível',
  'Paralisado',
  'Petrificado',
  'Surdo',
] as const

export function normalizeCampaign(id: string, data: Record<string, unknown>): Campaign {
  const memberIdsRaw = Array.isArray(data.memberIds) ? data.memberIds : []
  const dmId = typeof data.dmId === 'string' ? data.dmId : ''
  const memberIds = Array.from(new Set([dmId, ...memberIdsRaw])).filter(Boolean) as string[]

  const rawCreatures = Array.isArray(data.creatures) ? data.creatures : []
  const creatures: CampaignCreature[] = rawCreatures.map((c: any) => ({
    id: typeof c.id === 'string' ? c.id : Math.random().toString(36).substring(2, 9),
    name: typeof c.name === 'string' ? c.name : 'Criatura',
    monsterSheetId: typeof c.monsterSheetId === 'string' ? c.monsterSheetId : null,
    ownerId:
      typeof c.ownerId === 'string'
        ? c.ownerId
        : typeof c.monsterSheetId === 'string'
          ? dmId
          : null,
    avatar: typeof c.avatar === 'string' ? c.avatar : null,
    hpCurrent: typeof c.hpCurrent === 'number' ? c.hpCurrent : 10,
    hpMax: typeof c.hpMax === 'number' ? c.hpMax : 10,
    hpTemp: typeof c.hpTemp === 'number' ? c.hpTemp : 0,
    armorClass: typeof c.armorClass === 'number' ? c.armorClass : 10,
    passivePerception: typeof c.passivePerception === 'number' ? c.passivePerception : 10,
    conditions: Array.isArray(c.conditions) ? c.conditions : [],
    addedAt: typeof c.addedAt === 'number' ? c.addedAt : Date.now(),
  }))

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
    creatures,
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
    archived: Boolean(data.archived),
  }
}

export function normalizeCampaignMember(
  userId: string,
  data: Record<string, unknown>,
): CampaignMember {
  let vitals: CharacterVitals | null = null
  if (data.vitals && typeof data.vitals === 'object') {
    const v = data.vitals as Record<string, unknown>
    const deathSavesRaw = v.deathSaves as Record<string, unknown> | undefined
    vitals = {
      hpCurrent: typeof v.hpCurrent === 'number' ? v.hpCurrent : 0,
      hpMax: typeof v.hpMax === 'number' ? v.hpMax : 0,
      hpTemp: typeof v.hpTemp === 'number' ? v.hpTemp : 0,
      armorClass: typeof v.armorClass === 'number' ? v.armorClass : 10,
      passivePerception: typeof v.passivePerception === 'number' ? v.passivePerception : 10,
      heroicInspiration: Boolean(v.heroicInspiration),
      conditions: Array.isArray(v.conditions) ? (v.conditions as string[]) : [],
      deathSaves: {
        successes: typeof deathSavesRaw?.successes === 'number' ? deathSavesRaw.successes : 0,
        failures: typeof deathSavesRaw?.failures === 'number' ? deathSavesRaw.failures : 0,
      },
      spellSlots:
        v.spellSlots && typeof v.spellSlots === 'object'
          ? (v.spellSlots as Record<string, { current: number; max: number }>)
          : undefined,
    }
  }

  return {
    userId,
    displayName: typeof data.displayName === 'string' ? data.displayName : 'Aventureiro',
    photoURL: typeof data.photoURL === 'string' ? data.photoURL : null,
    role: data.role === 'dm' ? 'dm' : 'player',
    canManageHeroes: Boolean(data.canManageHeroes),
    joinedAt: typeof data.joinedAt === 'number' ? data.joinedAt : Date.now(),
    characterSheetId: typeof data.characterSheetId === 'string' ? data.characterSheetId : null,
    characterName: typeof data.characterName === 'string' ? data.characterName : null,
    characterClass: typeof data.characterClass === 'string' ? data.characterClass : null,
    characterAvatarUrl:
      typeof data.characterAvatarUrl === 'string' ? data.characterAvatarUrl : null,
    vitals,
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
    vitals: dto.characterSheetData
      ? extractVitalsFromCharacterSheet(dto.characterSheetData)
      : null,
  }

  const batch = writeBatch(db)
  batch.set(memberRef, memberData, { merge: true })
  batch.update(getCampaignDoc(campaign.id), {
    memberIds: arrayUnion(userId),
    updatedAt: now,
  })

  if (dto.characterSheetId && dto.characterSheetData) {
    const sheetRef = doc(db, 'users', userId, 'characterSheets', dto.characterSheetId)
    batch.update(sheetRef, characterCampaignFields(campaign.id, campaign.name))

    const previouslySelectedSheetId = existingMemberSnap.exists()
      ? existingMemberSnap.data().characterSheetId
      : null
    if (
      typeof previouslySelectedSheetId === 'string' &&
      previouslySelectedSheetId !== dto.characterSheetId
    ) {
      const previousSheetRef = doc(
        db,
        'users',
        userId,
        'characterSheets',
        previouslySelectedSheetId,
      )
      const previousSheet = await getDoc(previousSheetRef)
      if (previousSheet.exists()) {
        batch.update(previousSheetRef, characterCampaignFields(null, null))
      }
    }

    const previousCampaignId = dto.characterSheetData.campaignId
    if (previousCampaignId && previousCampaignId !== campaign.id) {
      const previousMemberRef = getMemberDoc(previousCampaignId, userId)
      const previousMember = await getDoc(previousMemberRef)
      if (
        previousMember.exists() &&
        previousMember.data().characterSheetId === dto.characterSheetId
      ) {
        batch.update(previousMemberRef, emptyCharacterLink())
      }
    }
  } else if (existingMemberSnap.exists()) {
    const previousSheetId = existingMemberSnap.data().characterSheetId
    if (typeof previousSheetId === 'string') {
      const previousSheetRef = doc(db, 'users', userId, 'characterSheets', previousSheetId)
      const previousSheet = await getDoc(previousSheetRef)
      if (previousSheet.exists()) {
        batch.update(previousSheetRef, characterCampaignFields(null, null))
      }
    }
  }

  await batch.commit()

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

function emptyCharacterLink() {
  return {
    characterSheetId: null,
    characterName: null,
    characterClass: null,
    characterAvatarUrl: null,
    vitals: null,
  }
}

function characterCampaignFields(campaignId: string | null, campaignName: string | null) {
  return {
    campaignId,
    campaignName,
    'data.campaignId': campaignId,
    'data.campaignName': campaignName,
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Vincula uma ficha de personagem real à campanha, atualizando o membro e a ficha no Firestore.
 */
export async function linkCharacterSheetToCampaign(
  campaignId: string,
  campaignName: string,
  userId: string,
  sheetId: string,
  sheetData: CharacterSheet,
): Promise<void> {
  const memberRef = getMemberDoc(campaignId, userId)
  const char = sheetData.character
  const classText = char.classes
    ?.filter((c) => c.className)
    .map((c) => (c.level > 0 ? `${c.className} ${c.level}` : c.className))
    .join(' · ')
  const vitals = extractVitalsFromCharacterSheet(sheetData)

  const currentMember = await getDoc(memberRef)
  if (!currentMember.exists()) {
    throw new Error('Você precisa fazer parte da mesa antes de vincular uma ficha.')
  }

  const batch = writeBatch(db)
  batch.update(memberRef, {
    characterSheetId: sheetId,
    characterName: char.name || 'Sem nome',
    characterClass: classText || null,
    characterAvatarUrl: char.avatar || null,
    vitals,
  })

  const sheetRef = doc(db, 'users', userId, 'characterSheets', sheetId)
  batch.update(sheetRef, characterCampaignFields(campaignId, campaignName))

  const previousSheetId = currentMember.data().characterSheetId
  if (typeof previousSheetId === 'string' && previousSheetId !== sheetId) {
    batch.update(
      doc(db, 'users', userId, 'characterSheets', previousSheetId),
      characterCampaignFields(null, null),
    )
  }

  const previousCampaignId = sheetData.campaignId
  if (previousCampaignId && previousCampaignId !== campaignId) {
    const previousMemberRef = getMemberDoc(previousCampaignId, userId)
    const previousMember = await getDoc(previousMemberRef)
    if (previousMember.exists() && previousMember.data().characterSheetId === sheetId) {
      batch.update(previousMemberRef, emptyCharacterLink())
    }
  }

  await batch.commit()
}

/**
 * Desvincula a ficha de personagem da campanha, limpando os dados no membro e na ficha.
 */
export async function unlinkCharacterSheetFromCampaign(
  campaignId: string,
  userId: string,
  sheetId?: string | null,
): Promise<void> {
  const memberRef = getMemberDoc(campaignId, userId)
  const member = await getDoc(memberRef)
  if (!member.exists()) return

  const linkedSheetId = sheetId || (
    typeof member.data().characterSheetId === 'string'
      ? member.data().characterSheetId
      : null
  )
  const batch = writeBatch(db)
  batch.update(memberRef, emptyCharacterLink())

  if (linkedSheetId) {
    const sheetRef = doc(db, 'users', userId, 'characterSheets', linkedSheetId)
    const sheet = await getDoc(sheetRef)
    if (sheet.exists()) {
      batch.update(sheetRef, characterCampaignFields(null, null))
    }
  }

  await batch.commit()
}

/**
 * Vincula uma ficha de monstro/NPC à campanha como criatura ativa na sessão.
 */
export async function linkMonsterSheetToCampaign(
  campaignId: string,
  campaignName: string,
  userId: string,
  monsterSheetId: string,
  monsterData: MonsterSheet,
  existingCreatures: CampaignCreature[] = [],
  instanceName?: string,
): Promise<CampaignCreature> {
  const vitals = extractVitalsFromMonsterSheet(monsterData, monsterSheetId)
  const newCreature: CampaignCreature = {
    id: Math.random().toString(36).substring(2, 9),
    ...vitals,
    ownerId: userId,
    name: instanceName?.trim() || vitals.name,
    addedAt: Date.now(),
  }

  const batch = writeBatch(db)
  const updatedCreatures = [...existingCreatures, newCreature]
  batch.update(getCampaignDoc(campaignId), {
    creatures: updatedCreatures,
    updatedAt: Date.now(),
  })

  const monsterRef = doc(db, 'users', userId, 'monsterSheets', monsterSheetId)
  batch.update(monsterRef, characterCampaignFields(campaignId, campaignName))

  const previousCampaignId = monsterData.campaignId
  if (previousCampaignId && previousCampaignId !== campaignId) {
    const previousCampaignRef = getCampaignDoc(previousCampaignId)
    const previousCampaign = await getDoc(previousCampaignRef)
    if (previousCampaign.exists()) {
      const previousCreatures = normalizeCampaign(
        previousCampaign.id,
        previousCampaign.data(),
      ).creatures || []
      batch.update(previousCampaignRef, {
        creatures: previousCreatures.filter(
          (creature) => !(
            creature.monsterSheetId === monsterSheetId && creature.ownerId === userId
          ),
        ),
        updatedAt: Date.now(),
      })
    }
  }

  await batch.commit()

  return newCreature
}

/** Remove todas as instâncias de uma ficha de monstro/NPC e limpa o vínculo nela. */
export async function unlinkMonsterSheetFromCampaign(
  campaignId: string,
  userId: string,
  monsterSheetId: string,
): Promise<void> {
  const campaignRef = getCampaignDoc(campaignId)
  const campaign = await getDoc(campaignRef)
  const batch = writeBatch(db)

  if (campaign.exists()) {
    const creatures = normalizeCampaign(campaign.id, campaign.data()).creatures || []
    batch.update(campaignRef, {
      creatures: creatures.filter(
        (creature) => !(
          creature.monsterSheetId === monsterSheetId && creature.ownerId === userId
        ),
      ),
      updatedAt: Date.now(),
    })
  }

  const monsterRef = doc(db, 'users', userId, 'monsterSheets', monsterSheetId)
  const monster = await getDoc(monsterRef)
  if (monster.exists()) {
    batch.update(monsterRef, characterCampaignFields(null, null))
  }

  await batch.commit()
}

/**
 * Alterna permissão de autorização para um membro gerenciar heróis/sessão.
 */
export async function toggleMemberAuthorization(
  campaignId: string,
  targetUserId: string,
  canManageHeroes: boolean,
): Promise<void> {
  const memberRef = getMemberDoc(campaignId, targetUserId)
  await updateDoc(memberRef, {
    canManageHeroes,
  })
}

/**
 * Remove/desvincula um herói da campanha (usado pelo Mestre, pelo próprio jogador ou por integrante autorizado).
 */
export async function removeHeroFromCampaign(
  campaignId: string,
  targetUserId: string,
  characterSheetId?: string | null,
): Promise<void> {
  await unlinkCharacterSheetFromCampaign(campaignId, targetUserId, characterSheetId)
}

/**
 * Se a ficha estiver vinculada a uma campanha, sincroniza dados vitais e básicos para o membro da campanha.
 */
export async function syncSheetToCampaignMember(
  campaignId: string,
  userId: string,
  sheetData: CharacterSheet,
  sheetId?: string,
): Promise<void> {
  try {
    const memberRef = getMemberDoc(campaignId, userId)
    const member = await getDoc(memberRef)
    if (!member.exists()) return
    if (sheetId && member.data().characterSheetId !== sheetId) return

    const char = sheetData.character
    const classText = char.classes
      ?.filter((c) => c.className)
      .map((c) => (c.level > 0 ? `${c.className} ${c.level}` : c.className))
      .join(' · ')
    const vitals = extractVitalsFromCharacterSheet(sheetData)
    const currentVitals = member.data().vitals as Partial<CharacterVitals> | undefined

    await updateDoc(memberRef, {
      characterName: char.name || 'Sem nome',
      characterClass: classText || null,
      characterAvatarUrl: char.avatar || null,
      vitals: {
        ...vitals,
        conditions: Array.isArray(currentVitals?.conditions) ? currentVitals.conditions : [],
      },
    })
  } catch (err) {
    console.warn('Não foi possível sincronizar alterações da ficha com a mesa:', err)
  }
}

/**
 * Remove um membro da campanha (ou quando o jogador sai por conta própria).
 */
export async function removeMember(campaignId: string, userId: string): Promise<void> {
  const memberRef = getMemberDoc(campaignId, userId)
  const member = await getDoc(memberRef)
  const sheetId = member.exists() && typeof member.data().characterSheetId === 'string'
    ? member.data().characterSheetId as string
    : null
  const batch = writeBatch(db)

  batch.delete(memberRef)
  batch.update(getCampaignDoc(campaignId), {
    memberIds: arrayRemove(userId),
    updatedAt: Date.now(),
  })

  if (sheetId) {
    const sheetRef = doc(db, 'users', userId, 'characterSheets', sheetId)
    const sheet = await getDoc(sheetRef)
    if (sheet.exists()) {
      batch.update(sheetRef, characterCampaignFields(null, null))
    }
  }

  await batch.commit()
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

// ── Fase 2: Vitais e Criaturas da Sessão ──────────────────────────────────────

/**
 * Calcula alteração de PV com base na mecânica de D&D (Dano absorve PV Temp primeiro, Cura respeita PV Máximo).
 */
export function applyHpChange(
  current: number,
  max: number,
  temp: number,
  amount: number,
  type: 'damage' | 'heal' | 'temp',
): { hpCurrent: number; hpTemp: number } {
  const safeAmount = Math.max(0, Math.trunc(amount))

  if (type === 'damage') {
    let remainingDamage = safeAmount
    let newTemp = temp
    if (newTemp > 0) {
      if (remainingDamage >= newTemp) {
        remainingDamage -= newTemp
        newTemp = 0
      } else {
        newTemp -= remainingDamage
        remainingDamage = 0
      }
    }
    const newCurrent = Math.max(0, current - remainingDamage)
    return { hpCurrent: newCurrent, hpTemp: newTemp }
  } else if (type === 'heal') {
    const newCurrent = Math.min(max, current + safeAmount)
    return { hpCurrent: newCurrent, hpTemp: temp }
  } else {
    // PV Temporário: adota o novo valor (D&D 5e: temporários não se acumulam, adota o maior se preferir ou substitui)
    return { hpCurrent: current, hpTemp: Math.max(temp, safeAmount) }
  }
}

/**
 * Extrai os status vitais de uma ficha de personagem para sincronizar na mesa.
 */
export function extractVitalsFromCharacterSheet(sheet: CharacterSheet): CharacterVitals {
  const char = sheet.character
  const armorClass = typeof char.armorClassBase === 'number' && char.armorClassBase > 0 ? char.armorClassBase : 10

  const wisAttr = char.attributes?.find((a) => a.name === 'Sabedoria')
  const wisMod = wisAttr ? Math.floor((wisAttr.value - 10) / 2) : 0
  const percSkill = char.skills?.perception
  const profBonus = typeof char.proficiencyOverride === 'string' && Number(char.proficiencyOverride) > 0
    ? Number(char.proficiencyOverride)
    : 2
  const profLevel = Math.max(0, Math.min(2, Math.trunc(percSkill?.proficiency ?? 0)))
  const passivePerception = 10 + wisMod + (profLevel * profBonus) + (percSkill?.misc ?? 0) + (char.passivePerceptionBonus ?? 0)

  const spellSlots: Record<string, { current: number; max: number }> = {}
  if (sheet.spellSlots) {
    for (let lvl = 1; lvl <= 9; lvl++) {
      const slot = sheet.spellSlots[lvl] || (
        sheet.spellSlots as unknown as Record<string, { current: number; max: number }>
      )[`level${lvl}`]
      if (slot && typeof slot.max === 'number' && slot.max > 0) {
        spellSlots[`level${lvl}`] = {
          current: typeof slot.current === 'number' ? slot.current : slot.max,
          max: slot.max,
        }
      }
    }
  }

  return {
    hpCurrent: typeof char.hpCurrent === 'number' ? char.hpCurrent : 10,
    hpMax: typeof char.hpMax === 'number' ? char.hpMax : 10,
    hpTemp: typeof char.hpTemp === 'number' ? char.hpTemp : 0,
    armorClass,
    passivePerception,
    heroicInspiration: (char.heroicInspiration ?? 0) > 0,
    conditions: [],
    deathSaves: {
      successes: char.deathSaves?.success ?? 0,
      failures: char.deathSaves?.failure ?? 0,
    },
    spellSlots: Object.keys(spellSlots).length > 0 ? spellSlots : undefined,
  }
}

/**
 * Extrai dados essenciais de uma ficha de monstro para instanciar como criatura na sessão.
 */
export function extractVitalsFromMonsterSheet(
  sheet: MonsterSheet,
  sheetId?: string,
): Omit<CampaignCreature, 'id' | 'addedAt'> {
  const wis = sheet.stats?.wisdom ?? 10
  const wisMod = Math.floor((wis - 10) / 2)

  return {
    name: sheet.details?.name?.trim() || 'Monstro',
    monsterSheetId: sheetId || null,
    avatar: sheet.details?.avatar || null,
    hpCurrent: typeof sheet.stats?.hpCurrent === 'number' ? sheet.stats.hpCurrent : (sheet.stats?.maxHp ?? 10),
    hpMax: sheet.stats?.maxHp ?? 10,
    hpTemp: sheet.stats?.hpTemp ?? 0,
    armorClass: sheet.stats?.ac ?? 10,
    passivePerception: 10 + wisMod,
    conditions: [],
  }
}

/**
 * Atualiza os vitais de um membro da campanha.
 */
export async function updateMemberVitals(
  campaignId: string,
  userId: string,
  vitals: CharacterVitals,
): Promise<void> {
  const memberRef = getMemberDoc(campaignId, userId)
  const member = await getDoc(memberRef)
  if (!member.exists()) return

  const batch = writeBatch(db)
  batch.update(memberRef, {
    vitals,
  })

  const sheetId = member.data().characterSheetId
  if (typeof sheetId === 'string' && sheetId) {
    const sheetRef = doc(db, 'users', userId, 'characterSheets', sheetId)
    const sheet = await getDoc(sheetRef)
    if (sheet.exists()) {
      batch.update(sheetRef, {
        'data.character.hpCurrent': vitals.hpCurrent,
        'data.character.hpTemp': vitals.hpTemp,
        'data.character.heroicInspiration': vitals.heroicInspiration ? 1 : 0,
        'data.character.deathSaves.success': vitals.deathSaves?.successes ?? 0,
        'data.character.deathSaves.failure': vitals.deathSaves?.failures ?? 0,
        updatedAt: new Date().toISOString(),
      })
    }
  }

  await batch.commit()
}

/**
 * Instancia uma nova criatura na mesa ativa.
 */
export async function addCreatureToCampaign(
  campaignId: string,
  currentCreatures: CampaignCreature[] | undefined,
  creatureData: Omit<CampaignCreature, 'id' | 'addedAt'>,
): Promise<CampaignCreature> {
  const newCreature: CampaignCreature = {
    id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    ...creatureData,
    addedAt: Date.now(),
  }

  const list = [...(currentCreatures || []), newCreature]
  const campaignRef = getCampaignDoc(campaignId)
  await updateDoc(campaignRef, {
    creatures: list,
    updatedAt: Date.now(),
  })

  return newCreature
}

/**
 * Atualiza propriedades de uma criatura na mesa (ex: PV, condições).
 */
export async function updateCreatureInCampaign(
  campaignId: string,
  currentCreatures: CampaignCreature[],
  creatureId: string,
  updates: Partial<CampaignCreature>,
): Promise<void> {
  const updated = currentCreatures.map((c) =>
    c.id === creatureId ? { ...c, ...updates } : c,
  )
  const campaignRef = getCampaignDoc(campaignId)
  await updateDoc(campaignRef, {
    creatures: updated,
    updatedAt: Date.now(),
  })
}

/**
 * Remove uma criatura derrotada ou encerrada da sessão.
 */
export async function removeCreatureFromCampaign(
  campaignId: string,
  currentCreatures: CampaignCreature[],
  creatureId: string,
): Promise<void> {
  const removed = currentCreatures.find((c) => c.id === creatureId)
  const filtered = currentCreatures.filter((c) => c.id !== creatureId)
  const campaignRef = getCampaignDoc(campaignId)
  const batch = writeBatch(db)
  batch.update(campaignRef, {
    creatures: filtered,
    updatedAt: Date.now(),
  })

  if (
    removed?.monsterSheetId &&
    removed.ownerId &&
    !filtered.some(
      (creature) => creature.monsterSheetId === removed.monsterSheetId &&
        creature.ownerId === removed.ownerId,
    )
  ) {
    const monsterRef = doc(db, 'users', removed.ownerId, 'monsterSheets', removed.monsterSheetId)
    const monster = await getDoc(monsterRef)
    if (monster.exists()) {
      batch.update(monsterRef, characterCampaignFields(null, null))
    }
  }

  await batch.commit()
}
