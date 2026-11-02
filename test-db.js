const { createClient } = require("@libsql/client");
const client = createClient({
    url: "libsql://cancionero-db-maus2790.aws-eu-west-1.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODU1OTQwOTcsImlkIjoiMDE5ZmJkYjMtMDkwMS03NDMyLWFjMTUtNzY4MGQ2NGY4ZTZkIiwia2lkIjoiNVItbjVzQjBReUpNemZWLTlJWlVIZDN4NWJxSW9qZkRLWXVqVWNxUjNhSSIsInJpZCI6IjVlYzg3ZjIyLWZmNTAtNDc5Yi04OWY0LWM0YjIyMDQzMzMwOSJ9.4TQcjou33mMqAyYYpZEWVpl1yr8ok3G_tCpLFphZOVh--urrEBqA4FxpayP7bUl_e9fIggUot85ZhBonrwqdBg"
});

async function main() {
    const res = await client.execute("SELECT id, name, guitar_positions, piano_positions, is_predefined FROM chords WHERE is_predefined = 1 LIMIT 5;");
    console.log(JSON.stringify(res.rows, null, 2));
}
main();
