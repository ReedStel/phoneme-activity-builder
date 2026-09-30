# Load test results

Apache JMeter 5.6.3 against a **production build** (`npm run build && npm start`),
with the application and the load generator on the same laptop.

## How it was run

One plan, `load-tests/phoneme-builder.jmx`, at five levels:

```bash
bash load-tests/run-load-tests.sh 1 10 100 1000 10000
```

Every level has the same shape, so the levels can be compared: new users
arrive at **50 per second** and each one makes a single pass of the same five
requests.

| # | Request | Why it is in the test |
| --- | --- | --- |
| 1 | `GET /health` | The cheapest endpoint: a liveness check plus one query |
| 2 | `GET /api/word-lists` | A small read with two counts per row |
| 3 | `GET /api/activities` | A read that joins activities to their words |
| 4 | `GET /api/activities/{id}/generate?inline=1` | The expensive API call: builds a whole playable HTML file from stored data |
| 5 | `GET /dashboard` | A server-rendered page that runs about twenty aggregate queries |

Raw JTL files are written to `load-tests/results/` (ignored by git);
`node load-tests/summarise.mjs` produces these tables from them.

## Results

| Users | Samples | Error rate | Average | 95th percentile | Slowest | Throughput |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 5 | 0.0% | 14 ms | 27 ms | 27 ms | 70.4 req/s |
| 10 | 50 | 0.0% | 24 ms | 64 ms | 80 ms | 53.6 req/s |
| 100 | 500 | 0.0% | 318 ms | 997 ms | 3,476 ms | 122.1 req/s |
| 1,000 | 5,000 | 0.0% | 4,539 ms | 20,228 ms | 31,322 ms | 116.5 req/s |
| 10,000 | 50,000 | 18.4% | 28,097 ms | 60,009 ms | 60,035 ms | 121.2 req/s |

Per request at 10,000 users:

| Request | Samples | Average | Errors |
| --- | ---: | ---: | ---: |
| 01 Health check | 10,000 | 28,566 ms | 29 |
| 02 Word lists API | 10,000 | 16,695 ms | 9 |
| 03 Saved activities API | 10,000 | 18,536 ms | 4 |
| 04 Generate activity file | 10,000 | 19,864 ms | 13 |
| 05 Dashboard page | 10,000 | 56,825 ms | 9,164 |

## What the numbers show

**It is quick when it is not crowded.** One user sees 14 ms per request, and
ten users see 24 ms. That is what a teacher actually experiences.

**Throughput plateaus at about 120 requests per second.** From 100 users
upwards the server delivers 116 to 122 requests per second no matter how many
people arrive. That is the capacity of one Node process in front of one
SQLite file, and it does not improve by sending more work.

**Past that point, waiting time is the queue.** Because arrivals exceed
capacity, requests queue and the time each user waits grows in proportion to
how many are waiting: 318 ms at 100 users, 4.5 seconds at 1,000, 28 seconds
at 10,000. Nothing was lost up to 1,000 users; the error rate was still 0%.

**At 10,000 users the failures are almost all one page.** 9,164 of the 9,219
failures are the dashboard, which times out at 60 seconds, while the four API
endpoints stayed between 16 and 20 seconds with single-digit error counts.
The dashboard is the heaviest thing in the system because it runs about twenty
aggregate queries on every render, so it is the first thing to fall over.

**The instrumentation degraded before the application did.** The server logged
198 dropped metric writes with Prisma `P1008`:

```
metrics write failed: PrismaClientKnownRequestError
Invalid `prisma.requestLog.create()` invocation:
Socket timeout (the database failed to respond to a query within the configured timeout)
code: 'P1008'
```

That is the intended behaviour. Metric writes are fire and forget, so when
the database is saturated the recording is dropped and logged rather than
being allowed to fail a teacher's request. Observability should be the first
thing sacrificed under pressure, not the last.

## What I would change to scale further

1. **Cache the dashboard aggregates** for a few seconds. It caused 99% of the
   failures at peak and nothing on it needs to be accurate to the millisecond.
   This is the cheapest fix by a wide margin.
2. **Move to PostgreSQL.** SQLite serialises writes, which sets the 120
   requests per second ceiling. Prisma makes this mostly a schema and
   connection-string change.
3. **Sample or batch the request log** instead of writing a row per call, so
   instrumentation costs less when it matters most.
4. **Run several instances behind a load balancer**, which only becomes
   possible once the database is not a local file.

For the intended use, one teacher preparing activities for a class, the
measured capacity is far beyond what is needed. The purpose of the exercise
was to find where it stops, and it stopped where the design predicted.
