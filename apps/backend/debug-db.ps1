# Check refresh tokens in DB directly via Prisma
$script = @"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const tokens = await prisma.refreshToken.findMany({
    where: { revoked: false },
    select: { id: true, userId: true, revoked: true, expiresAt: true, createdAt: true, token: true },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  console.log(JSON.stringify(tokens, null, 2));
  await prisma.\$disconnect();
}
main().catch(console.error);
"@

$script | node --input-type=module 2>&1
