// server/db/migrate.js — Run database migrations
const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('./pool');

async function migrate() {
    console.log('🔄 Starting database migration...\n');

    // Test connection first
    const connected = await testConnection();
    if (!connected) {
        console.error('❌ Cannot connect to database. Check DATABASE_URL in .env');
        process.exit(1);
    }

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    try {
        await pool.query(schema);
        console.log('✅ Schema applied successfully!\n');

        // Verify tables exist
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);

        console.log('📋 Tables created:');
        tablesResult.rows.forEach(row => {
            console.log(`   ✓ ${row.table_name}`);
        });

        // Verify indexes
        const indexResult = await pool.query(`
            SELECT indexname, tablename
            FROM pg_indexes 
            WHERE schemaname = 'public'
            AND indexname LIKE 'idx_%'
            ORDER BY tablename, indexname;
        `);

        console.log('\n📋 Indexes created:');
        indexResult.rows.forEach(row => {
            console.log(`   ✓ ${row.indexname} (on ${row.tablename})`);
        });

        console.log('\n✅ Migration complete!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        console.error(err.stack);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    migrate();
}

module.exports = { migrate };
