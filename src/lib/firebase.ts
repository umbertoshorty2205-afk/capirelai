import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const ADMIN_EMAIL = 'umbertoshorty2205@gmail.com';

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'public_catalog', 'monetization'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Connessione Firestore offline: verificare configurazione Firebase.');
    }
    return false;
  }
}

export function isFounderAdmin(user: User | null): boolean {
  return Boolean(user && user.emailVerified && user.email?.toLowerCase() === ADMIN_EMAIL);
}

export async function signInFounderWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signOutFounder(): Promise<void> {
  await signOut(auth);
}

export async function hashEmailToId(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const buf = new TextEncoder().encode(normalized);
    const digest = await window.crypto.subtle.digest('SHA-256', buf);
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `sub_${hex.slice(0, 48)}`;
  }
  const safe = normalized.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 96);
  return `sub_${safe}`;
}

export type SubscriberSegment = 'pmi' | 'professionista' | 'sviluppatore' | 'curioso';

export interface SubscriberInput {
  email: string;
  name: string;
  segment: SubscriberSegment;
  source: string;
  leadMagnet: string;
  gdprConsent: boolean;
}

export interface SubscriberRecord {
  id: string;
  email: string;
  name: string;
  segment: SubscriberSegment;
  source: string;
  leadMagnet: string;
  gdprConsent: boolean;
  status: 'active' | 'unsubscribed' | 'bounced';
  welcomeSent: boolean;
  createdAtLabel: string;
}

export interface SubscribeOutcome {
  savedInCloud: boolean;
  alreadySubscribed: boolean;
  emailDispatched: boolean;
  provider: string;
  subscriberId: string;
  kitToken?: string;
}

export async function subscribeToNewsletter(input: SubscriberInput): Promise<SubscribeOutcome> {
  const cleanEmail = input.email.trim().toLowerCase().slice(0, 160);
  const cleanName = (input.name.trim() || 'Lettore').slice(0, 80);
  const cleanSource = (input.source.trim() || 'homepage').slice(0, 80);
  const cleanMagnet = (input.leadMagnet.trim() || 'kit-rof-pmi-2026').slice(0, 80);

  const subscriberId = await hashEmailToId(cleanEmail);
  const targetPath = `newsletter_subscribers/${subscriberId}`;

  let savedInCloud = false;
  let alreadySubscribed = false;

  try {
    await setDoc(doc(db, 'newsletter_subscribers', subscriberId), {
      email: cleanEmail,
      name: cleanName,
      segment: input.segment,
      source: cleanSource,
      leadMagnet: cleanMagnet,
      gdprConsent: true,
      status: 'active',
      welcomeSent: false,
      createdAt: serverTimestamp(),
    });
    savedInCloud = true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Security rules deny public update on existing docId, which maps cleanly to duplicate email signup
    if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions') || msg.includes('already-exists')) {
      alreadySubscribed = true;
    } else {
      handleFirestoreError(err, OperationType.CREATE, targetPath);
    }
  }

  let emailDispatched = false;
  let provider = 'kit-immediato';
  let kitToken: string | undefined;

  try {
    const resp = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        name: cleanName,
        segment: input.segment,
        source: cleanSource,
        leadMagnet: cleanMagnet,
        returningSubscriber: alreadySubscribed,
      }),
    });
    if (resp.ok) {
      const data = (await resp.json()) as {
        emailDispatched?: boolean;
        provider?: string;
        kitToken?: string;
      };
      emailDispatched = Boolean(data.emailDispatched);
      provider = data.provider || provider;
      kitToken = typeof data.kitToken === 'string' && data.kitToken ? data.kitToken : undefined;
    }
  } catch {
    // Fallback gracefully if network interrupted
  }

  return {
    savedInCloud,
    alreadySubscribed,
    emailDispatched,
    provider,
    subscriberId,
    kitToken,
  };
}

export type InquiryKind = 'sponsor_newsletter' | 'audit_pmi' | 'affiliate_partner';

export interface MonetizationInquiryInput {
  kind: InquiryKind;
  contactName: string;
  contactEmail: string;
  company: string;
  budgetRange: string;
  notes: string;
}

export interface MonetizationInquiryRecord extends MonetizationInquiryInput {
  id: string;
  status: 'new' | 'contacted' | 'booked' | 'archived';
  createdAtLabel: string;
}

export async function submitMonetizationInquiry(input: MonetizationInquiryInput): Promise<string> {
  const cleanId = `inq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const targetPath = `monetization_inquiries/${cleanId}`;
  try {
    await setDoc(doc(db, 'monetization_inquiries', cleanId), {
      kind: input.kind,
      contactName: input.contactName.trim().slice(0, 80),
      contactEmail: input.contactEmail.trim().toLowerCase().slice(0, 160),
      company: input.company.trim().slice(0, 120),
      budgetRange: input.budgetRange.trim().slice(0, 40),
      notes: input.notes.trim().slice(0, 1500),
      status: 'new',
      createdAt: serverTimestamp(),
    });
    return cleanId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, targetPath);
  }
}

export interface PublicCatalogData {
  sponsorStatus: string;
  sponsorPriceLabel: string;
  recommendedToolsSummary: string;
}

const DEFAULT_PUBLIC_CATALOG: PublicCatalogData = {
  sponsorStatus: 'Slot Aperti · Novembre / Dicembre',
  sponsorPriceLabel: 'Da €90 / uscita newsletter',
  recommendedToolsSummary: 'Make · Brevo · n8n · Perplexity Pro',
};

export async function fetchPublicMonetizationCatalog(): Promise<PublicCatalogData> {
  try {
    const snap = await getDoc(doc(db, 'public_catalog', 'monetization'));
    if (!snap.exists()) return DEFAULT_PUBLIC_CATALOG;
    const data = snap.data() as Partial<PublicCatalogData>;
    return {
      sponsorStatus: data.sponsorStatus || DEFAULT_PUBLIC_CATALOG.sponsorStatus,
      sponsorPriceLabel: data.sponsorPriceLabel || DEFAULT_PUBLIC_CATALOG.sponsorPriceLabel,
      recommendedToolsSummary: data.recommendedToolsSummary || DEFAULT_PUBLIC_CATALOG.recommendedToolsSummary,
    };
  } catch {
    return DEFAULT_PUBLIC_CATALOG;
  }
}

export async function savePublicMonetizationCatalog(payload: PublicCatalogData): Promise<void> {
  const path = 'public_catalog/monetization';
  try {
    await setDoc(doc(db, 'public_catalog', 'monetization'), {
      sponsorStatus: payload.sponsorStatus.trim().slice(0, 60),
      sponsorPriceLabel: payload.sponsorPriceLabel.trim().slice(0, 60),
      recommendedToolsSummary: payload.recommendedToolsSummary.trim().slice(0, 500),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

function formatTs(ts: unknown): string {
  if (ts instanceof Timestamp) {
    return ts.toDate().toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  return 'Recente';
}

export async function fetchSubscribersAdmin(): Promise<SubscriberRecord[]> {
  const path = 'newsletter_subscribers';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(250));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        email: String(data.email || ''),
        name: String(data.name || ''),
        segment: (data.segment as SubscriberSegment) || 'curioso',
        source: String(data.source || ''),
        leadMagnet: String(data.leadMagnet || ''),
        gdprConsent: Boolean(data.gdprConsent),
        status: (data.status as SubscriberRecord['status']) || 'active',
        welcomeSent: Boolean(data.welcomeSent),
        createdAtLabel: formatTs(data.createdAt),
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function updateSubscriberAdmin(
  subscriberId: string,
  updates: { status?: SubscriberRecord['status']; welcomeSent?: boolean; segment?: SubscriberSegment }
): Promise<void> {
  const path = `newsletter_subscribers/${subscriberId}`;
  try {
    await updateDoc(doc(db, 'newsletter_subscribers', subscriberId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function fetchInquiriesAdmin(): Promise<MonetizationInquiryRecord[]> {
  const path = 'monetization_inquiries';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(150));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        kind: (data.kind as InquiryKind) || 'sponsor_newsletter',
        contactName: String(data.contactName || ''),
        contactEmail: String(data.contactEmail || ''),
        company: String(data.company || ''),
        budgetRange: String(data.budgetRange || ''),
        notes: String(data.notes || ''),
        status: (data.status as MonetizationInquiryRecord['status']) || 'new',
        createdAtLabel: formatTs(data.createdAt),
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function updateInquiryStatusAdmin(
  inquiryId: string,
  status: MonetizationInquiryRecord['status']
): Promise<void> {
  const path = `monetization_inquiries/${inquiryId}`;
  try {
    await updateDoc(doc(db, 'monetization_inquiries', inquiryId), { status });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export interface CampaignRecord {
  id: string;
  subject: string;
  previewText: string;
  segmentTarget: string;
  recipientCount: number;
  provider: string;
  status: 'draft' | 'sent' | 'failed';
  createdAtLabel: string;
}

export async function fetchCampaignsAdmin(): Promise<CampaignRecord[]> {
  const path = 'newsletter_campaigns';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        subject: String(data.subject || ''),
        previewText: String(data.previewText || ''),
        segmentTarget: String(data.segmentTarget || 'all'),
        recipientCount: Number(data.recipientCount || 0),
        provider: String(data.provider || 'draft'),
        status: (data.status as CampaignRecord['status']) || 'draft',
        createdAtLabel: formatTs(data.createdAt),
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function saveCampaignRecordAdmin(payload: {
  subject: string;
  previewText: string;
  segmentTarget: 'all' | SubscriberSegment;
  bodyHtml: string;
  recipientCount: number;
  provider: string;
  status: 'draft' | 'sent' | 'failed';
  ownerEmail: string;
}): Promise<string> {
  const campaignId = `camp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `newsletter_campaigns/${campaignId}`;
  try {
    await setDoc(doc(db, 'newsletter_campaigns', campaignId), {
      subject: payload.subject.trim().slice(0, 160),
      previewText: payload.previewText.trim().slice(0, 200),
      segmentTarget: payload.segmentTarget,
      bodyHtml: payload.bodyHtml.slice(0, 20000),
      recipientCount: Math.max(0, Math.floor(payload.recipientCount)),
      provider: payload.provider.slice(0, 30),
      status: payload.status,
      ownerEmail: payload.ownerEmail.trim().toLowerCase(),
      createdAt: serverTimestamp(),
    });
    return campaignId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}
