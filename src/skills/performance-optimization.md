# Performance Optimization Skill

Follow this structured approach to performance work:

## Golden Rule
**Measure before you optimize.** Never guess at bottlenecks.

## Profiling First
```bash
# Node.js CPU profiling
node --prof app.js
node --prof-process isolate-*.log > profile.txt

# Memory profiling
node --inspect app.js  # then Chrome DevTools > Memory

# Simple timing
console.time('operation')
await operation()
console.timeEnd('operation')
```

## Common Bottlenecks

### Database
- **N+1 queries**: Load related data in bulk, not one-by-one in a loop
- **Missing indexes**: Check `EXPLAIN QUERY PLAN` (SQLite) or `EXPLAIN ANALYZE` (Postgres)
- **Unneeded columns**: Use `SELECT col1, col2` not `SELECT *`

### Memory
- **Unbounded caches**: Apply TTL or LRU eviction
- **Large arrays in closures**: Ensure GC can collect after use
- **Streams vs buffers**: Stream large files instead of loading into memory

### CPU
- **Regex recompilation**: Compile regexes once, outside loops
- **Synchronous I/O in hot paths**: Replace `fs.readFileSync` with async equivalents
- **JSON.parse in loops**: Cache parsed results

### Network
- **Sequential requests**: Use `Promise.all()` for independent requests
- **No compression**: Enable gzip/brotli for HTTP responses
- **Large payloads**: Paginate or stream large responses

## Measurement Criteria
Define success metrics before starting:
- Target latency: P50 < Xms, P99 < Yms
- Target throughput: N requests/sec
- Memory ceiling: < X MB RSS

## Verification
Run the benchmark before and after, confirm improvement is real:
```bash
autocannon -c 10 -d 30 http://localhost:3000/api/endpoint
```
