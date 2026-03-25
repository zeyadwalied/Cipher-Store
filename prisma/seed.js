const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Clear existing data
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()

  // Categories
  const catSteam = await prisma.category.create({ data: { name: 'ستيم', description: 'بطاقات هدايا وحسابات وألعاب ستيم' } })
  const catTopup = await prisma.category.create({ data: { name: 'شحن واكواد', description: 'شحن جميع الألعاب وبطاقات المتاجر' } })
  const catSubs = await prisma.category.create({ data: { name: 'الاشتراكات', description: 'اشتراكات بريميوم مخفضة' } })
  const catServices = await prisma.category.create({ data: { name: 'الخدمات', description: 'خدمات التصميم والبرمجة' } })

  // Steam Products
  await prisma.product.createMany({
    data: [
      { name: 'Steam Gift Card 5$', price: 260, description: 'كارت شحن ستيم بقيمة 5 دولار', categoryId: catSteam.id },
      { name: 'Steam Gift Card 10$', price: 510, description: 'كارت شحن ستيم بقيمة 10 دولار', categoryId: catSteam.id },
      { name: 'حساب ستيم أوفلاين (Black Myth: Wukong)', price: 150, description: 'حساب ستيم مشترك أوفلاين', categoryId: catSteam.id },
      { name: 'نقاط ستيم (10,000 نقطة)', price: 120, description: 'زيادة نقاط بروفايل ستيم', categoryId: catSteam.id },
    ]
  })

  // Top Up & Codes Products
  await prisma.product.createMany({
    data: [
      { name: 'Valorant 2050 VP', price: 650, description: 'شحن حساب فالورانت', categoryId: catTopup.id },
      { name: 'Fortnite 1000 V-Bucks', price: 350, description: 'شحن فورتنايت', categoryId: catTopup.id },
      { name: 'Roblox 800 Robux', price: 400, description: 'شحن روبلوكس بطريقة آمنة', categoryId: catTopup.id },
      { name: 'Genshin Impact 1098 Crystals', price: 600, description: 'شحن جواهر قنشن', categoryId: catTopup.id },
      { name: 'PlayStation Network 10$', price: 510, description: 'بطاقة بلايستيشن ستور أمريكي', categoryId: catTopup.id },
      { name: 'Windows 11 Pro Key', price: 250, description: 'مفتاح تنشيط ويندوز 11 برو الأصلي', categoryId: catTopup.id },
      { name: 'Discord Decorations', price: 90, description: 'إطارات وصور ديسكورد', categoryId: catTopup.id },
    ]
  })

  // Subscriptions Products
  await prisma.product.createMany({
    data: [
      { name: 'CapCut Pro (1 Month)', price: 225, description: 'اشتراك كاب كات برو لمدة شهر على حسابك', categoryId: catSubs.id },
      { name: 'Gemini Pro (1 Month)', price: 750, description: 'اشتراك جيميني برو لمدة شهر', categoryId: catSubs.id },
      { name: 'Spotify Premium (1 Month)', price: 100, description: 'اشتراك سبوتيفاي بريميوم', categoryId: catSubs.id },
      { name: 'Discord Nitro (1 Month)', price: 200, description: 'ديسكورد نايترو جيمنج شهر', categoryId: catSubs.id },
    ]
  })

  // Services Products
  await prisma.product.createMany({
    data: [
      { name: 'تصميم جرافيك وبنرات', price: 500, description: 'تصميم لوجو وبنرات احترافية لقنوات اليوتيوب', categoryId: catServices.id },
      { name: 'مونتاج فيديو وريلز', price: 800, description: 'مونتاج فيديو احترافي مع انتقالات وتأثيرات', categoryId: catServices.id },
      { name: 'برمجة موقع إلكتروني', price: 3500, description: 'تصميم وبرمجة متجر إلكتروني احترافي', categoryId: catServices.id },
      { name: 'برمجة ديسكورد بوت', price: 600, description: 'بوت ديسكورد مخصص بسيرفرك', categoryId: catServices.id },
    ]
  })

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
