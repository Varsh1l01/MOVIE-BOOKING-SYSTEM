import { PrismaClient, Role, MovieStatus, ScreenType, SeatType, ShowFormat, OtpPurpose } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Users ────────────────────────────────────────────────────────────────
  const adminPass = await bcrypt.hash('Admin@1234', 12);
  const userPass = await bcrypt.hash('User@1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cinemaa.in' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@cinemaa.in',
      phone: '9000000001',
      passwordHash: adminPass,
      role: Role.ADMIN,
      isVerified: true,
      city: 'Mumbai',
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '9000000002',
      passwordHash: userPass,
      role: Role.USER,
      isVerified: true,
      city: 'Mumbai',
    },
  });

  console.log('✅ Users seeded');

  // ─── Movies ────────────────────────────────────────────────────────────────
  const movies: any[] = await Promise.all([
    prisma.movie.upsert({
      where: { slug: 'kalki-2898-ad-2024' },
      update: {},
      create: {
        title: 'Kalki 2898 AD',
        slug: 'kalki-2898-ad-2024',
        description: 'In a dystopian future, a warrior rises to protect the last hope of humanity. A mythological sci-fi epic blending ancient Indian mythology with futuristic storytelling.',
        posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&h=400&fit=crop',
        trailerUrl: 'https://www.youtube.com/watch?v=sample1',
        genre: ['Action', 'Sci-Fi', 'Mythology'],
        language: ['Telugu', 'Hindi', 'Tamil'],
        duration: 181,
        releaseDate: new Date('2024-06-27'),
        rating: 8.2,
        totalRatings: 45000,
        status: MovieStatus.NOW_PLAYING,
        director: 'Nag Ashwin',
        cast: ['Prabhas', 'Deepika Padukone', 'Amitabh Bachchan', 'Kamal Haasan'],
        certification: 'UA',
      },
    }),
    prisma.movie.upsert({
      where: { slug: 'stree-2-2024' },
      update: {},
      create: {
        title: 'Stree 2',
        slug: 'stree-2-2024',
        description: 'The beloved horror comedy returns. Chanderi faces a new supernatural threat — this time even more terrifying. The Stree gang must unite again to battle the unknown.',
        posterUrl: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=600&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1200&h=400&fit=crop',
        genre: ['Horror', 'Comedy', 'Thriller'],
        language: ['Hindi'],
        duration: 145,
        releaseDate: new Date('2024-08-15'),
        rating: 8.7,
        totalRatings: 62000,
        status: MovieStatus.NOW_PLAYING,
        director: 'Amar Kaushik',
        cast: ['Rajkummar Rao', 'Shraddha Kapoor', 'Pankaj Tripathi', 'Aparshakti Khurana'],
        certification: 'UA',
      },
    }),
    prisma.movie.upsert({
      where: { slug: 'pushpa-2-the-rule-2024' },
      update: {},
      create: {
        title: 'Pushpa 2: The Rule',
        slug: 'pushpa-2-the-rule-2024',
        description: 'Pushpa Raj escalates his red sandalwood smuggling empire while facing the wrath of his nemesis Bhanwar Singh Shekawat. An action extravaganza like no other.',
        posterUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=400&fit=crop',
        genre: ['Action', 'Drama', 'Crime'],
        language: ['Telugu', 'Hindi', 'Tamil'],
        duration: 197,
        releaseDate: new Date('2024-12-05'),
        rating: 8.4,
        totalRatings: 89000,
        status: MovieStatus.NOW_PLAYING,
        director: 'Sukumar',
        cast: ['Allu Arjun', 'Rashmika Mandanna', 'Fahadh Faasil'],
        certification: 'UA',
      },
    }),
    prisma.movie.upsert({
      where: { slug: 'singham-again-2024' },
      update: {},
      create: {
        title: 'Singham Again',
        slug: 'singham-again-2024',
        description: 'The beloved cop Singham returns for another action-packed adventure in this explosive sequel to the Rohit Shetty cop universe.',
        posterUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&h=600&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=1200&h=400&fit=crop',
        genre: ['Action', 'Crime'],
        language: ['Hindi'],
        duration: 158,
        releaseDate: new Date('2024-11-01'),
        rating: 6.8,
        totalRatings: 23000,
        status: MovieStatus.NOW_PLAYING,
        director: 'Rohit Shetty',
        cast: ['Ajay Devgn', 'Deepika Padukone', 'Ranveer Singh', 'Akshay Kumar'],
        certification: 'UA',
      },
    }),
    prisma.movie.upsert({
      where: { slug: 'devara-2024' },
      update: {},
      create: {
        title: 'Devara: Part 1',
        slug: 'devara-2024',
        description: 'A fearless man rules the seas, commanding the respect of criminals. When his legacy is challenged, his son must rise to reclaim what is rightfully his.',
        posterUrl: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=400&h=600&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&h=400&fit=crop',
        genre: ['Action', 'Drama', 'Thriller'],
        language: ['Telugu', 'Hindi'],
        duration: 166,
        releaseDate: new Date('2024-09-27'),
        rating: 7.5,
        totalRatings: 31000,
        status: MovieStatus.NOW_PLAYING,
        director: 'Koratala Siva',
        cast: ['Jr. NTR', 'Janhvi Kapoor', 'Saif Ali Khan'],
        certification: 'UA',
      },
    }),
    prisma.movie.upsert({
      where: { slug: 'lucky-baskhar-2024' },
      update: {},
      create: {
        title: 'Lucky Baskhar',
        slug: 'lucky-baskhar-2024',
        description: 'A mild-mannered bank employee stumbles into the murky world of financial crime and soon finds himself in over his head in this gripping crime thriller.',
        posterUrl: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=400&h=600&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=400&fit=crop',
        genre: ['Crime', 'Thriller', 'Drama'],
        language: ['Telugu', 'Tamil'],
        duration: 149,
        releaseDate: new Date('2024-10-31'),
        rating: 8.1,
        totalRatings: 28000,
        status: MovieStatus.UPCOMING,
        director: 'Venky Atluri',
        cast: ['Dulquer Salmaan', 'Meenakshi Chaudhary'],
        certification: 'UA',
      },
    }),
    prisma.movie.upsert({
      where: { slug: 'joker-folie-a-deux-2024' },
      update: {},
      create: {
        title: 'Joker: Folie à Deux',
        slug: 'joker-folie-a-deux-2024',
        description: 'Failed comedian Arthur Fleck meets the love of his life, Harley Quinn, while incarcerated at Arkham State Hospital. Upon his release, the two embark on a doomed romantic misadventure.',
        posterUrl: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=400&h=600&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=1200&h=400&fit=crop',
        genre: ['Crime', 'Drama', 'Musical'],
        language: ['English', 'Hindi'],
        duration: 138,
        releaseDate: new Date('2024-10-02'),
        rating: 6.1,
        totalRatings: 18000,
        status: MovieStatus.NOW_PLAYING,
        director: 'Todd Phillips',
        cast: ['Joaquin Phoenix', 'Lady Gaga', 'Zazie Beetz'],
        certification: 'A',
      },
    }),
    prisma.movie.upsert({
      where: { slug: 'do-patti-2024' },
      update: {},
      create: {
        title: 'Do Patti',
        slug: 'do-patti-2024',
        description: 'A suspenseful thriller set in the hills of North India, exploring the complex relationship between twin sisters and a determined police officer uncovering a dark secret.',
        posterUrl: 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=400&h=600&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1200&h=400&fit=crop',
        genre: ['Thriller', 'Mystery', 'Drama'],
        language: ['Hindi'],
        duration: 126,
        releaseDate: new Date('2024-10-25'),
        rating: 7.2,
        totalRatings: 15000,
        status: MovieStatus.UPCOMING,
        director: 'Shashanka Chaturvedi',
        cast: ['Kajol', 'Kriti Sanon', 'Shaheer Sheikh'],
        certification: 'UA',
      },
    }),
    prisma.movie.upsert({
      where: { slug: 'vicky-vidya-ka-2024' },
      update: {},
      create: {
        title: 'Vicky Vidya Ka Woh Wala Video',
        slug: 'vicky-vidya-ka-2024',
        description: 'A chaotic comedy set in the 90s, where a newly married couple loses a private video and must retrieve it before it ruins their reputation in their small town.',
        posterUrl: 'https://images.unsplash.com/photo-1485093116812-7067822f6f4d?w=400&h=600&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=400&fit=crop',
        genre: ['Comedy', 'Drama'],
        language: ['Hindi'],
        duration: 142,
        releaseDate: new Date('2024-10-11'),
        rating: 6.9,
        totalRatings: 12000,
        status: MovieStatus.UPCOMING,
        director: 'Raaj Shaandilyaa',
        cast: ['Rajkummar Rao', 'Triptii Dimri'],
        certification: 'UA',
      },
    }),
  ]);

  console.log('✅ Movies seeded');

  // ─── Theatres ─────────────────────────────────────────────────────────────
  const theatre1 = await prisma.theatre.upsert({
    where: { id: 'theatre-mumbai-1' },
    update: {},
    create: {
      id: 'theatre-mumbai-1',
      name: 'PVR Cinemas - BKC',
      address: 'Bandra Kurla Complex, BKC',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
      amenities: ['Parking', 'Food Court', 'IMAX', '4DX', 'Recliner Seats', 'Dolby Atmos'],
    },
  });

  const theatre2 = await prisma.theatre.upsert({
    where: { id: 'theatre-mumbai-2' },
    update: {},
    create: {
      id: 'theatre-mumbai-2',
      name: 'INOX - Nariman Point',
      address: 'Nariman Point, Marine Drive',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400021',
      amenities: ['Parking', 'Cafe', 'Premium Screens', 'Dolby Atmos'],
    },
  });

  const theatre3 = await prisma.theatre.upsert({
    where: { id: 'theatre-delhi-1' },
    update: {},
    create: {
      id: 'theatre-delhi-1',
      name: 'Cinepolis - DLF Mall',
      address: 'DLF Mall of India, Sector 18, Noida',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '201301',
      amenities: ['Parking', 'Food Court', 'IMAX', 'Recliner Seats'],
    },
  });

  console.log('✅ Theatres seeded');

  // ─── Screens & Seats ──────────────────────────────────────────────────────
  const createScreenWithSeats = async (theatreId: string, name: string, type: ScreenType, rows: number, seatsPerRow: number) => {
    const existing = await prisma.screen.findFirst({ where: { theatreId, name } });
    if (existing) return existing;

    const screen = await prisma.screen.create({
      data: { theatreId, name, type, totalSeats: rows * seatsPerRow },
    });

    const seatData = [];
    for (let r = 0; r < rows; r++) {
      const row = String.fromCharCode(65 + r);
      for (let n = 1; n <= seatsPerRow; n++) {
        let seatType: SeatType = SeatType.REGULAR;
        if (r < 2) seatType = SeatType.RECLINER;
        else if (r < 4) seatType = SeatType.PREMIUM;
        seatData.push({ screenId: screen.id, row, number: n, seatCode: `${row}${n}`, type: seatType });
      }
    }
    await prisma.seat.createMany({ data: seatData, skipDuplicates: true });
    return screen;
  };

  const screen1 = await createScreenWithSeats(theatre1.id, 'IMAX Hall', ScreenType.IMAX, 10, 15);
  const screen2 = await createScreenWithSeats(theatre1.id, 'Screen 2', ScreenType.REGULAR, 8, 12);
  const screen3 = await createScreenWithSeats(theatre2.id, 'Premium Hall', ScreenType.PREMIUM, 6, 10);
  const screen4 = await createScreenWithSeats(theatre3.id, 'Screen 1', ScreenType.REGULAR, 8, 14);

  console.log('✅ Screens & seats seeded');

  // ─── Shows ────────────────────────────────────────────────────────────────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const createShow = async (movieId: string, screenId: string, hour: number, format: ShowFormat, lang: string) => {
    const startTime = new Date(tomorrow);
    startTime.setHours(hour, 0, 0, 0);
    const existing = await prisma.show.findFirst({ where: { movieId, screenId, startTime } });
    if (existing) return existing;

    return prisma.show.create({
      data: {
        movieId, screenId,
        startTime, endTime: new Date(startTime.getTime() + 3 * 60 * 60 * 1000),
        language: lang, format,
        priceRegular: 200, pricePremium: 350, priceRecliner: 550, priceCouple: 700,
      },
    });
  };

  await createShow(movies[0].id, screen1.id, 10, ShowFormat.IMAX, 'Telugu');
  await createShow(movies[0].id, screen1.id, 14, ShowFormat.IMAX, 'Hindi');
  await createShow(movies[0].id, screen2.id, 18, ShowFormat.TWO_D, 'Hindi');
  await createShow(movies[1].id, screen2.id, 11, ShowFormat.TWO_D, 'Hindi');
  await createShow(movies[1].id, screen3.id, 15, ShowFormat.TWO_D, 'Hindi');
  await createShow(movies[2].id, screen1.id, 20, ShowFormat.IMAX, 'Telugu');
  await createShow(movies[3].id, screen4.id, 12, ShowFormat.TWO_D, 'Hindi');
  await createShow(movies[4].id, screen4.id, 16, ShowFormat.TWO_D, 'Telugu');

  console.log('✅ Shows seeded');

  // ─── Coupons ──────────────────────────────────────────────────────────────
  await prisma.coupon.upsert({
    where: { code: 'FIRST50' },
    update: {},
    create: {
      code: 'FIRST50',
      description: '50% off on your first booking (max ₹200)',
      type: 'PERCENTAGE',
      value: 50,
      maxDiscount: 200,
      minOrderAmount: 100,
      usageLimit: 1000,
      perUserLimit: 1,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'FLAT100' },
    update: {},
    create: {
      code: 'FLAT100',
      description: '₹100 flat off on orders above ₹500',
      type: 'FLAT',
      value: 100,
      minOrderAmount: 500,
      usageLimit: 500,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'WEEKEND20' },
    update: {},
    create: {
      code: 'WEEKEND20',
      description: '20% off for weekend shows (max ₹150)',
      type: 'PERCENTAGE',
      value: 20,
      maxDiscount: 150,
      minOrderAmount: 200,
      usageLimit: 2000,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Coupons seeded');
  console.log('\n🎉 Database seeded successfully!');
  console.log('\nTest credentials:');
  console.log('  Admin: admin@cinemaa.in / Admin@1234');
  console.log('  User:  john@example.com / User@1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
