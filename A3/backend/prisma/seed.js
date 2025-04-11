/*
 * Initialize database for A3.
 * To run:
 *   cd backend
 *   npm run seed 
 */

"use strict";
// import prisma client
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// def mock user data
const usersData = [
  {
    utorid: "leedani0",
    name: "Daniel Lee",
    email: "daniel.lee@mail.utoronto.ca",
    role: "superuser",
    password: "Leedani0!",
    birthday: new Date("1990-06-15"),
    points: 1200,
    lastLogin: new Date("2025-04-08T12:30:00Z"),
    verified: true,
    suspicious: false,
  },
  {
    utorid: "pastela1",
    name: "Amy Pastel",
    email: "amy.pastel@mail.utoronto.ca",
    role: "manager",
    password: "Pastela1!",
    birthday: new Date("1985-03-22"),
    points: 850,
    lastLogin: new Date("2025-04-06T14:15:00Z"),
    verified: true,
    suspicious: false,
  },
  {
    utorid: "zhangke2",
    name: "Kevin Zhang",
    email: "kevin.zhang@mail.utoronto.ca",
    role: "cashier",
    password: "Zhangke2!",
    birthday: new Date("1995-11-01"),
    points: 430,
    lastLogin: new Date("2025-04-07T09:45:00Z"),
    verified: true,
    suspicious: false,
  },
  {
    utorid: "khanfat3",
    name: "Fatima Khan",
    email: "fatima.khan@mail.utoronto.ca",
    role: "regular",
    password: "Khanfat3!",
    birthday: new Date("2000-01-11"),
    points: 315,
    lastLogin: new Date("2025-04-05T17:00:00Z"),
    verified: false,
    suspicious: false,
  },
  {
    utorid: "nguyenm4",
    name: "Michael Nguyen",
    email: "michael.nguyen@mail.utoronto.ca",
    role: "regular",
    password: "Nguyenm4!",
    birthday: new Date("1998-10-30"),
    points: 500,
    lastLogin: new Date("2025-04-08T11:00:00Z"),
    verified: true,
    suspicious: true,
  },
  {
    utorid: "liusara5",
    name: "Sarah Liu",
    email: "sarah.liu@mail.utoronto.ca",
    role: "regular",
    password: "Liusara5!",
    birthday: new Date("1997-12-20"),
    points: 210,
    lastLogin: new Date("2025-04-03T16:45:00Z"),
    verified: true,
    suspicious: false,
  },
  {
    utorid: "chowdhu6",
    name: "Aryan Chowdhury",
    email: "aryan.chow@mail.utoronto.ca",
    role: "regular",
    password: "Chowdhu6!",
    birthday: new Date("2001-07-14"),
    points: 750,
    lastLogin: new Date("2025-04-02T13:30:00Z"),
    verified: true,
    suspicious: false,
  },
  {
    utorid: "parkemi7",
    name: "Emily Park",
    email: "emily.park@mail.utoronto.ca",
    role: "regular",
    password: "Parkemi7!",
    birthday: new Date("1999-02-17"),
    points: 650,
    lastLogin: new Date("2025-04-04T19:00:00Z"),
    verified: true,
    suspicious: false,
  },
  {
    utorid: "royjaso8",
    name: "Jason Roy",
    email: "jason.roy@mail.utoronto.ca",
    role: "regular",
    password: "Royjaso8!",
    birthday: new Date("2000-09-08"),
    points: 0,
    lastLogin: new Date("2025-04-01T08:30:00Z"),
    verified: false,
    suspicious: false,
  },
  {
    utorid: "goldnin9",
    name: "Nina Gold",
    email: "nina.gold@mail.utoronto.ca",
    role: "regular",
    password: "Goldnin9!",
    birthday: new Date("1996-04-24"),
    points: 950,
    lastLogin: new Date("2025-04-07T18:00:00Z"),
    verified: true,
    suspicious: false,
  },
  {
    utorid: "stevew10",
    name: "Steve Wood",
    email: "steve.wood@mail.utoronto.ca",
    role: "cashier",
    password: "Stevew10!",
    birthday: new Date("1999-02-24"),
    points: 1350,
    lastLogin: new Date("2025-04-07T18:00:00Z"),
    verified: true,
    suspicious: false,
  },
  {
    utorid: "amysmi11",
    name: "Amy Smith",
    email: "amy.smith@mail.utoronto.ca",
    role: "regular",
    password: "Amysmi11!",
    birthday: new Date("2004-10-20"),
    points: 200,
    lastLogin: new Date("2025-04-07T18:00:00Z"),
    verified: true,
    suspicious: false,
  },
  {
    utorid: "chloes12",
    name: "Chloe Stone",
    email: "chloe.stone@mail.utoronto.ca",
    role: "superuser",
    password: "Chloes12!",
    birthday: new Date("2000-01-01"),
    points: 2100,
    lastLogin: new Date("2025-04-07T18:00:00Z"),
    verified: true,
    suspicious: false,
  },
];


// def mock promotion data
const promotions = [
  {
    name: "Ice Cream Promotion",
    description: "1.5x points for buying ice cream from the CSSU",
    type: "one-time",
    startTime: new Date("2025-04-05"),
    endTime: new Date("2025-05-05"),
    rate: 1.5,
  },
  {
    name: "Coding Marathon Boost",
    description: "1.5x points for all purchases during exams",
    type: "automatic",
    startTime: new Date("2025-04-01"),
    endTime: new Date("2025-04-30"),
    rate: 1.5,
  },
  {
    name: "Textbook Cashback",
    description: "$10 back when you spend at least $50 on textbooks",
    type: "one-time",
    startTime: new Date("2025-04-25"),
    endTime: new Date("2025-05-10"),
    minSpending: 50,
    points: 1000,
  },
  {
    name: "Finals Fuel-Up",
    description: "1.25x points when you spend $30+ on food during finals week",
    type: "automatic",
    startTime: new Date("2025-04-20"),
    endTime: new Date("2025-05-05"),
    minSpending: 30,
    rate: 1.25,
  },
  {
    name: "Early Bird Supply Saver",
    description: "Get $7 off when spending $35+ on school supplies",
    type: "one-time",
    startTime: new Date("2025-04-10"),
    endTime: new Date("2025-04-18"),
    minSpending: 35,
    points: 700,
  },
  {
    name: "Caffeine Boost Bonus",
    description: "1.2x points for coffee purchases over $15 at campus cafés",
    type: "automatic",
    startTime: new Date("2025-04-22"),
    endTime: new Date("2025-05-15"),
    minSpending: 15,
    rate: 1.2,
  },
  {
    name: "Myhal Cafe Boost",
    description: "1.3x points when spending $10+ at the MY building café",
    type: "automatic",
    startTime: new Date("2025-04-21"),
    endTime: new Date("2025-05-01"),
    minSpending: 10,
    rate: 1.3,
  },
  {
    name: "Midterm Refuel",
    description: "Get $4 back when you spend $20+ on snacks",
    type: "one-time",
    startTime: new Date("2025-04-10"),
    endTime: new Date("2025-04-17"),
    minSpending: 20,
    points: 400,
  },
  {
    name: "Lab Supplies Deal",
    description: "1.15x points when buying lab gear over $30",
    type: "automatic",
    startTime: new Date("2025-04-23"),
    endTime: new Date("2025-05-05"),
    minSpending: 30,
    rate: 1.15,
  },
  {
    name: "UofT Merch Bonus",
    description: "$6 back when you spend $40+ on UofT gear",
    type: "one-time",
    startTime: new Date("2025-04-24"),
    endTime: new Date("2025-05-10"),
    minSpending: 40,
    points: 600,
  },
  {
    name: "Early Bird Print Credit",
    description: "1.1x points for print shop purchases over $5",
    type: "automatic",
    startTime: new Date("2025-04-08"),
    endTime: new Date("2025-04-16"),
    minSpending: 5,
    rate: 1.1,
  },
  {
    name: "Group Study Snackback",
    description: "Spend $25+ on group snacks, get $5 back",
    type: "one-time",
    startTime: new Date("2025-04-22"),
    endTime: new Date("2025-05-04"),
    minSpending: 25,
    points: 500,
  },
  {
    name: "Late Night Coding Fuel",
    description: "1.2x points after 8PM with $15+ purchases",
    type: "automatic",
    startTime: new Date("2025-04-20"),
    endTime: new Date("2025-05-05"),
    minSpending: 15,
    rate: 1.2,
  },
];


// def mock event data
const events = [
  {
    name: "UofT Hacks 11",
    description: "CS hackathon at Myhal",
    location: "MY 150",
    startTime: new Date("2025-04-17T09:00:00"),
    endTime: new Date("2025-04-19T18:00:00"),
    capacity: 600,
    pointsRemain: 1000,
    published: true,
  },
  {
    name: "CSSU Townhall",
    description: "Give feedback to your CSSU reps!",
    location: "BA 3200",
    startTime: new Date("2025-04-22T17:00:00"),
    endTime: new Date("2025-04-22T19:00:00"),
    capacity: 80,
    pointsRemain: 600,
    published: true,
  },
  {
    name: "Intro to AI Workshop",
    description: "Hands-on session with basic AI models and prompt engineering",
    location: "BA 1230",
    startTime: new Date("2025-04-15T18:00:00"),
    endTime: new Date("2025-04-15T20:30:00"),
    capacity: 100,
    pointsRemain: 500,
    published: true,
  },
  {
    name: "Code & Chat: Project Night",
    description: "Bring your side project or homework and vibe with snacks & music",
    location: "BA 2250",
    startTime: new Date("2025-04-13T17:00:00"),
    endTime: new Date("2025-04-13T21:00:00"),
    capacity: 120,
    pointsRemain: 400,
    published: true,
  },
  {
    name: "CSSU x UofT Startups Mixer",
    description: "Meet CS students and startup founders in a casual networking night",
    location: "MY 190",
    startTime: new Date("2025-04-23T18:00:00"),
    endTime: new Date("2025-04-23T21:00:00"),
    capacity: 200,
    pointsRemain: 800,
    published: false,
  },
  {
    name: "Career Panel: Life After CS",
    description: "Hear from recent grads working in industry, startups, and academia",
    location: "BA 3000",
    startTime: new Date("2025-04-24T16:00:00"),
    endTime: new Date("2025-04-24T18:00:00"),
    capacity: 150,
    pointsRemain: 700,
    published: false,
  },
  {
    name: "Bug Bash Sprint",
    description: "Help the CSSU squash bugs in their internal tooling — snacks provided!",
    location: "BA 2159",
    startTime: new Date("2025-04-14T18:00:00"),
    endTime: new Date("2025-04-14T21:00:00"),
    capacity: 60,
    pointsRemain: 300,
    published: true,
  },
  {
    name: "Intro to Git & GitHub",
    description: "A beginner-friendly workshop to demystify version control",
    location: "BA 2195",
    startTime: new Date("2025-04-16T17:00:00"),
    endTime: new Date("2025-04-16T19:00:00"),
    capacity: 100,
    pointsRemain: 450,
    published: true,
  },
  {
    name: "Women in Tech Panel",
    description: "Inspiring talks from UofT alumnae in tech and leadership",
    location: "MY 120",
    startTime: new Date("2025-04-21T16:00:00"),
    endTime: new Date("2025-04-21T18:00:00"),
    capacity: 150,
    pointsRemain: 600,
    published: true,
  },
  {
    name: "Game Dev Jam",
    description: "Mini game jam hosted by the CSSU — bring your creativity!",
    location: "BA 1130",
    startTime: new Date("2025-04-23T10:00:00"),
    endTime: new Date("2025-04-24T20:00:00"),
    capacity: 120,
    pointsRemain: 800,
    published: true,
  },
  {
    name: "Tech Resume Clinic",
    description: "One-on-one feedback from upper-year CS students and alumni",
    location: "BA 1240",
    startTime: new Date("2025-04-26T13:00:00"),
    endTime: new Date("2025-04-26T16:00:00"),
    capacity: 80,
    pointsRemain: 350,
    published: true,
  },
];


// def mock transaction types
const types = ["purchase", "adjustment", "redemption", "transfer", "event"];

// track purchases and adjustments
const purchaseTransactions = []; 

// preset values for different transaction types
const spentValues = [5, 10, 15, 20, 25];
const earnedValues = [1, 2, 3, 4]; 
const adjustmentAmounts = [10, 15, 20, 25]; 
const redemptionAmounts = [150, 200, 250]; 
const transferAmounts = [50, 75, 100]; 

// index for inc valus
let spentIndex = 0;
let earnedIndex = 0;
let adjustmentIndex = 0;
let redemptionIndex = 0;
let transferIndex = 0;

async function seed() {
  console.log("Seeding CSSU Database");

  // create users
  const createdUsers = [];
  for (let userData of usersData) {
    const newUser = await prisma.user.create({ data: userData });
    createdUsers.push(newUser);
  }

  // create promotions
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
  const [promo1, promo2] = await Promise.all(
    promotions.map((promotion) => prisma.promotion.create({ data: promotion }))
  );

  // create events
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
  const createdEvents = await Promise.all(
    events.map((event, index) =>
      prisma.event.create({
        data: {
          ...event,
          organizers: {
            // iter through users using length and index
            connect: [{ id: createdUsers[(index % createdUsers.length)]?.id }],
          },
          guests: {
            connect: [
              // iter through users using length and index
              { id: createdUsers[(index + 2) % createdUsers.length]?.id },
              { id: createdUsers[(index + 4) % createdUsers.length]?.id },
            ],
          },
        },
      })
    )
  );


  // create transactions
  for (let i = 0; i < 30; i++) {
    // loop around to beginning of list (since we have 10 users)
    const currentUser = createdUsers[i % createdUsers.length];
    const transactionType = types[i % types.length];

    // make new transaction
    const transaction = await prisma.transaction.create({
      data: {
        type: transactionType,
        remark: `${transactionType} by ${currentUser.utorid}`,
        createdBy: currentUser.utorid,
      },
    });

    // define for secondary transaction creation
    const transactionId = transaction.id;
    const utorid = currentUser.utorid;

    // if transaction is a purchase create another purchase transaction
    if (transactionType === "purchase") {
      // get curr spent val (loops)
      const spent = spentValues[spentIndex % spentValues.length]; 
      // get curr earned val
      const earned = earnedValues[earnedIndex % earnedValues.length];

      // create purchase
      await prisma.transactionPurchase.create({
        data: {
          id: transactionId,
          spent,
          earned,
          utorid,
          promotionIds: { connect: [{ id: promo2.id }] },
          // no relatedId!
        },
      });

      // save purchase to apply adjustments later
      purchaseTransactions.push({ transactionId, utorid });

      // inc index
      spentIndex++; 
      earnedIndex++; 
    }

    // if transaction is an adjustment create another adjustment transaction
    if (transactionType === "adjustment") {
      // get  latest purchase transaction for adjustment
      const relatedPurchase = purchaseTransactions[purchaseTransactions.length - 1];
      // get curr adjustment amt w index
      const amount = adjustmentAmounts[adjustmentIndex % adjustmentAmounts.length]; 

      await prisma.transactionAdjustment.create({
        data: {
          id: transactionId,
          amount,
          utorid,
          // related purchase ID
          relatedId: relatedPurchase.transactionId,
          promotionIds: { connect: [{ id: promo1.id }] }
        }
      });

      // inc adjument
      adjustmentIndex++; 
    }

    // if transaction is a redemption create another redemption transaction
    if (transactionType === "redemption") {
      // get curr redemption
      const redemptionAmount = redemptionAmounts[redemptionIndex % redemptionAmounts.length];

      await prisma.transactionRedemption.create({
        data: {
          id: transactionId,
          amount: redemptionAmount,
          utorid,
          // cashier
          relatedId: createdUsers[0].id,
        },
      });

      // inc redemption
      redemptionIndex++; 
    }

    // if transaction is a transfer create another transfer transaction
    if (transactionType === "transfer") {
      // get curr transfer
      const transferAmount = transferAmounts[transferIndex % transferAmounts.length]; 

      await prisma.transactionTransfer.create({
        data: {
          id: transactionId,
          sent: transferAmount,
          // take id of the next user
          relatedId: createdUsers[(i + 1) % createdUsers.length].id,
        },
      });

      // inc transfer
      transferIndex++; 
    }

    // if transaction is an event create another event transaction
    if (transactionType === "event") {
      await prisma.transactionEvent.create({
        data: {
          id: transactionId,
          awarded: 40,
          recipient: utorid,
          // iter through event array
          relatedId: createdEvents[i % createdEvents.length].id,
        },
      });
    }
  }
  console.log("Done seeding.");
}


async function main() {
  try {
    seed();
  } catch (error) {
    console.error("Error seeding:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
