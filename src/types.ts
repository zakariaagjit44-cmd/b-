export enum Sender {
  USER = 'user',
  AI = 'ai',
}

export interface Message {
  id: number;
  text: string;
  sender: Sender;
  isStreaming?: boolean;
}