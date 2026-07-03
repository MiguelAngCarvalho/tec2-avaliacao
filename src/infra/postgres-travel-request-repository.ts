import pg from "pg";

import type {
  RequesterType,
  TravelRequestInput,
  TravelRequestOutput,
  TravelRequestRecord,
  TravelRequestStatus,
} from "../domain/travel-request.js";
import type { TravelRequestRepository } from "../application/travel-request-repository.js";

type QueryResult<T> = {
  rows: T[];
};

type QueryableClient = {
  query<T extends pg.QueryResultRow = pg.QueryResultRow>(
    sql: string,
    values: unknown[],
  ): Promise<QueryResult<T>>;
};

type TravelRequestRow = {
  id: string;
  requester_name: string;
  requester_type: string;
  destination: string;
  departure_date: string;
  return_date: string;
  reason: string;
  status: string;
  travel_days: number;
  daily_amount_in_cents: number;
  subtotal_in_cents: number;
  transport_cost_in_cents: number;
  total_amount_in_cents: number;
  errors_json: string;
  warnings_json: string;
  created_at: string;
};

export class PostgresTravelRequestRepository implements TravelRequestRepository {
  constructor(private readonly client: QueryableClient) {}

  async save(record: TravelRequestRecord): Promise<void> {
    await this.client.query(
      `INSERT INTO travel_requests (
        id,
        requester_name,
        requester_type,
        destination,
        departure_date,
        return_date,
        reason,
        status,
        travel_days,
        daily_amount_in_cents,
        subtotal_in_cents,
        transport_cost_in_cents,
        total_amount_in_cents,
        errors_json,
        warnings_json,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (id) DO UPDATE SET
        requester_name = EXCLUDED.requester_name,
        requester_type = EXCLUDED.requester_type,
        destination = EXCLUDED.destination,
        departure_date = EXCLUDED.departure_date,
        return_date = EXCLUDED.return_date,
        reason = EXCLUDED.reason,
        status = EXCLUDED.status,
        travel_days = EXCLUDED.travel_days,
        daily_amount_in_cents = EXCLUDED.daily_amount_in_cents,
        subtotal_in_cents = EXCLUDED.subtotal_in_cents,
        transport_cost_in_cents = EXCLUDED.transport_cost_in_cents,
        total_amount_in_cents = EXCLUDED.total_amount_in_cents,
        errors_json = EXCLUDED.errors_json,
        warnings_json = EXCLUDED.warnings_json,
        created_at = EXCLUDED.created_at`,
      [
        record.input.requestId,
        record.input.requesterName,
        record.input.requesterType,
        record.input.destination,
        record.input.departureDate,
        record.input.returnDate,
        record.input.reason,
        record.output.status,
        record.output.travelDays,
        record.output.dailyAmountInCents,
        record.output.subtotalInCents,
        record.input.transportCostInCents,
        record.output.totalAmountInCents,
        JSON.stringify(record.output.errors),
        JSON.stringify(record.output.warnings),
        record.createdAt.toISOString(),
      ],
    );
  }

  async findById(requestId: string): Promise<TravelRequestRecord | null> {
    const result = await this.client.query<TravelRequestRow>(
      `SELECT
        id,
        requester_name,
        requester_type,
        destination,
        departure_date,
        return_date,
        reason,
        status,
        travel_days,
        daily_amount_in_cents,
        subtotal_in_cents,
        transport_cost_in_cents,
        total_amount_in_cents,
        errors_json,
        warnings_json,
        created_at
      FROM travel_requests
      WHERE id = $1`,
      [requestId],
    );

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return mapRowToRecord(row);
  }
}

function mapRowToRecord(row: TravelRequestRow): TravelRequestRecord {
  const input: TravelRequestInput = {
    requestId: row.id,
    requesterName: row.requester_name,
    requesterType: row.requester_type as RequesterType,
    destination: row.destination,
    departureDate: row.departure_date,
    returnDate: row.return_date,
    reason: row.reason,
    transportCostInCents: row.transport_cost_in_cents,
  };

  const output: TravelRequestOutput = {
    requestId: row.id,
    status: row.status as TravelRequestStatus,
    travelDays: row.travel_days,
    dailyAmountInCents: row.daily_amount_in_cents,
    subtotalInCents: row.subtotal_in_cents,
    totalAmountInCents: row.total_amount_in_cents,
    errors: JSON.parse(row.errors_json) as string[],
    warnings: JSON.parse(row.warnings_json) as string[],
  };

  return {
    input,
    output,
    createdAt: new Date(row.created_at),
  };
}
