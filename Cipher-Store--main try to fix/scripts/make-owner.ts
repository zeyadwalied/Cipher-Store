import prisma from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const email = 'magdyyuossef18@gmail.com'
  const hashedPassword = await bcrypt.hash('password123', 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'OWNER',
      password: hashedPassword,
      emailVerified: new Date(),
    },
    create: {
      email,
      name: 'Magdy Youssef',
      password: hashedPassword,
      role: 'OWNER',
      emailVerified: new Date(),
    },
  })

  console.log('Successfully updated user to OWNER:', user)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
