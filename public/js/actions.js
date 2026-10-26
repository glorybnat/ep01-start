import { api } from './api.js';
import { toast, withBusy } from './ui.js';

// Returns a loan and reports the late fee, if any. Calls `refresh` afterwards.
export async function returnLoan(button, loanId, refresh) {
  try {
    const loan = await withBusy(button, () => api.returnLoan(loanId));
    toast(loan.lateFee > 0
      ? `Returned ${loan.id}. Late fee ${loan.lateFeeFormatted}.`
      : `Returned ${loan.id}. No late fee.`);
    await refresh();
  } catch (error) {
    toast(error.message, 'error');
  }
}
