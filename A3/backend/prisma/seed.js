/*
 * Initialize database for A3.
 * To run:
 *   cd backend
 *   npm run seed OR node prisma/seed.js
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
];


// def mock promotion data
const promotions = [
  {
    name: "Free Timbit Friday",
    description: "Redeem points for coffee + Timbit at Bahen",
    type: "bonus",
    startTime: new Date("2025-04-05"),
    endTime: new Date("2025-05-05"),
    points: 150,
  },
  {
    name: "Coding Marathon Boost",
    description: "1.5x points for all purchases during Exams",
    type: "multiplier",
    startTime: new Date("2025-04-01"),
    endTime: new Date("2025-04-30"),
    rate: 1.5,
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
  const [promo1, promo2] = await Promise.all(
    promotions.map((promotion) => prisma.promotion.create({ data: promotion }))
  );

  // create events
  const [event1, event2] = await Promise.all([
    prisma.event.create({
      data: {
        ...events[0],
        // amy patel organizing
        organizers: { connect: [{ id: createdUsers[1].id }] },
        guests: {
          connect: [{ id: createdUsers[3].id }, { id: createdUsers[5].id }],
        },
      },
    }),
    prisma.event.create({
      data: {
        ...events[1],
        // daniel lee organizing
        organizers: { connect: [{ id: createdUsers[2].id }] },
        guests: {
          connect: [{ id: createdUsers[4].id }, { id: createdUsers[6].id }],
        },
      },
    }),
  ]);

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
      // only apply adjustment to first half of purchases
      if (purchaseTransactions.length <= Math.floor(purchaseTransactions.length / 2)) {
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
          relatedId: i % 2 === 0 ? event1.id : event2.id,
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
