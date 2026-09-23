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
  runTransaction,
  type DocumentReference,
  type DocumentSnapshot,
  type WriteBatch,
} from 'firebase/firestore'
import { db } from '../services/firebase'
import type {
  Campaign,
  CampaignMember,
  CampaignCombat,
  CampaignCreature,
  CharacterVitals,
  CreateCampaignDTO,
  JoinCampaignDTO,
} from '../types/campaign/campaign'
import type { CharacterSheet } from '../types/system/dnd/CharacterSheet'
import type { MonsterSheet } from '../types/system/dnd/monsterSheet'
import { generateInviteCode, normalizeInviteCode } from '../utils/inviteCode'
import {
  abilityModifier,
  namesForNewInstances,
  nextInstanceNames,
  rollInitiative,
} from '../utils/initiative'

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

/**
 * Avatares em data URL (base64) não são guardados nas criaturas da mesa: a
 * lista inteira vive num único documento, limitado a 1 MB pelo Firestore, e
 * cada réplica copiaria a imagem. O avatar de criatura com ficha é lido da
 * própria ficha na hora de exibir (useCreatureAvatars). URLs comuns ficam.
 */
export function creatureAvatarForStorage(avatar: unknown): string | null {
  if (typeof avatar !== 'string' || !avatar) return null
  return avatar.startsWith('data:') ? null : avatar
}

function normalizeConditionRounds(raw: unknown): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {}
  if (!raw || typeof raw !== 'object') return result
  for (const [combatant, conditions] of Object.entries(raw as Record<string, unknown>)) {
    if (!conditions || typeof conditions !== 'object') continue
    const entries = Object.entries(conditions as Record<string, unknown>).filter(
      (entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] > 0,
    )
    if (entries.length > 0) result[combatant] = Object.fromEntries(entries.map(([k, v]) => [k, Math.trunc(v)]))
  }
  return result
}

export function normalizeCampaign(id: string, data: Record<string, unknown>): Campaign {
  const memberIdsRaw = Array.isArray(data.memberIds) ? data.memberIds : []
  const dmId = typeof data.dmId === 'string' ? data.dmId : ''
  const memberIds = Array.from(new Set([dmId, ...memberIdsRaw])).filter(Boolean) as string[]

  const rawCreatures = Array.isArray(data.creatures) ? data.creatures : []
  const creatures: CampaignCreature[] = rawCreatures.map((c: any, index: number) => ({
    // Id estável para dados antigos sem id: um id aleatório a cada snapshot
    // quebrava as keys do React e as atualizações por id.
    id: typeof c.id === 'string' && c.id ? c.id : `legacy-${index}`,
    name: typeof c.name === 'string' ? c.name : 'Criatura',
    monsterSheetId: typeof c.monsterSheetId === 'string' ? c.monsterSheetId : null,
    ownerId:
      typeof c.ownerId === 'string'
        ? c.ownerId
        : typeof c.monsterSheetId === 'string'
          ? dmId
          : null,
    // Descarta base64 legado: a próxima gravação da lista já sai sem ele.
    avatar: creatureAvatarForStorage(c.avatar),
    hpCurrent: typeof c.hpCurrent === 'number' ? c.hpCurrent : 10,
    hpMax: typeof c.hpMax === 'number' ? c.hpMax : 10,
    hpTemp: typeof c.hpTemp === 'number' ? c.hpTemp : 0,
    armorClass: typeof c.armorClass === 'number' ? c.armorClass : 10,
    passivePerception: typeof c.passivePerception === 'number' ? c.passivePerception : 10,
    conditions: Array.isArray(c.conditions) ? c.conditions : [],
    initiativeBonus: typeof c.initiativeBonus === 'number' ? c.initiativeBonus : 0,
    initiative: typeof c.initiative === 'number' ? c.initiative : null,
    outOfCombat: c.outOfCombat === true,
    addedAt: typeof c.addedAt === 'number' ? c.addedAt : Date.now(),
  }))

  const rawCombat = data.combat as Record<string, unknown> | null | undefined
  const combat: CampaignCombat | null =
    rawCombat && typeof rawCombat === 'object'
      ? {
          round: typeof rawCombat.round === 'number' && rawCombat.round > 0 ? rawCombat.round : 1,
          activeId: typeof rawCombat.activeId === 'string' ? rawCombat.activeId : null,
          conditionRounds: normalizeConditionRounds(rawCombat.conditionRounds),
        }
      : null

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
    combat,
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
      initiativeBonus: typeof v.initiativeBonus === 'number' ? v.initiativeBonus : 0,
    }
  }

  return {
    userId,
    displayName: typeof data.displayName === 'string' ? data.displayName : 'Aventureiro',
    photoURL: typeof data.photoURL === 'string' ? data.photoURL : null,
    role: data.role === 'dm' ? 'dm' : 'player',
    canManageHeroes: Boolean(data.canManageHeroes),
    participatesAsPlayer: data.role === 'dm' && data.participatesAsPlayer === true,
    joinedAt: typeof data.joinedAt === 'number' ? data.joinedAt : Date.now(),
    characterSheetId: typeof data.characterSheetId === 'string' ? data.characterSheetId : null,
    characterName: typeof data.characterName === 'string' ? data.characterName : null,
    characterClass: typeof data.characterClass === 'string' ? data.characterClass : null,
    characterAvatarUrl:
      typeof data.characterAvatarUrl === 'string' ? data.characterAvatarUrl : null,
    vitals,
    initiative: typeof data.initiative === 'number' ? data.initiative : null,
    outOfCombat: data.outOfCombat === true,
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

/**
 * Lê um documento sem deixar a falha derrubar a operação principal. As regras
 * negam a leitura da ficha de outro usuário quando ela foi excluída ou já não
 * aponta para a mesa; nesses casos a limpeza da ficha é opcional.
 */
async function safeGetDoc(ref: DocumentReference): Promise<DocumentSnapshot | null> {
  try {
    return await getDoc(ref)
  } catch (err) {
    console.warn('Leitura opcional negada ou indisponível:', err)
    return null
  }
}

/**
 * Confirma as escritas essenciais e, no mesmo batch, as opcionais (limpeza de
 * vínculo em fichas). Se o batch completo for recusado, repete só com as
 * essenciais, para que remover um jogador ou uma criatura nunca dependa de
 * conseguir escrever na ficha de outra pessoa.
 */
async function commitWithOptionalWrites(
  essential: (batch: WriteBatch) => void,
  optional?: ((batch: WriteBatch) => void) | null,
): Promise<void> {
  const full = writeBatch(db)
  essential(full)
  if (!optional) {
    await full.commit()
    return
  }
  optional(full)
  try {
    await full.commit()
  } catch (err) {
    console.warn('Limpeza opcional recusada; gravando apenas o essencial:', err)
    const minimal = writeBatch(db)
    essential(minimal)
    await minimal.commit()
  }
}

function newCreatureId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}

/**
 * Aplica uma alteração na lista de criaturas a partir do estado mais recente
 * do servidor, dentro de uma transação. Evita que duas ações rápidas (dano,
 * réplica, iniciativa) sobrescrevam uma à outra.
 */
async function mutateCreatures(
  campaignId: string,
  mutate: (creatures: CampaignCreature[]) => CampaignCreature[],
  extraUpdates: Record<string, unknown> = {},
): Promise<CampaignCreature[]> {
  const campaignRef = getCampaignDoc(campaignId)
  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(campaignRef)
    if (!snap.exists()) throw new Error('Mesa não encontrada.')
    const current = normalizeCampaign(snap.id, snap.data()).creatures || []
    const next = mutate(current)
    transaction.update(campaignRef, {
      creatures: next,
      ...extraUpdates,
      updatedAt: Date.now(),
    })
    return next
  })
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
    const previousMember = await safeGetDoc(previousMemberRef)
    if (previousMember?.exists() && previousMember.data()?.characterSheetId === sheetId) {
      batch.update(previousMemberRef, emptyCharacterLink())
    }
  }

  await batch.commit()
}

/**
 * Desvincula a ficha de personagem da campanha. Limpar o membro é essencial;
 * limpar o vínculo na ficha é opcional (a ficha pode ter sido excluída ou
 * pertencer a outra pessoa sem permissão de leitura).
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
      ? member.data().characterSheetId as string
      : null
  )

  let sheetRef: DocumentReference | null = null
  if (linkedSheetId) {
    const ref = doc(db, 'users', userId, 'characterSheets', linkedSheetId)
    const sheet = await safeGetDoc(ref)
    if (sheet?.exists()) sheetRef = ref
  }

  await commitWithOptionalWrites(
    (batch) => batch.update(memberRef, { ...emptyCharacterLink(), initiative: null }),
    sheetRef ? (batch) => batch.update(sheetRef!, characterCampaignFields(null, null)) : null,
  )
}

/**
 * Vincula uma ficha de monstro/NPC à campanha, criando uma ou mais instâncias
 * em cena. Com `quantity` > 1 os nomes recebem numeração ("Goblin 1", "Goblin 2").
 */
export async function linkMonsterSheetToCampaign(
  campaignId: string,
  campaignName: string,
  userId: string,
  monsterSheetId: string,
  monsterData: MonsterSheet,
  options: { instanceName?: string; quantity?: number } = {},
): Promise<CampaignCreature[]> {
  const vitals = extractVitalsFromMonsterSheet(monsterData, monsterSheetId)
  const quantity = Math.max(1, Math.min(20, Math.trunc(options.quantity ?? 1)))
  const baseName = options.instanceName?.trim() || vitals.name
  const campaignRef = getCampaignDoc(campaignId)
  const monsterRef = doc(db, 'users', userId, 'monsterSheets', monsterSheetId)
  const now = Date.now()

  const added = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(campaignRef)
    if (!snap.exists()) throw new Error('Mesa não encontrada.')
    const current = normalizeCampaign(snap.id, snap.data()).creatures || []
    const names = namesForNewInstances(baseName, current.map((c) => c.name), quantity)
    const created: CampaignCreature[] = names.map((name, index) => ({
      ...vitals,
      id: newCreatureId(),
      ownerId: userId,
      name,
      initiative: null,
      addedAt: now + index,
    }))
    transaction.update(campaignRef, {
      creatures: [...current, ...created],
      updatedAt: Date.now(),
    })
    transaction.update(monsterRef, characterCampaignFields(campaignId, campaignName))
    return created
  })

  // Uma ficha de monstro vive em uma mesa por vez. Tirar as instâncias da mesa
  // anterior é limpeza opcional: pode falhar se o usuário já não for o mestre dela.
  const previousCampaignId = monsterData.campaignId
  if (previousCampaignId && previousCampaignId !== campaignId) {
    try {
      await mutateCreatures(previousCampaignId, (list) =>
        list.filter(
          (creature) => !(creature.monsterSheetId === monsterSheetId && creature.ownerId === userId),
        ),
      )
    } catch (err) {
      console.warn('Não foi possível limpar a mesa anterior do monstro:', err)
    }
  }

  return added
}

/** Remove todas as instâncias de uma ficha de monstro/NPC e limpa o vínculo nela. */
export async function unlinkMonsterSheetFromCampaign(
  campaignId: string,
  userId: string,
  monsterSheetId: string,
): Promise<void> {
  await mutateCreatures(campaignId, (creatures) =>
    creatures.filter(
      (creature) => !(creature.monsterSheetId === monsterSheetId && creature.ownerId === userId),
    ),
  )
  await clearMonsterSheetLink(userId, monsterSheetId)
}

/** Limpeza opcional do vínculo de campanha numa ficha de monstro/NPC. */
async function clearMonsterSheetLink(ownerId: string, monsterSheetId: string): Promise<void> {
  const monsterRef = doc(db, 'users', ownerId, 'monsterSheets', monsterSheetId)
  const monster = await safeGetDoc(monsterRef)
  if (!monster?.exists()) return
  try {
    await updateDoc(monsterRef, characterCampaignFields(null, null))
  } catch (err) {
    console.warn('Não foi possível limpar o vínculo da ficha de monstro:', err)
  }
}

/**
 * Mestre escolhe se também joga com um PJ (entra no painel de heróis e na
 * iniciativa). Ao sair, a iniciativa dele é limpa.
 */
export async function setDmParticipatesAsPlayer(
  campaignId: string,
  dmUserId: string,
  participates: boolean,
): Promise<void> {
  await updateDoc(getMemberDoc(campaignId, dmUserId), {
    participatesAsPlayer: participates,
    ...(participates ? {} : { initiative: null }),
  })
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
 * Remove um membro da campanha (pelo mestre, ou o próprio jogador saindo).
 * Apagar o membro e tirar o id de `memberIds` é essencial; limpar o vínculo
 * na ficha do jogador é opcional, porque a ficha pode ter sido excluída.
 */
export async function removeMember(campaignId: string, userId: string): Promise<void> {
  const campaignRef = getCampaignDoc(campaignId)
  const campaign = await getDoc(campaignRef)
  if (campaign.exists() && campaign.data().dmId === userId) {
    throw new Error('O mestre não pode ser removido da própria mesa.')
  }

  const memberRef = getMemberDoc(campaignId, userId)
  const member = await safeGetDoc(memberRef)
  const sheetId = member?.exists() && typeof member.data()?.characterSheetId === 'string'
    ? member.data()!.characterSheetId as string
    : null

  let sheetRef: DocumentReference | null = null
  if (sheetId) {
    const ref = doc(db, 'users', userId, 'characterSheets', sheetId)
    const sheet = await safeGetDoc(ref)
    if (sheet?.exists()) sheetRef = ref
  }

  await commitWithOptionalWrites(
    (batch) => {
      batch.delete(memberRef)
      batch.update(campaignRef, {
        memberIds: arrayRemove(userId),
        updatedAt: Date.now(),
      })
    },
    sheetRef ? (batch) => batch.update(sheetRef!, characterCampaignFields(null, null)) : null,
  )
}

/**
 * Exclui a mesa (só o mestre). O Firestore não apaga subcoleções junto com o
 * documento, então os membros são apagados no mesmo batch da mesa.
 *
 * Antes, enquanto a mesa ainda existe (as regras dependem dela para autorizar
 * o mestre), desfaz o vínculo das fichas: PJs dos membros e fichas de
 * monstro/NPC em cena. Essa limpeza é opcional; se uma ficha não puder ser
 * atualizada, a exclusão da mesa segue.
 */
export async function deleteCampaign(campaignId: string): Promise<void> {
  const campaignRef = getCampaignDoc(campaignId)
  const campaignSnap = await getDoc(campaignRef)
  if (!campaignSnap.exists()) return
  const campaign = normalizeCampaign(campaignSnap.id, campaignSnap.data())
  const membersSnap = await getDocs(getMembersCollection(campaignId))

  const sheetCleanups: Promise<void>[] = []
  for (const memberDoc of membersSnap.docs) {
    const sheetId = memberDoc.data().characterSheetId
    if (typeof sheetId === 'string' && sheetId) {
      sheetCleanups.push(clearCharacterSheetLink(memberDoc.id, sheetId, campaignId))
    }
  }
  const monsterSheets = new Set<string>()
  for (const creature of campaign.creatures || []) {
    if (!creature.monsterSheetId || !creature.ownerId) continue
    const key = `${creature.ownerId}/${creature.monsterSheetId}`
    if (monsterSheets.has(key)) continue
    monsterSheets.add(key)
    sheetCleanups.push(clearMonsterSheetLink(creature.ownerId, creature.monsterSheetId))
  }
  await Promise.allSettled(sheetCleanups)

  const batch = writeBatch(db)
  for (const memberDoc of membersSnap.docs) {
    batch.delete(getMemberDoc(campaignId, memberDoc.id))
  }
  batch.delete(campaignRef)
  await batch.commit()
}

/** Limpeza opcional do vínculo numa ficha de PJ, só se ela ainda aponta para esta mesa. */
async function clearCharacterSheetLink(
  ownerId: string,
  sheetId: string,
  campaignId: string,
): Promise<void> {
  const sheetRef = doc(db, 'users', ownerId, 'characterSheets', sheetId)
  const sheet = await safeGetDoc(sheetRef)
  if (!sheet?.exists() || sheet.data()?.campaignId !== campaignId) return
  try {
    await updateDoc(sheetRef, characterCampaignFields(null, null))
  } catch (err) {
    console.warn('Não foi possível limpar o vínculo da ficha com a mesa excluída:', err)
  }
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
    initiativeBonus: initiativeBonusFromCharacter(sheet),
  }
}

/** Mesma conta do CharacterCombatSummary: mod. de Destreza + bônus extra. */
function initiativeBonusFromCharacter(sheet: CharacterSheet): number {
  const char = sheet.character
  const dex = char.attributes?.find((a) => a.name === 'Destreza')
  const dexMod = dex && typeof dex.value === 'number' ? abilityModifier(dex.value) : 0
  const extra = typeof char.initiativeBonusExtra === 'number' ? char.initiativeBonusExtra : 0
  return dexMod + extra
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
    avatar: creatureAvatarForStorage(sheet.details?.avatar),
    hpCurrent: typeof sheet.stats?.hpCurrent === 'number' ? sheet.stats.hpCurrent : (sheet.stats?.maxHp ?? 10),
    hpMax: sheet.stats?.maxHp ?? 10,
    hpTemp: sheet.stats?.hpTemp ?? 0,
    armorClass: sheet.stats?.ac ?? 10,
    passivePerception: 10 + wisMod,
    conditions: [],
    initiativeBonus: abilityModifier(sheet.stats?.dexterity ?? 10),
  }
}

/**
 * Atualiza os vitais de um membro da campanha. Espelhar PV e afins na ficha é
 * opcional: se a ficha não puder ser lida ou escrita, a mesa ainda atualiza.
 */
export async function updateMemberVitals(
  campaignId: string,
  userId: string,
  vitals: CharacterVitals,
): Promise<void> {
  const memberRef = getMemberDoc(campaignId, userId)
  const member = await getDoc(memberRef)
  if (!member.exists()) return

  const sheetId = member.data().characterSheetId
  let sheetRef: DocumentReference | null = null
  if (typeof sheetId === 'string' && sheetId) {
    const ref = doc(db, 'users', userId, 'characterSheets', sheetId)
    const sheet = await safeGetDoc(ref)
    if (sheet?.exists()) sheetRef = ref
  }

  await commitWithOptionalWrites(
    (batch) => batch.update(memberRef, { vitals }),
    sheetRef
      ? (batch) => batch.update(sheetRef!, {
          'data.character.hpCurrent': vitals.hpCurrent,
          'data.character.hpTemp': vitals.hpTemp,
          'data.character.heroicInspiration': vitals.heroicInspiration ? 1 : 0,
          'data.character.deathSaves.success': vitals.deathSaves?.successes ?? 0,
          'data.character.deathSaves.failure': vitals.deathSaves?.failures ?? 0,
          updatedAt: new Date().toISOString(),
        })
      : null,
  )
}

/**
 * Instancia uma ou mais criaturas avulsas (sem ficha) na mesa ativa.
 */
export async function addCreatureToCampaign(
  campaignId: string,
  creatureData: Omit<CampaignCreature, 'id' | 'addedAt'>,
  quantity = 1,
): Promise<CampaignCreature[]> {
  const count = Math.max(1, Math.min(20, Math.trunc(quantity)))
  const now = Date.now()
  let created: CampaignCreature[] = []
  await mutateCreatures(campaignId, (current) => {
    const names = namesForNewInstances(creatureData.name, current.map((c) => c.name), count)
    created = names.map((name, index) => ({
      ...creatureData,
      id: newCreatureId(),
      name,
      initiative: null,
      addedAt: now + index,
    }))
    return [...current, ...created]
  })
  return created
}

/**
 * Atualiza propriedades de uma criatura na mesa (ex: PV, condições, iniciativa).
 */
export async function updateCreatureInCampaign(
  campaignId: string,
  creatureId: string,
  updates: Partial<Omit<CampaignCreature, 'id'>>,
): Promise<void> {
  await mutateCreatures(campaignId, (current) =>
    current.map((c) => (c.id === creatureId ? { ...c, ...updates, id: c.id } : c)),
  )
}

/**
 * Replica uma criatura em cena (monstro ou NPC, com ou sem ficha). As cópias
 * nascem com PV cheio, sem condições e sem iniciativa, e continuam a
 * numeração do nome ("Goblin" → "Goblin 2", "Goblin 3").
 */
export async function duplicateCreatureInCampaign(
  campaignId: string,
  creatureId: string,
  count = 1,
): Promise<CampaignCreature[]> {
  const copies = Math.max(1, Math.min(20, Math.trunc(count)))
  const now = Date.now()
  let created: CampaignCreature[] = []
  await mutateCreatures(campaignId, (current) => {
    const source = current.find((c) => c.id === creatureId)
    if (!source) throw new Error('Criatura não encontrada na mesa.')
    const names = nextInstanceNames(source.name, current.map((c) => c.name), copies)
    created = names.map((name, index) => ({
      ...source,
      id: newCreatureId(),
      name,
      hpCurrent: source.hpMax,
      hpTemp: 0,
      conditions: [],
      initiative: null,
      addedAt: now + index,
    }))
    const sourceIndex = current.findIndex((c) => c.id === creatureId)
    // As cópias entram logo depois da original, para ficarem agrupadas.
    return [...current.slice(0, sourceIndex + 1), ...created, ...current.slice(sourceIndex + 1)]
  })
  return created
}

/**
 * Remove uma criatura derrotada ou encerrada da sessão. Quando era a última
 * instância de uma ficha, limpa o vínculo da ficha (opcional).
 */
export async function removeCreatureFromCampaign(
  campaignId: string,
  creatureId: string,
): Promise<void> {
  let removed: CampaignCreature | undefined
  let remaining: CampaignCreature[] = []
  await mutateCreatures(campaignId, (current) => {
    removed = current.find((c) => c.id === creatureId)
    remaining = current.filter((c) => c.id !== creatureId)
    return remaining
  })

  const gone = removed as CampaignCreature | undefined
  if (
    gone?.monsterSheetId &&
    gone.ownerId &&
    !remaining.some(
      (creature) => creature.monsterSheetId === gone.monsterSheetId &&
        creature.ownerId === gone.ownerId,
    )
  ) {
    await clearMonsterSheetLink(gone.ownerId, gone.monsterSheetId)
  }
}

// ── Iniciativa e turnos ──────────────────────────────────────────────────────

/**
 * Rola iniciativa (d20 + bônus) para as criaturas em cena. Com `onlyMissing`,
 * mantém quem já tem valor.
 */
export async function rollCreaturesInitiative(
  campaignId: string,
  options: { onlyMissing?: boolean; random?: () => number } = {},
): Promise<void> {
  await mutateCreatures(campaignId, (current) =>
    current.map((creature) =>
      creature.outOfCombat || (options.onlyMissing && typeof creature.initiative === 'number')
        ? creature
        : { ...creature, initiative: rollInitiative(creature.initiativeBonus ?? 0, options.random) },
    ),
  )
}

/** Define (ou limpa, com null) a iniciativa de um herói. */
export async function setMemberInitiative(
  campaignId: string,
  userId: string,
  initiative: number | null,
): Promise<void> {
  await updateDoc(getMemberDoc(campaignId, userId), {
    initiative: typeof initiative === 'number' ? Math.trunc(initiative) : null,
  })
}

/**
 * Rola para os heróis indicados (uso do mestre, que pode escrever em qualquer
 * membro). Heróis já com valor são mantidos quando `onlyMissing` é true.
 */
export async function rollMembersInitiative(
  campaignId: string,
  members: CampaignMember[],
  options: { onlyMissing?: boolean; random?: () => number } = {},
): Promise<void> {
  const targets = members.filter(
    (m) => !m.outOfCombat && !(options.onlyMissing && typeof m.initiative === 'number'),
  )
  if (targets.length === 0) return
  const batch = writeBatch(db)
  for (const member of targets) {
    batch.update(getMemberDoc(campaignId, member.userId), {
      initiative: rollInitiative(member.vitals?.initiativeBonus ?? 0, options.random),
    })
  }
  await batch.commit()
}

/** Grava rodada e turno ativo do rastreador de combate. */
export async function updateCampaignCombat(
  campaignId: string,
  combat: CampaignCombat | null,
): Promise<void> {
  await updateDoc(getCampaignDoc(campaignId), {
    combat,
    updatedAt: Date.now(),
  })
}

/**
 * Encerra o combate: zera turno, rodada e a iniciativa de todos, e devolve à
 * ordem quem tinha sido tirado dela (o próximo combate começa com todos).
 */
export async function endCampaignCombat(
  campaignId: string,
  memberIds: string[],
): Promise<void> {
  await mutateCreatures(
    campaignId,
    (current) => current.map((creature) => ({ ...creature, initiative: null, outOfCombat: false })),
    { combat: null },
  )
  if (memberIds.length === 0) return
  const batch = writeBatch(db)
  for (const userId of memberIds) {
    batch.update(getMemberDoc(campaignId, userId), { initiative: null, outOfCombat: false })
  }
  await batch.commit()
}

/**
 * Tira (ou devolve) um participante da ordem de iniciativa sem tirá-lo da
 * cena. O valor rolado é mantido, para ele voltar na mesma posição. Uso do
 * mestre. Se `combat` vier, grava junto o novo turno ativo.
 */
export async function setCombatantOutOfCombat(
  campaignId: string,
  target: { kind: 'hero' | 'creature'; refId: string },
  outOfCombat: boolean,
  combat?: CampaignCombat | null,
): Promise<void> {
  const combatUpdate = combat === undefined ? {} : { combat }
  if (target.kind === 'creature') {
    await mutateCreatures(
      campaignId,
      (current) => current.map((c) => (c.id === target.refId ? { ...c, outOfCombat } : c)),
      combatUpdate,
    )
    return
  }
  const batch = writeBatch(db)
  batch.update(getMemberDoc(campaignId, target.refId), { outOfCombat })
  if (combat !== undefined) {
    batch.update(getCampaignDoc(campaignId), { combat, updatedAt: Date.now() })
  }
  await batch.commit()
}

// ── Exclusão de fichas vinculadas ────────────────────────────────────────────

/**
 * Antes de excluir uma ficha de PJ vinculada, libera o herói na mesa, para não
 * deixar um personagem fantasma que ninguém consegue remover. Nunca lança:
 * a exclusão da ficha segue mesmo que a mesa não possa ser atualizada.
 */
export async function releaseCharacterSheetFromCampaign(
  campaignId: string,
  userId: string,
  sheetId: string,
): Promise<void> {
  try {
    const memberRef = getMemberDoc(campaignId, userId)
    const member = await safeGetDoc(memberRef)
    if (!member?.exists() || member.data()?.characterSheetId !== sheetId) return
    await updateDoc(memberRef, { ...emptyCharacterLink(), initiative: null })
  } catch (err) {
    console.warn('Não foi possível liberar o herói da mesa antes de excluir a ficha:', err)
  }
}

/**
 * Antes de excluir uma ficha de monstro/NPC vinculada, mantém as instâncias em
 * cena (o combate não perde PV e condições), mas sem link para a ficha que
 * deixará de existir. Nunca lança.
 */
export async function releaseMonsterSheetFromCampaign(
  campaignId: string,
  userId: string,
  monsterSheetId: string,
): Promise<void> {
  try {
    await mutateCreatures(campaignId, (current) =>
      current.map((creature) =>
        creature.monsterSheetId === monsterSheetId && creature.ownerId === userId
          ? { ...creature, monsterSheetId: null }
          : creature,
      ),
    )
  } catch (err) {
    console.warn('Não foi possível desvincular as criaturas antes de excluir a ficha:', err)
  }
}

// ── Vínculo órfão ────────────────────────────────────────────────────────────

/**
 * Diz se o vínculo de uma ficha com a mesa ficou órfão: a mesa foi excluída,
 * o dono já não é membro, o membro usa outra ficha, ou (monstro/NPC) não há
 * mais nenhuma instância dela em cena. Isso acontece quando o mestre remove
 * um jogador ou exclui a mesa sem conseguir escrever na ficha dele.
 *
 * Só responde true com evidência: erro de rede ou leitura incerta conta como
 * "não órfão", para nunca desfazer um vínculo válido por engano.
 */
export async function isCampaignLinkStale(params: {
  kind: 'character' | 'monster'
  campaignId: string
  ownerId: string
  sheetId: string
}): Promise<boolean> {
  const { kind, campaignId, ownerId, sheetId } = params
  let campaign: DocumentSnapshot
  try {
    campaign = await getDoc(getCampaignDoc(campaignId))
  } catch {
    return false
  }
  if (!campaign.exists()) return true

  if (kind === 'monster') {
    const creatures = normalizeCampaign(campaign.id, campaign.data()).creatures || []
    return !creatures.some((c) => c.monsterSheetId === sheetId && c.ownerId === ownerId)
  }

  try {
    const member = await getDoc(getMemberDoc(campaignId, ownerId))
    if (!member.exists()) return true
    return member.data().characterSheetId !== sheetId
  } catch {
    return false
  }
}

/**
 * Avança o turno e aplica o que expirou na virada da rodada: tira as
 * condições cuja duração chegou a zero das criaturas (na mesma transação
 * que grava o novo turno) e dos heróis (no documento de membro). Uso do
 * mestre.
 */
export async function applyTurnAdvance(
  campaignId: string,
  nextCombat: CampaignCombat,
  expired: Array<{ kind: 'hero' | 'creature'; refId: string; condition: string }>,
  members: CampaignMember[],
): Promise<void> {
  const creatureExpired = expired.filter((e) => e.kind === 'creature')
  if (creatureExpired.length === 0) {
    await updateCampaignCombat(campaignId, nextCombat)
  } else {
    await mutateCreatures(
      campaignId,
      (current) =>
        current.map((creature) => {
          const drop = creatureExpired.filter((e) => e.refId === creature.id).map((e) => e.condition)
          return drop.length === 0
            ? creature
            : { ...creature, conditions: creature.conditions.filter((c) => !drop.includes(c)) }
        }),
      { combat: nextCombat },
    )
  }

  const heroExpired = expired.filter((e) => e.kind === 'hero')
  if (heroExpired.length === 0) return
  const batch = writeBatch(db)
  let writes = 0
  for (const member of members) {
    const drop = heroExpired.filter((e) => e.refId === member.userId).map((e) => e.condition)
    const conditions = member.vitals?.conditions ?? []
    if (drop.length === 0 || !conditions.some((c) => drop.includes(c))) continue
    batch.update(getMemberDoc(campaignId, member.userId), {
      'vitals.conditions': conditions.filter((c) => !drop.includes(c)),
    })
    writes++
  }
  if (writes > 0) await batch.commit()
}
