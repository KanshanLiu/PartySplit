
export interface Participant {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  payerId: string;
  amount: number;
  description: string;
  timestamp: number;
}

export interface Settlement {
  from: string; // Participant ID
  to: string;   // Participant ID
  amount: number;
}

export interface Balance {
  participantId: string;
  amount: number; // Positive means they are owed, Negative means they owe
}
