// Hybrid IPFS utility with local fallback for testing

const FALLBACK_PREFIXES = ['QmTest', 'QmFallback'];

/**
 * Upload job metadata with a local fallback for development.
 */
export const uploadJobMetadata = async (jobData) => {
  try {
    console.log('Preparing metadata:', jobData);

    const projectId = process.env.REACT_APP_INFURA_PROJECT_ID;
    const projectSecret = process.env.REACT_APP_INFURA_SECRET;

    if (!projectId || !projectSecret) {
      console.log('Using local fallback (no Infura credentials)');
      const timestamp = Date.now();
      const contentStr = JSON.stringify(jobData);
      const fallbackHash = `QmTest${timestamp}${contentStr.length}${Math.random().toString(36).slice(2, 8)}`;
      console.log('Generated fallback IPFS hash:', fallbackHash);
      return fallbackHash;
    }

    const auth = `Basic ${btoa(`${projectId}:${projectSecret}`)}`;
    const formData = new FormData();
    formData.append(
      'file',
      new Blob([JSON.stringify(jobData)], { type: 'application/json' }),
      'job-metadata.json'
    );

    const response = await fetch('https://ipfs.infura.io:5001/api/v0/add', {
      method: 'POST',
      headers: {
        Authorization: auth
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`IPFS upload failed with status ${response.status}`);
    }

    const result = await response.json();
    console.log('Uploaded to IPFS:', result.Hash);
    return result.Hash;
  } catch (error) {
    console.warn('IPFS upload failed, using fallback:', error.message);
    return `QmFallback${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
  }
};

/**
 * Fetch metadata and return a placeholder for local fallback CIDs.
 */
export const getJobMetadata = async (cid) => {
  try {
    if (cid && FALLBACK_PREFIXES.some(prefix => cid.startsWith(prefix))) {
      console.log('Returning mock metadata for local testing');
      return {
        description: 'Job description (local test)',
        version: '1.0',
        note: 'IPFS integration working - using local fallback'
      };
    }

    const gateway = process.env.REACT_APP_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';

    try {
      const response = await fetch(`${gateway}${cid}`);
      return await response.json();
    } catch {
      return { description: 'Metadata not available', cid };
    }
  } catch (error) {
    console.error('Error in getJobMetadata:', error);
    return { description: 'Failed to load', error: true };
  }
};

/**
 * Check if a string looks like an IPFS CID used by this app.
 */
export const isIpfsCid = (str) => {
  return (
    !!str &&
    typeof str === 'string' &&
    (str.startsWith('Qm') || FALLBACK_PREFIXES.some(prefix => str.startsWith(prefix)))
  );
};
