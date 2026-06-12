import { Op } from 'sequelize';
import type { LogItem } from '@centry/shared';
import { Log } from '../models/log.js';

export interface LogFilters {
  level?: string[];
  search?: string;
  start?: number;
  end?: number;
  cursor?: string;
  limit?: number;
}

export const LogRepository = {
  bulkCreate(projectId: string, items: LogItem[]): Promise<Log[]> {
    const records = items.map((item) => ({ ...item, project_id: projectId }));
    return Log.bulkCreate(records);
  },

  async findWithFilters(
    projectId: string,
    filters: LogFilters,
  ): Promise<{ rows: Log[]; nextCursor: string | null; hasMore: boolean }> {
    const limit = Math.min(filters.limit ?? 50, 200);
    const where: Record<string, unknown> = { project_id: projectId };

    if (filters.level && filters.level.length > 0) {
      where['level'] = { [Op.in]: filters.level };
    }

    if (filters.search) {
      where['body'] = { [Op.iLike]: `%${filters.search}%` };
    }

    const timestampClauses: Record<string, unknown>[] = [];

    if (filters.start !== undefined) {
      timestampClauses.push({ timestamp: { [Op.gte]: filters.start } });
    }

    if (filters.end !== undefined) {
      timestampClauses.push({ timestamp: { [Op.lte]: filters.end } });
    }

    if (filters.cursor) {
      const { ts, id } = JSON.parse(Buffer.from(filters.cursor, 'base64').toString('utf8')) as {
        ts: number;
        id: string;
      };
      timestampClauses.push({
        [Op.or]: [{ timestamp: { [Op.lt]: ts } }, { timestamp: ts, id: { [Op.lt]: id } }],
      });
    }

    if (timestampClauses.length > 0) {
      where[Op.and as unknown as string] = timestampClauses;
    }

    const rows = await Log.findAll({
      where,
      order: [
        ['timestamp', 'DESC'],
        ['id', 'DESC'],
      ],
      limit: limit + 1,
    });

    const hasMore = rows.length > limit;
    const sliced = hasMore ? rows.slice(0, limit) : rows;
    const lastRow = sliced[sliced.length - 1];
    const nextCursor =
      hasMore && lastRow
        ? Buffer.from(JSON.stringify({ ts: lastRow.timestamp, id: lastRow.id })).toString('base64')
        : null;

    return { rows: sliced, nextCursor, hasMore };
  },
};
