
import { Expense, Participant, Balance, Settlement } from '../types';

export const calculateBalances = (participants: Participant[], expenses: Expense[]): Balance[] => {
  if (participants.length === 0) return [];
  
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const sharePerPerson = totalSpent / participants.length;

  return participants.map(participant => {
    const paidByThisPerson = expenses
      .filter(e => e.payerId === participant.id)
      .reduce((sum, e) => sum + e.amount, 0);
    
    return {
      participantId: participant.id,
      amount: paidByThisPerson - sharePerPerson
    };
  });
};

export const calculateSettlements = (balances: Balance[]): Settlement[] => {
  const settlements: Settlement[] = [];
  
  // Create shallow copies to mutate
  let debtors = balances
    .filter(b => b.amount < -0.01)
    .sort((a, b) => a.amount - b.amount) // Most negative first
    .map(b => ({ ...b }));
    
  let creditors = balances
    .filter(b => b.amount > 0.01)
    .sort((a, b) => b.amount - a.amount) // Most positive first
    .map(b => ({ ...b }));

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const oweAmount = Math.abs(debtors[i].amount);
    const receiveAmount = creditors[j].amount;
    
    const transferAmount = Math.min(oweAmount, receiveAmount);
    
    settlements.push({
      from: debtors[i].participantId,
      to: creditors[j].participantId,
      amount: Number(transferAmount.toFixed(2))
    });

    debtors[i].amount += transferAmount;
    creditors[j].amount -= transferAmount;

    if (Math.abs(debtors[i].amount) < 0.01) i++;
    if (Math.abs(creditors[j].amount) < 0.01) j++;
  }

  return settlements;
};
