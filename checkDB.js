const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Fetching categories...");
    const categories = await prisma.service_categories.findMany({
      select: {
        id: true,
        category_name: true,
        parent_id: true,
        category_level: true,
      },
      orderBy: [
        { category_level: 'asc' },
        { category_name: 'asc' }
      ]
    });
    console.log("Categories:", categories.length);

    console.log("Testing getAllCategoriesMin mapping...");
    const categoryMap = new Map();
    categories.forEach(c => categoryMap.set(c.id, c));

    let count = 0;
    const formattedCategories = categories.map(c => {
      let current = c;
      let path = [];
      let loopCount = 0;
      while (current) {
        if (loopCount > 100) {
          throw new Error("Infinite loop detected for category: " + c.id);
        }
        path.unshift(current.category_name);
        current = current.parent_id ? categoryMap.get(current.parent_id) : null;
        loopCount++;
      }
      return {
        id: c.id,
        category_name: path.join(' / '),
        level: c.category_level,
        parent_id: c.parent_id
      };
    });
    console.log("Formatted Categories mapped successfully.");

    console.log("Fetching services...");
    const services = await prisma.services.findMany({
      take: 5,
      include: {
        service_categories: {
          include: {
            service_categories: true
          }
        },
        service_prices: {
          where: { is_current: true },
          take: 1,
        },
      },
    });
    console.log("Services fetched:", services.length);
    if (services.length > 0) {
       console.log("Sample service prices:", services[0].service_prices);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
