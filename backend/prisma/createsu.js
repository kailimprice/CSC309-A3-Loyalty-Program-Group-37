/*
 * Complete this script so that it is able to add a superuser to the database
 * Usage example: 
 *   node prisma/createsu.js clive123 clive.su@mail.utoronto.ca SuperUser123!
 */
'use strict';

if (process.argv.length != 5)
	throw new Error(`Expected three arguments, got ${process.argv.length - 2}`);

const utorid = process.argv[2];
const email = process.argv[3];
const password = process.argv[4];

const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

async function create() {
    try {
        const user = await prisma.user.create({data: {
            utorid: utorid,
            email: email,
            password: password,
            role: "superuser",
            suspicious: false,
            verified: true
        }});
        console.log(user);
    } catch(error) {
        console.log(error);
    } finally {
        await prisma.$disconnect();
    }
}
create();