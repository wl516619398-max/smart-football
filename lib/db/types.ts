export type MembershipLevel = "free" | "vip" | "enterprise";

export type UserProfile = {
  id: string;
  email: string;
  username: string;
  membership_level: MembershipLevel;
  created_at: string;
};

export type DatabaseUser = {
  id: string;
  email: string;
  nickname: string;
  vip_level: MembershipLevel;
  vip_status: boolean;
  created_at: string;
  username?: string;
  membership_level?: MembershipLevel;
};

export type PredictionRecord = {
  external_id: string | null;
  user_id: string;
  match_id: string;
  prediction: string;
  confidence: number;
  score: string;
  analysis: unknown;
  model: string | null;
  result: string | null;
  created_at: string;
  updated_at: string;
};

export type PredictionRecordInput = {
  userId: string;
  matchId: string;
  externalId?: string;
  prediction: string;
  confidence: number;
  score: string;
  result?: string | null;
};
