export interface ChatResponse {
  answer: string;
  citations: Citation[];
}

export interface Citation {
  title: string;
  pageNumber: number;
  semester: number;
  course: string;
  resourceId: string;
}

export interface RetrievedContext {
  text: string;
  pageNumber: number;
  title: string;
  resourceId: string;
  semester: number;
  course: string;
  score: number;
}
