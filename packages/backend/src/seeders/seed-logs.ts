import 'dotenv/config';
import { Project } from '../models/project.js';
import { Log } from '../models/log.js';
import { LogRepository } from '../repositories/log.js';
import { sequelize } from '../config/sequelize.js';

const LEVELS: { level: string; severity_number: number }[] = [
  { level: 'trace', severity_number: 1 },
  { level: 'debug', severity_number: 5 },
  { level: 'info', severity_number: 9 },
  { level: 'warn', severity_number: 13 },
  { level: 'error', severity_number: 17 },
  { level: 'fatal', severity_number: 21 },
];

const BODIES: Record<string, string[]> = {
  trace: [
    'Entering function resolveUser with id=42',
    'Cache lookup for key session:abc123',
    'DB query plan: seq scan on accounts',
    'HTTP request dispatched to upstream /api/v1/health',
    'Middleware chain: cors → auth → rateLimit',
    'Serialising response payload (124 bytes)',
    'Acquired connection from pool (idle=3)',
    'Token validation skipped: anonymous route',
    'Config loaded from env: NODE_ENV=production',
    'Stream chunk received: 512 bytes',
  ],
  debug: [
    'Parsed envelope header: dsn=https://key@host/1',
    'LogRepository.bulkCreate called with 12 items',
    'JWT decoded: accountId=99, exp=1718000000',
    'findWithFilters: level filter applied [error, fatal]',
    'Cursor decoded: ts=1717900000, id=uuid-abc',
    'Rate limit bucket reset for IP 192.168.1.5',
    'Project cache hit: projectId=uuid-xyz',
    'bulkCreate returned 12 inserted rows',
    'Sequelize query took 8ms',
    'Response cache-control set to no-store',
  ],
  info: [
    'Server started on port 4000',
    'New account registered: user@example.com',
    'Project created: "web-app" (uuid-proj-1)',
    'Ingest envelope accepted: 25 log items stored',
    'User logged in: accountId=55',
    'Password changed for accountId=12',
    'Project archived: "legacy-api"',
    'Scheduled cleanup: deleted 300 logs older than 90 days',
    'Health check passed: db=ok redis=ok',
    'Ingest key rotated for projectId=uuid-proj-2',
  ],
  warn: [
    'Envelope item skipped: JSON parse error on line 5',
    'Rate limit threshold reached for projectId=uuid-proj-3',
    'Slow query detected: findWithFilters took 450ms',
    'JWT expiry within 5 minutes for accountId=7',
    'DB pool exhausted: waiting for connection',
    'Deprecated header X-Api-Version: 1 used by client',
    'Project approaching log quota: 90% used',
    'Redis connection retrying after timeout (attempt 2/3)',
    'Invalid level value "verbose" coerced to debug',
    'Missing attribute "service" in envelope header',
  ],
  error: [
    'Failed to insert log batch: unique constraint violation',
    'JWT verification failed: signature mismatch',
    'DB connection refused: ECONNREFUSED 127.0.0.1:5432',
    'Unhandled promise rejection in ingest handler',
    'parseEnvelope threw EnvelopeParseError: malformed header',
    'Project not found for ingest key: public_key=deadbeef',
    'Sequelize transaction rolled back: deadlock detected',
    'Redis SET failed: ENOMEM',
    'Account creation failed: email already registered',
    'Request body exceeded 1MB limit',
  ],
  fatal: [
    'Out of memory: process killed by OS',
    'Database migration failed: relation "logs" already exists',
    'Critical config missing: DB_URL not set',
    'Uncaught exception: Cannot read properties of undefined',
    'SSL certificate expired: handshake failed',
    'Disk full: cannot write WAL segment',
    'Worker thread crashed with exit code 139 (SIGSEGV)',
    'Master process exited unexpectedly',
    'Sequelize sync failed: too many connections',
    'Application bootstrap failed: port 4000 already in use',
  ],
};

const SERVICES = ['api-gateway', 'auth-service', 'log-ingester', 'scheduler', 'frontend-ssr'];
const ENVS = ['production', 'staging', 'development'];

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildAttributes(level: string, index: number): Record<string, unknown> {
  return {
    seeded: true,
    service: randomElement(SERVICES),
    environment: randomElement(ENVS),
    request_id: `req-${index.toString().padStart(4, '0')}`,
    ...(level === 'error' || level === 'fatal'
      ? { stack_trace: `Error\n    at handler (src/routes/project.ts:42:5)\n    at Layer.handle (express/lib/router/layer.js:95:5)` }
      : {}),
    ...(Math.random() > 0.5 ? { user_id: Math.floor(randomBetween(1, 100)) } : {}),
  };
}

async function main() {
  await sequelize.authenticate();

  const project = await Project.findOne({ order: [['created_at', 'ASC']] });
  if (!project) {
    console.log('No project found in database. Create a project first, then re-run this seeder.');
    process.exit(0);
  }

  const existingSeededCount = await Log.count({
    where: { project_id: project.id, attributes: { seeded: true } },
  });

  if (existingSeededCount >= 50) {
    console.log(
      `Seeder already ran: found ${existingSeededCount} seeded logs for project "${project.name}". Skipping.`,
    );
    await sequelize.close();
    return;
  }

  const nowSecs = Date.now() / 1000;
  const sevenDaysSecs = 7 * 24 * 60 * 60;
  const items = [];
  let index = 0;

  for (const { level, severity_number } of LEVELS) {
    const bodies = BODIES[level];
    for (let i = 0; i < 10; i++) {
      const timestamp = nowSecs - randomBetween(0, sevenDaysSecs);
      items.push({
        timestamp,
        level,
        severity_number,
        body: bodies[i % bodies.length],
        trace_id: Math.random() > 0.4 ? `trace-${Math.random().toString(36).slice(2, 18)}` : undefined,
        span_id: Math.random() > 0.4 ? `span-${Math.random().toString(36).slice(2, 10)}` : undefined,
        attributes: buildAttributes(level, index++),
      });
    }
  }

  await LogRepository.bulkCreate(project.id, items);
  console.log(`Seeded 60 log records into project "${project.name}" (${project.id}).`);
  await sequelize.close();
}

main().catch((err) => {
  console.error('Seeder failed:', err);
  process.exit(1);
});
