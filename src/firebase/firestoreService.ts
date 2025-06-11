
import { db } from '@/firebase/config';
import type { Script, ScriptVersion } from '@/types';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
  getDoc,
  writeBatch,
} from 'firebase/firestore';

const USERS_COLLECTION = 'users';
const SCRIPTS_COLLECTION = 'scripts';
const VERSIONS_COLLECTION = 'versions';

// Helper to convert Firestore Timestamps to numbers
const convertTimestamps = (data: any): any => {
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toMillis();
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      convertTimestamps(data[key]); // Recurse for nested objects
    }
  }
  return data;
};


export const fetchUserScripts = async (userId: string): Promise<Script[]> => {
  try {
    const scriptsQuery = query(
      collection(db, USERS_COLLECTION, userId, SCRIPTS_COLLECTION),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(scriptsQuery);
    const scripts: Script[] = [];
    for (const scriptDoc of querySnapshot.docs) {
      const scriptData = convertTimestamps(scriptDoc.data()) as Omit<Script, 'id' | 'versions'>;
      
      // Fetch versions for each script
      const versionsQuery = query(
        collection(db, USERS_COLLECTION, userId, SCRIPTS_COLLECTION, scriptDoc.id, VERSIONS_COLLECTION),
        orderBy('timestamp', 'desc')
      );
      const versionsSnapshot = await getDocs(versionsQuery);
      const versions = versionsSnapshot.docs.map(versionDoc => convertTimestamps(versionDoc.data()) as ScriptVersion);
      
      scripts.push({ ...scriptData, id: scriptDoc.id, userId, versions });
    }
    return scripts;
  } catch (error) {
    console.error("Error fetching user scripts:", error);
    // Consider re-throwing or returning an empty array with an error indicator
    return [];
  }
};

export const saveUserScript = async (
  userId: string,
  scriptData: Omit<Script, 'userId' | 'versions'> & { versions?: ScriptVersion[] } // Allow optional versions for new scripts
): Promise<Script> => {
  try {
    const now = Date.now();
    const { id, versions: scriptVersionsInput, ...dataToSave } = scriptData;
    const scriptDocRef = id ? doc(db, USERS_COLLECTION, userId, SCRIPTS_COLLECTION, id) : doc(collection(db, USERS_COLLECTION, userId, SCRIPTS_COLLECTION));
    
    const finalData: Omit<Script, 'id' | 'userId' | 'versions'> = {
      name: dataToSave.name,
      content: dataToSave.content,
      createdAt: dataToSave.createdAt || now,
      updatedAt: now,
    };

    await setDoc(scriptDocRef, finalData, { merge: true }); // Use setDoc with merge for both create and update

    const savedScript: Script = {
        ...finalData,
        id: scriptDocRef.id,
        userId,
        versions: scriptVersionsInput || [], // Use provided versions or empty array
    };
    // Note: This function doesn't handle saving versions within scriptData directly.
    // Use saveUserScriptVersion for that, or extend this function if batching is needed.
    return savedScript;

  } catch (error) {
    console.error("Error saving user script:", scriptData.name, error);
    throw error; // Re-throw to be handled by caller
  }
};


export const deleteUserScript = async (userId: string, scriptId: string): Promise<void> => {
  try {
    const scriptDocRef = doc(db, USERS_COLLECTION, userId, SCRIPTS_COLLECTION, scriptId);
    
    // Optionally, delete all versions subcollection documents first
    const versionsQuery = collection(db, USERS_COLLECTION, userId, SCRIPTS_COLLECTION, scriptId, VERSIONS_COLLECTION);
    const versionsSnapshot = await getDocs(versionsQuery);
    const batch = writeBatch(db);
    versionsSnapshot.docs.forEach(versionDoc => {
      batch.delete(versionDoc.ref);
    });
    await batch.commit();

    await deleteDoc(scriptDocRef);
  } catch (error) {
    console.error("Error deleting user script:", scriptId, error);
    throw error;
  }
};


export const saveUserScriptVersion = async (
  userId: string,
  scriptId: string,
  versionData: Omit<ScriptVersion, 'versionId'> & { versionId?: string }
): Promise<ScriptVersion> => {
  try {
    const versionId = versionData.versionId || doc(collection(db, USERS_COLLECTION, userId, SCRIPTS_COLLECTION, scriptId, VERSIONS_COLLECTION)).id;
    const versionDocRef = doc(db, USERS_COLLECTION, userId, SCRIPTS_COLLECTION, scriptId, VERSIONS_COLLECTION, versionId);
    
    const finalVersionData: ScriptVersion = {
      ...versionData,
      versionId: versionId, // Ensure versionId is set
      timestamp: versionData.timestamp || Date.now(),
    };

    await setDoc(versionDocRef, finalVersionData);
    return finalVersionData;
  } catch (error) {
    console.error("Error saving script version for script:", scriptId, error);
    throw error;
  }
};
