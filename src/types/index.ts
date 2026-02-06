export interface Article {
  id: string;
  user_id: string;
  title: string;
  publication_name: string | null;
  source_url: string;
  full_text: string;
  summary: string;
  created_at: string;
}

export interface Settings {
  id: string;
  user_id: string;
  summary_prompt: string;
  updated_at: string;
}

export interface ExtractedArticle {
  title: string;
  publication_name: string | null;
  full_text: string;
  source_url: string;
}
