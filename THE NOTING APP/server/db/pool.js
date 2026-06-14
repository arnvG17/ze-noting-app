// server/db/pool.js — PostgreSQL connection pool
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost')
        ? false
        : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// Log connection status
pool.on('connect', () => {
    console.log('📦 PostgreSQL connected');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL pool error:', err.message);
});

/**
 * Execute a parameterized query
 * @param {string} text - SQL query with $1, $2, ... placeholders
 * @param {Array} params - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        if (duration > 500) {
            console.warn(`⚠️ Slow query (${duration}ms):`, text.substring(0, 80));
        }
        return result;
    } catch (err) {
        console.error('❌ Query error:', err.message);
        console.error('   Query:', text.substring(0, 100));
        throw err;
    }
}

/**
 * Get a client from the pool for transactions
 * @returns {Promise<import('pg').PoolClient>}
 */
async function getClient() {
    return pool.connect();
}

/**
 * Test the database connection
 */
async function testConnection() {
    try {
        const result = await query('SELECT NOW() as now');
        console.log('✅ Database connection verified:', result.rows[0].now);
        return true;
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        return false;
    }
}

module.exports = { pool, query, getClient, testConnection };
