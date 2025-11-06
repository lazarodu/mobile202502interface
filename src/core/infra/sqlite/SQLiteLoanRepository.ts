import DatabaseConnection from './connection';
import { ILoanRepository } from '../../domain/repositories/ILoanRepository';
import { Loan } from '../../domain/entities/Loan';
import { v4 as uuid } from 'uuid';

export class SQLiteLoanRepository implements ILoanRepository {
  private static instance: SQLiteLoanRepository;

  private constructor() {}

  public static getInstance(): SQLiteLoanRepository {
    if (!SQLiteLoanRepository.instance) {
      SQLiteLoanRepository.instance = new SQLiteLoanRepository();
    }
    return SQLiteLoanRepository.instance;
  }

  async save(loan: Loan): Promise<void> {
    const db = await DatabaseConnection.getConnection();
    const id = uuid();
    await db.runAsync(
      'INSERT INTO loans (id, user_id, vinyl_record_id, loan_date, return_date, sync_status) VALUES (?, ?, ?, ?, ?, ?)',
      id, loan.userId, loan.vinylRecordId, loan.loanDate.toISOString(), loan.returnDate?.toISOString() || null, 'pending_create'
    );
  }

  async findById(id: string): Promise<Loan | null> {
    const db = await DatabaseConnection.getConnection();
    const loanRow = await db.getFirstAsync<any>(
      'SELECT * FROM loans WHERE id = ?',
      id
    );

    if (loanRow) {
      return Loan.create(
        loanRow.id,
        loanRow.user_id,
        loanRow.vinyl_record_id,
        new Date(loanRow.loan_date),
        loanRow.return_date ? new Date(loanRow.return_date) : undefined
      );
    }
    return null;
  }

  async findByUserId(userId: string): Promise<Loan[]> {
    const db = await DatabaseConnection.getConnection();
    const loanRows = await db.getAllAsync<any>(
      'SELECT * FROM loans WHERE user_id = ?',
      userId
    );
    return loanRows.map(loanRow =>
      Loan.create(
        loanRow.id,
        loanRow.user_id,
        loanRow.vinyl_record_id,
        new Date(loanRow.loan_date),
        loanRow.return_date ? new Date(loanRow.return_date) : undefined
      )
    );
  }

  async findCurrentLoanOfRecord(vinylRecordId: string): Promise<Loan | null> {
    const db = await DatabaseConnection.getConnection();
    const loanRow = await db.getFirstAsync<any>(
      'SELECT * FROM loans WHERE vinyl_record_id = ? AND return_date IS NULL',
      vinylRecordId
    );

    if (loanRow) {
      return Loan.create(
        loanRow.id,
        loanRow.user_id,
        loanRow.vinyl_record_id,
        new Date(loanRow.loan_date),
        loanRow.return_date ? new Date(loanRow.return_date) : undefined
      );
    }
    return null;
  }

  async update(loan: Loan): Promise<void> {
    const db = await DatabaseConnection.getConnection();
    await db.runAsync(
      "UPDATE loans SET user_id = ?, vinyl_record_id = ?, loan_date = ?, return_date = ?, sync_status = CASE WHEN sync_status = 'synced' THEN 'pending_update' ELSE sync_status END WHERE id = ?",
      loan.userId, loan.vinylRecordId, loan.loanDate.toISOString(), loan.returnDate?.toISOString() || null, loan.id
    );
  }
}
