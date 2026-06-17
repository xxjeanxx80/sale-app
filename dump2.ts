import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const promos = await prisma.promotions.findMany({
    where: {
      promo_rules: {
        some: {
          rule_name: { contains: 'MŨI' }
        }
      }
    },
    include: {
      promo_rules: {
        include: {
          rule_conditions: true,
          rule_rewards: true
        }
      }
    }
  });
  console.log(JSON.stringify(promos, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
