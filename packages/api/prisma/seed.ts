import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker/locale/fr'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed data generation...')

  // Clear existing data (production DBs should use migrations)
  if (process.env['NODE_ENV'] === 'test' || process.env['NODE_ENV'] === 'development') {
    console.log('🗑️  Clearing existing data...')
    await prisma.message.deleteMany()
    await prisma.consultation.deleteMany()
    await prisma.labRequest.deleteMany()
    await prisma.farmRecord.deleteMany()
    await prisma.healthEvent.deleteMany()
    await prisma.aiSuggestion.deleteMany()
    await prisma.communityPost.deleteMany()
    await prisma.diseaseAlert.deleteMany()
    await prisma.refreshToken.deleteMany()
    await prisma.otpCode.deleteMany()
    await prisma.farmerProfile.deleteMany()
    await prisma.vetProfile.deleteMany()
    await prisma.user.deleteMany()
  }

  const passwordHash = await bcrypt.hash('Password123!', 12)

  // Create Farmers
  console.log('👨‍🌾 Creating farmers...')
  const farmerDouala = await prisma.user.create({
    data: {
      email: 'jean.douala@neng-nom.local',
      phone: '+237691234567',
      passwordHash,
      role: 'FARMER',
      fullName: 'Jean Kamdem',
      country: 'CM',
      region: 'Littoral',
      isVerified: true,
      isActive: true,
      farmerProfile: {
        create: {
          farmName: 'Ferme Kamdem',
          farmType: 'poultry',
          animalCount: 2450,
          gpsLocation: '4.0511,9.7679',
        },
      },
    },
    include: { farmerProfile: true },
  })

  const farmerBrazzaville = await prisma.user.create({
    data: {
      email: 'marie.brazzaville@neng-nom.local',
      phone: '+242064567890',
      passwordHash,
      role: 'FARMER',
      fullName: 'Marie Okouya',
      country: 'CG',
      region: 'Pool',
      isVerified: true,
      isActive: true,
      farmerProfile: {
        create: {
          farmName: 'Élevage Okouya',
          farmType: 'cattle',
          animalCount: 156,
          gpsLocation: '-4.2634,15.2429',
        },
      },
    },
    include: { farmerProfile: true },
  })

  const farmerYaoundé = await prisma.user.create({
    data: {
      email: 'pierre.yaounde@neng-nom.local',
      phone: '+237677890123',
      passwordHash,
      role: 'FARMER',
      fullName: 'Pierre Tala',
      country: 'CM',
      region: 'Centre',
      isVerified: true,
      isActive: true,
      farmerProfile: {
        create: {
          farmName: 'Ferme Tala',
          farmType: 'guinea_fowl',
          animalCount: 892,
          gpsLocation: '3.8480,11.5021',
        },
      },
    },
    include: { farmerProfile: true },
  })

  // Create Vets
  console.log('🐾 Creating veterinarians...')
  const vetLittoral = await prisma.user.create({
    data: {
      email: 'dr.aminata@neng-nom.local',
      phone: '+237698765432',
      passwordHash,
      role: 'VET',
      fullName: 'Dr. Aminata Diallo',
      country: 'CM',
      region: 'Littoral',
      isVerified: true,
      isActive: true,
      vetProfile: {
        create: {
          licenseNumber: 'VET-CM-2024-001',
          specialization: 'Avian pathology',
          hourlyRate: 25000,
          isAvailable: true,
        },
      },
    },
    include: { vetProfile: true },
  })

  const vetCentre = await prisma.user.create({
    data: {
      email: 'dr.pierre@neng-nom.local',
      phone: '+237699999999',
      passwordHash,
      role: 'VET',
      fullName: 'Dr. Pierre Mbarga',
      country: 'CM',
      region: 'Centre',
      isVerified: true,
      isActive: true,
      vetProfile: {
        create: {
          licenseNumber: 'VET-CM-2024-002',
          specialization: 'Cattle health',
          hourlyRate: 30000,
          isAvailable: true,
        },
      },
    },
    include: { vetProfile: true },
  })

  // Create Lab Technician
  console.log('🔬 Creating lab technician...')
  const labTech = await prisma.user.create({
    data: {
      email: 'alex.lab@neng-nom.local',
      phone: '+237688888888',
      passwordHash,
      role: 'LAB_TECH',
      fullName: 'Alex Ekandjo',
      country: 'CM',
      region: 'Littoral',
      isVerified: true,
      isActive: true,
    },
  })

  // Create Consultations
  console.log('💬 Creating consultations...')
  const consultations = []
  for (let i = 0; i < 5; i++) {
    const c = await prisma.consultation.create({
      data: {
        farmerId: farmerDouala.farmerProfile!.id,
        vetId: vetLittoral.vetProfile!.id,
        type: 'CHAT',
        status: i === 0 ? 'ACTIVE' : 'CLOSED',
        symptomsDescription: 'Les poules présentent des symptômes respiratoires et une baisse de ponte.',
        mediaUrls: [],
        fee: 5000,
        startedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        endedAt: i === 0 ? null : new Date(Date.now() - (i - 1) * 24 * 60 * 60 * 1000),
      },
    })
    consultations.push(c)
  }

  // Create Messages
  console.log('💭 Creating messages...')
  for (const consultation of consultations.slice(0, 2)) {
    await prisma.message.create({
      data: {
        consultationId: consultation.id,
        senderId: farmerDouala.id,
        content: 'Bonjour Dr. Diallo, mes poules toussent depuis 3 jours.',
        messageType: 'text',
      },
    })

    await prisma.message.create({
      data: {
        consultationId: consultation.id,
        senderId: vetLittoral.id,
        content: 'Avez-vous noté du mucus nasal ou une baisse de l\'appétit? C\'est probablement une rhinite virale.',
        messageType: 'text',
      },
    })
  }

  // Create Farm Records
  console.log('📊 Creating farm records...')
  const today = new Date()
  for (let i = 0; i < 30; i++) {
    await prisma.farmRecord.create({
      data: {
        farmerId: farmerDouala.farmerProfile!.id,
        recordDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - i),
        animalCount: 2450,
        mortalityCount: Math.floor(Math.random() * 10),
        feedConsumedKg: 250 + Math.random() * 50,
        expenses: 125000 + Math.random() * 25000,
        revenue: 650000 + Math.random() * 100000,
        notes: 'Conditions normales' + (Math.random() > 0.8 ? ' - Quelques poules malades' : ''),
      },
    })
  }

  // Create Health Events (vaccinations, deworming)
  console.log('💉 Creating health events...')
  const healthEventTypes = [
    { type: 'vaccination', product: 'Newcastle Disease (ND)' },
    { type: 'vaccination', product: 'Gumboro' },
    { type: 'deworming', product: 'Levamisole' },
  ]

  for (let i = 0; i < 8; i++) {
    const eventType = healthEventTypes[i % healthEventTypes.length]
    const eventDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i * 7)
    const nextDueDate = new Date(eventDate.getTime() + 90 * 24 * 60 * 60 * 1000)

    await prisma.healthEvent.create({
      data: {
        farmerId: farmerDouala.farmerProfile!.id,
        eventType: eventType.type,
        productUsed: eventType.product,
        animalGroup: 'Tous les poulets',
        eventDate,
        nextDueDate,
        notes: `Application: FCFA 15,000`,
      },
    })
  }

  // Create AI Suggestions
  console.log('🤖 Creating AI suggestions...')
  for (let i = 0; i < 3; i++) {
    await prisma.aiSuggestion.create({
      data: {
        farmerId: farmerDouala.farmerProfile!.id,
        modelUsed: 'llama-3.1-70b-versatile',
        promptContext: JSON.stringify({
          farmType: 'poultry',
          animalCount: 2450,
          mortalityLast7Days: 5,
          lastHealthEvent: 'Vaccination ND',
        }),
        suggestion: JSON.stringify([
          {
            title: 'Améliorer la ventilation du poulailler',
            content: 'La ventilation inadéquate favorise les maladies respiratoires. Installez 4-6 ventilateurs pour 2500 poules.',
            priority: 'high',
            category: 'biosecurity',
          },
          {
            title: 'Augmenter la teneur en protéines',
            content: 'Passer à 18% de protéines pour stimuler la ponte et la résistance immunitaire.',
            priority: 'medium',
            category: 'nutrition',
          },
          {
            title: 'Planifier la vaccination Gumboro',
            content: 'La prochaine vaccination Gumboro est due dans 3 semaines. Réservez le vaccin maintenant.',
            priority: 'medium',
            category: 'health',
          },
        ]),
        generatedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      },
    })
  }

  // Create Lab Requests
  console.log('🧪 Creating lab requests...')
  for (let i = 0; i < 4; i++) {
    await prisma.labRequest.create({
      data: {
        farmerId: farmerDouala.farmerProfile!.id,
        vetId: i === 0 ? vetLittoral.vetProfile!.id : undefined,
        status: i === 0 ? 'RESULTS_READY' : 'REQUESTED',
        gpsLocation: '4.0511,9.7679',
        testType: 'DISEASE_DIAGNOSIS',
        priceQuoted: i === 0 ? 25000 : undefined,
        scheduledAt: i === 0 ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : undefined,
        resultUrl: i === 0 ? 'https://cloudinary.example.com/sample-result.pdf' : undefined,
        vetReview: i === 0 ? 'Pneumonie virale ND confirmée. Recommander isolement et traitement supportif.' : undefined,
      },
    })
  }

  // Create Community Posts
  console.log('👥 Creating community posts...')
  const posts = [
    {
      content: 'Comment gérer les mouches dans un poulailler sans pesticides chimiques?',
      category: 'QUESTION',
      tags: ['hygiene', 'parasites'],
    },
    {
      content: '⚠️ ALERTE: Cas de coccidiose rapportés dans la région de Douala. Vérifiez vos troupeaux!',
      category: 'ALERT',
      tags: ['coccidiose', 'douala'],
    },
    {
      content: 'Le maïs localement cultivé est 30% moins cher que les importations. Contactez Farmer Jean.',
      category: 'SALE',
      tags: ['alimentation', 'maïs'],
    },
    {
      content: 'Conseil: Ajouter du charbon activé à l\'eau contre les toxines. 500 FCFA le kg au marché local.',
      category: 'TIP',
      tags: ['eau', 'sante'],
    },
  ]

  for (const post of posts) {
    await prisma.communityPost.create({
      data: {
        authorId: [farmerDouala.id, farmerBrazzaville.id, vetLittoral.id][
          Math.floor(Math.random() * 3)
        ],
        content: post.content,
        category: post.category,
        tags: post.tags,
        mediaUrls: [],
        isAnonymous: false,
      },
    })
  }

  // Create Disease Alerts
  console.log('🦠 Creating disease alerts...')
  await prisma.diseaseAlert.create({
    data: {
      reportedById: vetLittoral.id,
      diseaseName: 'Newcastle Disease (ND)',
      region: 'Littoral',
      country: 'CM',
      severity: 'HIGH',
      isConfirmed: true,
    },
  })

  await prisma.diseaseAlert.create({
    data: {
      reportedById: farmerBrazzaville.id,
      diseaseName: 'Avian Coccidiosis',
      region: 'Pool',
      country: 'CG',
      severity: 'MEDIUM',
      isConfirmed: false,
    },
  })

  console.log('✅ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
