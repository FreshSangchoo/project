export type CertificationOrigin = 'foundEmail' | 'setPassword' | 'common';
export type CertificationResultType = 'success' | 'fail' | 'error';

export type CertificationStackParamList = {
  Certification: { origin: CertificationOrigin };
  CertificationAuth: { origin: CertificationOrigin; phone?: string };
  CertificationCommon: { ok: CertificationResultType };
};
