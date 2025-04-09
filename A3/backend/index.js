#!/usr/bin/env node
'use strict';

const port = (() => {
    const args = process.argv;

    if (args.length !== 3) {
        console.error("usage: node index.js port");
        process.exit(1);
    }

    const num = parseInt(args[2], 10);
    if (isNaN(num)) {
        console.error("error: argument must be an integer.");
        process.exit(1);
    }

    return num;
})();

const express = require("express");
const app = express();

app.use(express.json());

// ADD YOUR WORK HERE
const cors = require('cors');

// Set up cors to allow requests from your React frontend
app.use(cors({origin: 'http://localhost:5173'}));


const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const SECRET_KEY = `94]85uihqojifjp;fj'w4[90[8y'a'f;[3\\4-=+_O$_+T|$LP{L"@#}`;


/*******************************************************************************
Authentification
*******************************************************************************/
function authentication(req, res, next) {
    req.utorid = null;
    const auth = req.headers.authorization;
    if (!auth)
        return next();

    const data = auth.split(" ");
    if (data.length != 2)
        return next();
    const [authType, token] = data;
    if (authType != 'Bearer')
        return next();

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.type != 'login')
            return next();
        req.utorid = decoded.utorid;
        return next();
    } catch(error) {
        console.log(`[WARNING] ${error}`);
        return next();
    }
}
app.use(authentication);
app.use(async (req, res, next) => {
    console.log(`\n--------------------\n${req.method}, ${req.url}`);
    console.log(`user=${req.utorid}`);
    if (req.utorid) {
        const user = await prisma.user.findUnique({where: {utorid: req.utorid}});
        if (user)
            console.log(`role=${user.role}`);
    }
    if (Object.keys(req.params).length > 0)
        console.log(`params=${JSON.stringify(req.params)}`);
    if (Object.keys(req.body).length > 0)
        console.log(`body=${JSON.stringify(req.body)}`);
    if (Object.keys(req.query).length > 0)
        console.log(`query=${JSON.stringify(req.query)}`);
    console.log('');
    next();
});

const PERMISSION_LEVELS = ['any', 'regular', 'cashier', 'manager', 'superuser'];
function hasPerms(levelHas, levelNeeded) {
    const has = PERMISSION_LEVELS.findIndex(x => x == levelHas);
    const needed = PERMISSION_LEVELS.findIndex(x => x == levelNeeded);
    return has >= needed;
}

function permLevel(levelNeeded) {
    return async (req, res, next) => {
        if (!req.utorid) {
            console.log(`403, no utorid`);
            return res.status(401).json({'error': `No utorid`});
        }
        req.user = null;
        const user = await prisma.user.findUnique({where: {utorid: req.utorid}});
        if (!user) {
            console.log(`403, utorid not found`);
            return res.status(403).json({'error': `utorid not found`});
        }
        req.user = user;
        if (hasPerms(user.role, levelNeeded)) {
            // View page with different role
            const role = req.body['viewAsRole'];
            if (!role)
                return next();
            if (!hasPerms(role, levelNeeded))
                return res.status(403).json({'error': `bad viewing permission level ${role}`});
            req.user.role = role;
            return next();
        }

        console.log(`403, role=${user.role}, need=${levelNeeded}`);
        return res.status(403).json({'error': `role=${user.role}, need=${levelNeeded}`});
    }
}

/*******************************************************************************
Helper, Basic
*******************************************************************************/
function queryAllow(variables, req, res) {
    for (let key in req.query) {
        if (!variables.includes(key)) {
            console.log(`404, extra field ${key}`);
            return [null, res.status(404).json({'error': `Extra field ${key}`})];
        }            
    }
    return [req.query, false];
}
function bodyRequire(variables, req, res) {
    for (let key of variables) {
        if (!(key in req.body)) {
            console.log(`400, missing field ${key}`)
            return res.status(400).json({'error': `Missing field ${key}`});
        }
        if (req.body[key] == null) {
            console.log(`400, key ${key} is null`)
            return res.status(400).json({'error': `key ${key} is null`});
        }
    }
    return false;
}
function getParamIndex(name, req, res) {
    const i = req.params[name];
    const parsed = parseInt(i, 10);
    if (parsed == null || isNaN(parsed) || parsed < 0) {
        console.log(`400, invalid id ${i}`);
        return [null, res.status(400).json({'error': `Invalid id ${i}`})];
    }        
    return [parsed, false];
}

function objectAddLax(variables, source, adder) {
    if (Array.isArray(variables)) {
        for (let name of variables) {
            const value = source[name];
            if (value == undefined || value == null)
                continue;
            adder[name] = value;
        }
    } else {
        for (let name in variables) {
            const transform = variables[name] ? variables[name] : x => x;
            const value = source[name];
            if (value == undefined || value == null)
                continue; 
            adder[name] = transform(value);
        }
    }
}

function objectAddStrict(validation, source, adder, res) {
    for (let name in validation) {
        const checkerTransform = validation[name];
        const value = source[name];
        if (value == undefined || value == null)
            continue;

        let checker, transform;
        if (Array.isArray(checkerTransform)) {
            [checker, transform] = checkerTransform;
        } else {
            checker = checkerTransform;
            transform = x => x;
        }
        if (!checker || checker(value)) {
            adder[name] = transform(value);
        } else {
            console.log(`400, bad ${name} = ${value}`);
            return res.status(400).json({'error': 'Bad argument'});
        }
    }
    if (Object.keys(adder).length == 0) {
        console.log(`400, no body arguments`);
        return res.status(400).json({'error': 'No body arguments'});
    }
    return false;
}


/*******************************************************************************
Helper, Database
*******************************************************************************/
function parseTakeSkip(query, res) {
    const limit = parseInt(query['limit'], 10);
    const e1 = checkCondition(res, !(limit <= 0), 400, `Bad limit=${query['limit']}`);
    if (e1) return [null, null, e1];
    
    const page = parseInt(query['page'], 10);
    const e2 = checkCondition(res, !(page <= 0), 400, `Bad page=${query['page']}`);
    if (e2) return [null, null, e2];
    
    const take = isNaN(limit) ? 10 : limit;
    const skip = isNaN(page) ? 0 : take * (page - 1);
    return [take, skip, false]
}
async function findMany(client, filter, query, res, include={}, omit={}, orderBy={}) {
    const [take, skip, e3] = parseTakeSkip(query, res);
    if (e3) return [null, null, e3];
    
    let result = await client.findMany({where: filter, take: take, skip: skip, include: include, omit: omit, orderBy: orderBy});
    const count = await client.count({where: filter});
    console.log(`200, got ${count} total, ${result.length} displayed with filter ${JSON.stringify(query)}, take=${take}, skip=${skip}`);
    return [count, result, false];
}

async function findUnique(client, filter, res, include=null, omit=null) {
    let result;
    if (include && omit)
        result = await client.findUnique({where: filter, include: include, omit: omit});
    else if (include)
        result = await client.findUnique({where: filter, include: include});
    else if (omit)
        result = await client.findUnique({where: filter, omit: omit});
    else
        result = await client.findUnique({where: filter});

    if (!result) {
        console.log(`404, failed to find ${JSON.stringify(filter)}`)
        return [null, res.status(404).json({'error': `Found nothing with ${JSON.stringify(filter)}`})];
    }
    return [result, false];
}


/*******************************************************************************
Check fields
*******************************************************************************/
function checkPassword(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]+$/;
    const result = typeof(password) == 'string' && password.length >= 8 && password.length <= 20 && regex.test(password);
    if (!result)
        console.log(`400, bad password=${password}`)
    return result;
}
function checkEmail(email) {
    const result = typeof(email) != 'string' || email.endsWith('@mail.utoronto.ca');
    if (!result)
        console.log(`400, bad email=${email}`);
    return result;
}
function checkName(name) {
    const result = typeof(name) != 'string' || (name.length >= 1 && name.length <= 50);
    if (!result)
        console.log(`400, bad name=${name}`);
    return result;
}
function checkBirthday(birthday) {
    if (typeof(birthday) != 'string')
        return true;
    
    let result = /^\d{4}-\d{2}-\d{2}$/.test(birthday);
    if (!result) {
        console.log(`400, bad birthday=${birthday}`);
        return result;
    }

    let [year, month, day] = birthday.split('-').map(x => parseInt(x, 10));
    if ([1, 3, 5, 7, 8, 10, 12].includes(month))
        result &&= (day >= 1) && (day <= 31);
    else
        result &&= (day >= 1) && (day <= 30);
    if (month == 2)
        result &&= (year % 4 == 0) ? (day <= 29) : (day <= 28);

    if (!result)
        console.log(`400, bad birthday=${birthday}`);
    return result;
}
function checkUtorid(utorid) {
    const result = typeof(utorid) != 'string' || (utorid.length == 8 && /^[0-9a-z]+$/.test(utorid));
    if (!result)
        console.log(`400, bad utorid=${utorid}`);
    return result;
}
function checkRole(role, levels) {
    const result = typeof(role) != 'string' || levels.includes(role);
    if (!result)
        console.log(`400, role=${role}`);
    return result;
}
function checkRoleChange(user, role) {
    if (hasPerms(user, 'superuser'))
        return checkRole(role, PERMISSION_LEVELS);
    return checkRole(role, ['cashier', 'regular']);
}
function checkCondition(res, condition, errStatus, errMessage) {
    if (!condition) {
        console.log(`${errStatus}, ${errMessage}`);
        return res.status(errStatus).json({'error': errMessage});
    }
    return false;
}
function postProcessBirthday(result) {
    if ('birthday' in result && result['birthday'] !== null && result['birthday'] !== undefined)
        result['birthday'] = result['birthday'].toISOString().split('T')[0];
}


/*******************************************************************************
Helper, Logging In
*******************************************************************************/
async function createPasstoken(utorid, expiresIn) {
    const info = {type: 'password', utorid: utorid};
    const token = jwt.sign(info, SECRET_KEY, {expiresIn: expiresIn});
    const expiry = new Date(jwt.verify(token, SECRET_KEY).exp * 1000);

    const result = await prisma.passtoken.findUnique({where: {utorid: utorid}});
    if (result) {
        await prisma.passtoken.update({where: {utorid: utorid}, data: {expiry: expiry}});
        console.log(`202, recreate passtoken, utorid=${utorid}, expiry=${expiry}, token=${token}`);
    } else {
        await prisma.passtoken.create({data: {utorid: utorid, expiry: expiry}});    
        console.log(`202, create new passtoken, utorid=${utorid}, expiry=${expiry}, token=${token}`);
    }
    return [token, expiry];
}
function createLogintoken(utorid, expiresIn) {
    const info = {type: 'login', utorid: utorid};
    const token = jwt.sign(info, SECRET_KEY, {expiresIn: expiresIn});
    const expiry = new Date(jwt.verify(token, SECRET_KEY).exp * 1000);
    console.log(`200, login, utorid=${utorid}, expiry=${expiry}, token=${token}`);
    return [token, expiry];
}
async function checkPasstoken(token, utorid, res) {
    const result = await prisma.passtoken.findUnique({where: {utorid: utorid}});
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const decodedExpiry = new Date(jwt.decode(token).exp * 1000);

        // Old token
        if (result != null && decodedExpiry.getTime() != result.expiry.getTime()) {
            console.log(`410, old token:\nold expire: ${decodedExpiry}\nnew expire: ${result.expiry}`);
            return res.status(410).json({'error': 'Old token'});
        }
        // Bad token type (apparently login tokens are fine?)
        if (decoded.utorid != utorid) {
            console.log(`401, wrong token, token_type=${decoded.type}, token_utorid=${decoded.utorid}, utorid=${utorid}`);
            return res.status(401).json({'error': 'Bad request'});
        }
    } catch(error) {
        // Expiry date
        if (error instanceof jwt.TokenExpiredError) {
            console.log(`410, token expiry date passed`);
            return res.status(410).json({'error': 'Token expiry date passed'});
        }
        // Bad token
        console.log(`404, bad token, ${error}`);
        return res.status(404).json({'error': 'Bad token'});
    }
    return false;
}


/*******************************************************************************
Logging In
*******************************************************************************/
// Login
app.post('/auth/tokens', async (req, res) => {
	const e1 = bodyRequire(['utorid', 'password'], req, res);
    if (e1) return e1;

    // Authenticate
    const {utorid, password} = req.body;
    let result = await prisma.user.findUnique({where: {utorid: utorid, password: password}});
    if (!result) {
        console.log(`401, failed authentication, utorid=${utorid}, password=${password}`);
        return res.status(401).json({'error': 'Invalid username/password'});
    }
    
    // Update last login
    result = await prisma.user.update({where: {utorid: utorid}, data: {lastLogin: new Date()}});

    // Login token
    const [token, expiryDate] = createLogintoken(utorid, '7d');
    return res.status(200).json({token: token, expiresAt: expiryDate});
    // TODO what is expiry date
});

// Request password change token
app.post('/auth/resets', async (req, res) => {
	const e1 = bodyRequire(['utorid'], req, res);
    if (e1) return e1;

    // Check user exists
    const {utorid} = req.body;
    const [result, e2] = await findUnique(prisma.user, {utorid: utorid}, res);
    if (e2) return e2;

    // Create token
    const [token, expiryDate] = await createPasstoken(utorid, '1h');
    return res.status(202).json({expiresAt: expiryDate, resetToken: token});
    // TODO handle too many requests
});

// Reset password
app.post('/auth/resets/:resetToken', async (req, res) => {
	const e1 = bodyRequire(['utorid', 'password'], req, res);
    if (e1) return e1;

    // Check utorid and password
    const {utorid, password} = req.body;
    let [result, e2] = await findUnique(prisma.user, {utorid: utorid}, res);
    if (e2) return e2;
    if (!checkPassword(password))
        return res.status(400).json({'error': `Bad password`});

    // Check passtoken
    const {resetToken} = req.params;
    const e3 = await checkPasstoken(resetToken, utorid, res);
    if (e3) return e3;

    console.log(`200, set utorid=${utorid} to password=${password}`);
    result = await prisma.user.update({where: {utorid: utorid}, data: {password: password}});
    return res.status(200).end();
});


/*******************************************************************************
Get/Create Users
*******************************************************************************/
app.get('/users', permLevel('manager'), async (req, res) => {
    const variables = ['utorid', 'name', 'role', 'verified', 'activated', 'page', 'limit', 'orderBy', 'order'];
    const [query, e1] = queryAllow(variables, req, res);
    if (e1) return e1;

    // Get filter
    const filter = {};
    const varTransforms = {utorid: null, name: null, role: null, verified: x => (x == 'true') ? true : false};
    objectAddLax(varTransforms, query, filter);
    
    // Extra behaviour
    if (query['activated'] == 'true') {
        filter['lastLogin'] = {not: null};
    } else if (query['activated'] == 'false') {
        filter['lastLogin'] = null;
    }

    // Ordering
    const orderBy = {};
    if (query['orderBy']) {
        orderBy[query['orderBy']] = query['order'];
        delete filter['orderBy'];
        delete filter['order'];
    }
    
    let [count, result, e2] = await findMany(prisma.user, filter, query, res, {}, {}, orderBy);
    if (e2) return e2;
    return res.status(200).json({count: count, results: result});
});
app.post('/users', permLevel('cashier'), async (req, res) => {
    const variables = ['utorid', 'name', 'email'];
    const e1 = bodyRequire(variables, req, res);
    if (e1) return e1;
    
    // Check name, email, utorid
    const {utorid, name, email} = req.body;
    if (!checkName(name) || !checkEmail(email) || !checkUtorid(utorid))
        return res.status(400).json({'error': `Bad argument`});

    // Check utorid
    let result = await prisma.user.findUnique({where: {utorid: utorid}});
    if (result) console.log(`409, failed to create utorid=${utorid}, already exists`);  
    if (result)
        return res.status(409).json({'error': `utorid ${utorid} already exists`});

    result = await prisma.user.create({data: {
        utorid: utorid,
        name: name,
        email: email,
        role: "regular"
    }});
    console.log(`201, create user utorid=${utorid}, name=${name}, email=${email}`);
    const [token, expiryDate] = createLogintoken(utorid, '7d');
    return res.status(201).json({
        id: result.id,
        utorid: result.utorid,
        name: result.name,
        email: result.email,
        verified: result.verified,
        expiresAt: expiryDate,
        resetToken: token
    });
});


/*******************************************************************************
Current User Info
*******************************************************************************/
const multer = require('multer')
const upload = multer({dest: 'uploads/'});

app.get('/users/me', async (req, res) => {
    console.log(req.utorid);
    const [result, error] = await findUnique(prisma.user, {utorid: req.utorid}, res, null, {password: true});
    if (error) return error;

    result['promotions'] = []; // TODO
    return res.status(200).json(result);
});
app.patch('/users/me', upload.single('avatar'), async (req, res) => {
    const {name, email, birthday} = req.body;

    if (!checkName(name) && !checkEmail(email) && !checkBirthday(birthday))
        return res.status(400).json({'error': 'Bad arguments'});

    const data = req.file ? {'avatarUrl': req.file.path} : {};
    const validation = {name: checkName, email: checkEmail, birthday: [checkBirthday, x => new Date(x)]};
    const e1 = objectAddStrict(validation, req.body, data, res);
    if (e1) return e1;

    const result = await prisma.user.update({where: {utorid: req.utorid}, data: data, omit: {password: true}});
    console.log(`200, update utorid=${req.utorid}, data=${JSON.stringify(data)}`);

    postProcessBirthday(result);
    return res.status(200).json(result);
});
app.patch('/users/me/password', async (req, res) => {
    const e1 = bodyRequire(['old', 'new'], req, res);
	if (e1) return e1;
    
    // Check new password
    const pOld = req.body['old'];
    const pNew = req.body['new'];
    if (!checkPassword(pNew))
        return res.status(400).json({'error': `Bad new password`});
    
    // Check old password
    let result = await prisma.user.findUnique({where: {utorid: req.utorid, password: pOld}});
    if (!result) {
        result = await prisma.user.findUnique({where: {utorid: req.utorid}});
        console.log(`403, utorid=${req.utorid}, pOld=${pOld}, expected=${result.password}`);
        return res.status(403).json({'error': 'Incorrect old password'});
    }
    
    console.log(`200, utorid=${req.utorid}, pOld=${pOld}, pNew=${pNew}`);
    result = await prisma.user.update({where: {utorid: req.utorid}, data: {password: pNew}});
    return res.status(200).end();
});


/*******************************************************************************
User info
*******************************************************************************/
app.get('/users/:userId', permLevel('cashier'), async (req, res) => {
    const [userId, e1] = getParamIndex('userId', req, res);
    if (e1) return e1;

    const omit = {password: true};
    if (!hasPerms(req.user.role, 'manager')) {
        for (let name of ['email', 'role', 'birthday', 'createdAt', 'lastLogin', 'avatarUrl']) {
            omit[name] = true;
        }
    } 
    const result = await prisma.user.findUnique({where: {id: userId}, omit: omit});
    if (!result) {
        console.log(`400, no find id=${userId}`);
        return res.status(400).json({'error': `400, no find id=${userId}`});
    }
    result['promotions'] = []; // TODO
    return res.status(200).json(result);
});

app.patch('/users/:userId', permLevel('manager'), async (req, res) => {
    const [userId, e1] = getParamIndex('userId', req, res);
    if (e1) return e1;
    let [result, e2] = await findUnique(prisma.user, {id: userId}, res);
    if (e2) return e2;

    // Build updater
    const data = {};
    const validation = {email: checkEmail,
                        verified: x => x === true,
                        suspicious: x => typeof(x) == 'boolean',
                        role: x => checkRole(x, PERMISSION_LEVELS)};
    const e3 = objectAddStrict(validation, req.body, data, res);
    if (e3) return e3;
    
    // Handle role changes
    const newRole = data['role'];
    if (newRole) {
        if (checkRoleChange(req.user.role, newRole)) {
            if (result.role == 'regular' && newRole == 'cashier' && !('suspicious' in data))
                data['suspicious'] = false;
            if (result.role == 'cashier' && newRole != 'cashier')
                data['suspicious'] = null;
        } else {
            console.log(`403, role ${req.user.role} does not allow setting to ${newRole}`);
            return res.status(403).json({'error': `role ${req.user.role} does not allow setting to ${newRole}`})
        }
    }
    const select = {id: true, utorid: true, name: true};
    for (let name in data) {
        select[name] = true;
    }
    result = await prisma.user.update({where: {id: userId}, data: data, select: select});
    console.log(`Update id=${userId}, data=${JSON.stringify(data)}`);

    return res.status(200).json(result);
});


/*******************************************************************************
Redemption transaction
*******************************************************************************/
app.post('/users/me/transactions', permLevel('regular'), async (req, res) => {
    const e1 = bodyRequire(['type'], req, res);
    if (e1) return e1;

    const data1 = {creator: {connect: {utorid: req.utorid}}};
    const validation1 = {type: x => x == 'redemption', remark: null};
    const e2 = objectAddStrict(validation1, req.body, data1, res);
    if (e2) return e2;
    const data2 = {user: {connect: {utorid: req.utorid}}};
    const validation2 = {amount: isCount};
    const e3 = objectAddStrict(validation2, req.body, data2, res);
    if (e3) return e3;    

    const e4 = checkCondition(res, req.user.verified, 403, `User ${req.utorid} not verified`);
    if (e4) return e4;
    const e5 = checkCondition(res, data2['amount'] <= req.user.points, 400, `Redeemed ${data2['amount']} exceeds balance ${req.user.points}`);
    if (e5) return e5;
    const e6 = checkCondition(res, data2['amount'] > 0, 400, `Redeemed ${data2['amount']} <= 0`);
    if (e6) return e6;

    // Create transaction
    const p1 = await prisma.transaction.create({data: data1});
    data2['transaction'] = {connect: {id: p1.id}};
    const p2 = await prisma.transactionRedemption.create({data: data2});    
    console.log(`201,\np1=${JSON.stringify(p1)},\np2=${JSON.stringify(p2)}`);

    p2['processedBy'] = p2['relatedId'];
    return res.status(201).json(Object.assign({}, p1, p2));
});


/*******************************************************************************
Transfer transaction
*******************************************************************************/
app.post('/users/:userId/transactions', permLevel('regular'), async (req, res) => {
    const variables = ['type', 'amount'];
    const e1 = bodyRequire(variables, req, res);  
    if (e1) return e1;
    const [userId, e2] = getParamIndex('userId', req, res);
    if (e2) return e2;
    
    // Sender
    const e3 = checkCondition(res, req.user.verified, 403, `sender utorid ${req.utorid} not verified`);
    if (e3) return e3;
    
    // Recipient
    let result = await prisma.user.findUnique({where: {id: userId}});
    const e4 = checkCondition(res, result, 404, `recipient userId ${userId} not found`);
    if (e4) return e4;
    const e5 = checkCondition(res, userId != req.user.id, 400, `Recipient = sender ${req.utorid}`);
    if (e5) return e5;

    // Construct fields
    const data1 = {creator: {connect: {utorid: req.utorid}}};
    const e6 = objectAddStrict({type: x => x == 'transfer', remark: null}, req.body, data1, res);
    if (e6) return e6;
    const sent = req.body['amount'];
    const e7 = checkCondition(res, isCount(false)(sent), 400, `Bad amount sent ${sent}`);
    if (e7) return e7;
    const e8 = checkCondition(res, sent <= req.user.points, 400, `Sending more points (${sent}) than ${req.utorid} owns (${req.user.points})`);
    if (e8) return e8;

    // Create transfer
    const p1 = await prisma.transaction.create({data: data1});
    const toSelf = {sent: -sent, relatedUser: {connect: {id: userId}}, transaction: {connect: {id: p1.id}}};
    const p2 = await prisma.transactionTransfer.create({data: toSelf});
    
    const p3 = await prisma.transaction.create({data: data1});
    const toOther = {sent: sent, relatedUser: {connect: {id: req.user.id}}, transaction: {connect: {id: p3.id}}};
    const p4 = await prisma.transactionTransfer.create({data: toOther});
    console.log(`201,\np1=${JSON.stringify(p1)},\np2=${JSON.stringify(p2)},\np3=${JSON.stringify(p3)},\np4=${JSON.stringify(p4)}`);

    // Apply purchase
    await prisma.user.update({where: {id: req.user.id}, data: {points: {increment: -sent}}});
    await prisma.user.update({where: {id: userId}, data: {points: {increment: sent}}});

    result = {id: p1.id, sender: req.utorid, recipient: result.utorid, type: p1.type,
                sent: sent, remark: p1.remark, createdBy: p1.createdBy};
    return res.status(201).json(result);
});


/*******************************************************************************
Get transaction
*******************************************************************************/
function postProcessGetTransaction(include, result) {
    const columns = Object.keys(include);
    columns.forEach(x => {
        if (result[x]) {
            for (let y in result[x]) {
                result[y] = result[x][y];
            }
        }
        delete result[x];
    });
}
app.get('/transactions', permLevel('manager'), async (req, res) => {
    const variables = ['utorid', 'name', 'createdBy', 'suspicious', 'promotionId', 'type', 'relatedId', 'amount', 'operator', 'page', 'limit', 'orderBy', 'order'];
    const [query, e1] = queryAllow(variables, req, res);
    if (e1) return e1;
    
    const {utorid, name, type, operator, relatedId, amount} = query;
    const filter = {};
    objectAddLax(['createdBy', 'suspicious', 'promotionId', 'type'], query, filter, res);
    if (type != 'purchase' && relatedId)    filter['relatedId'] = relatedId;
    if (operator == 'lte')                  filter['amount'] = {lte: amount};
    else if (operator == 'gte')             filter['amount'] = {gte: amount};

    if (utorid && name) {
        filter[AND] = [
            {OR: [{infoPurchase: {user: {utorid: utorid}}},
                {infoAdjustment: {user: {utorid: utorid}}},
                {infoRedemption: {user: {utorid: utorid}}},
                {infoEvent: {user: {utorid: utorid}}}]},
            {OR: [{infoPurchase: {user: {name: name}}},
                {infoAdjustment: {user: {name: name}}},
                {infoRedemption: {user: {name: name}}},
                {infoEvent: {user: {name: name}}}]}
        ];
    } else if (utorid) {
        filter[OR] = [{infoPurchase: {user: {utorid: utorid}}},
                    {infoAdjustment: {user: {utorid: utorid}}},
                    {infoRedemption: {user: {utorid: utorid}}},
                    {infoEvent: {user: {utorid: utorid}}}];
    } else if (name) {
        filter[OR] = [{infoPurchase: {user: {name: name}}},
                    {infoAdjustment: {user: {name: name}}},
                    {infoRedemption: {user: {name: name}}},
                    {infoEvent: {user: {name: name}}}];
    }

    const include = {infoPurchase: {include: {promotionIds: true, user: {select: {utorid: true, name: true}}}},
                     infoAdjustment: {include: {promotionIds: true, user: {select: {utorid: true, name: true}}}},
                     infoRedemption: {include: {cashier: {select: {utorid: true}}}},
                     infoTransfer: {include: {relatedUser: {select: {utorid: true}}}},
                     infoEvent: {include: {user: {select: {utorid: true, name: true}}}}};
    
    if (query['orderBy']) {
        let {orderBy, order, page, limit} = query;
        const result = await prisma.transaction.findMany({where: filter, include: include});
        const count = await prisma.transaction.count({where: filter});
        postProcessGetTransaction(include, result);
        sanitizeTransactions(result);

        limit = parseInt(limit, 10);
        page = parseInt(page, 10);    
        const take = isNaN(limit) ? 10 : limit;
        const skip = isNaN(page) ? 0 : take * (page - 1);
        
        const falsey = x => x == null || x == undefined || x == '' || (x.length && x.length == 0);
        const r = result.sort((a, b) => {
            if (falsey(a[orderBy]) && falsey(b[orderBy]))
                return 0;
            if (falsey(a[orderBy]))
                return order == 'asc' ? -1 : 1;
            if (falsey(b[orderBy]))
                return order == 'asc' ? 1 : -1;
            if (a[orderBy] < b[orderBy])
                return order == 'asc' ? -1 : 1;
            if (a[orderBy] > b[orderBy])
                return order == 'asc' ? 1 : -1;
            return 0;
        }).slice(skip, skip + take);
        return res.status(200).json({count: count, results: r});
    }
    const [count, result, e3] = await findMany(prisma.transaction, filter, query, res, include, {});
    if (e3) return e3;
    postProcessGetTransaction(include, result);
    sanitizeTransactions(result);
    return res.status(200).json({count: count, results: result});
});

function sanitizeTransactions(results) {
    for (let i = 0; i < results.length; i++) {
        const {type, createdBy, infoAdjustment, infoEvent, infoPurchase, infoRedemption, infoTransfer} = results[i];
        results[i].type = type[0].toUpperCase() + type.slice(1);
        
        if (infoAdjustment) {
            results[i].amount = infoRedemption.amount;
            results[i].utorid = infoRedemption.utorid;
            results[i].name = infoRedemption.user ? infoRedemption.user.name : null;
            results[i].suspicious = infoAdjustment.suspicious;
            results[i].processedBy = null;
            results[i].transfer = null;
            results[i].purchaser = null;
            results[i].type = [results[i].type, infoAdjustment.relatedId];
        } else if (infoEvent) {
            results[i].amount = infoEvent.awarded;
            results[i].utorid = infoEvent.recipient;
            results[i].name = infoEvent.user ? infoEvent.user.name : null;
            results[i].suspicious = null;
            results[i].processedBy = null;
            results[i].transfer = null;
            results[i].purchaser = null;
            results[i].type = [results[i].type, infoEvent.relatedId];
        } else if (infoPurchase) {
            results[i].amount = infoPurchase.spent;
            results[i].utorid = infoPurchase.utorid;
            results[i].name = infoPurchase.user ? infoPurchase.user.name : null;
            results[i].suspicious = infoPurchase.suspicious;
            results[i].processedBy = null;
            results[i].purchaser = infoPurchase.utorid;
            results[i].transfer = null;
        } else if (infoRedemption) {
            results[i].amount = infoRedemption.amount;
            results[i].utorid = infoRedemption.utorid;
            results[i].name = infoRedemption.user ? infoRedemption.user.name : null;
            results[i].suspicious = null;
            results[i].processedBy = infoRedemption.user ? infoRedemption.user.utorid : 'N/A';
            results[i].purchaser = null;
            results[i].transfer = null;
        } else if (infoTransfer) {
            results[i].amount = infoTransfer.sent;
            results[i].utorid = null;
            results[i].name = null;
            results[i].suspicious = null;
            results[i].processed = null;
            results[i].purchaser = null;
            const t = infoTransfer.relatedUser.utorid == createdBy ? 'From: ' : 'Sent: ';
            results[i].transfer = `${t}${infoTransfer.relatedUser.utorid}`;
        }
    }
}

app.get('/transactions/:transactionId', permLevel('manager'), async (req, res) => {
    const [transactionId, e1] = getParamIndex('transactionId', req, res);
    if (e1) return e1;
    
    const include = {infoPurchase: {include: {promotionIds: true, user: {select: {utorid: true, name: true}}}},
                     infoAdjustment: {include: {promotionIds: true, user: {select: {utorid: true, name: true}}}},
                     infoRedemption: {include: {cashier: {select: {utorid: true}}}},
                     infoTransfer: {include: {relatedUser: {select: {utorid: true}}}},
                     infoEvent: {include: {user: {select: {utorid: true, name: true}}}}};
    const [result, e2] = await findUnique(prisma.transaction, {id: transactionId}, res, include);
    if (e2) return e2;
    postProcessGetTransaction(include, result);
    if (result['earned'])
        result['amount'] = result['earned'];
    console.log(`200, got id=${transactionId}, ${JSON.stringify(result)}`);
    return res.status(200).json(result);
});

app.get('/users/me/transactions', permLevel('regular'), async (req, res) => {
    const variables = ['promotionId', 'type', 'relatedId', 'amount', 'operator', 'page', 'limit', 'orderBy', 'order'];
    const [query, e1] = queryAllow(variables, req, res);
    if (e1) return e1;
    const e2 = checkCondition(res, req.user.verified, 403, `user=${req.utorid} is not verified`);
    if (e2) return e2;
    
    const {type, operator, relatedId, amount} = query;
    const filter = {OR: [{createdBy: req.utorid},
                        {infoPurchase: {user: {utorid: req.utorid}}},
                        {infoAdjustment: {user: {utorid: req.utorid}}},
                        {infoRedemption: {user: {utorid: req.utorid}}},
                        {infoEvent: {user: {utorid: req.utorid}}}
                    ]};
    objectAddLax(['name', 'createdBy', 'suspicious', 'promotionId', 'type'], query, filter, res);
    if (type != 'purchase' && relatedId)    filter['relatedId'] = relatedId;
    if (operator == 'lte')                  filter['amount'] = {lte: amount};
    else if (operator == 'gte')             filter['amount'] = {gte: amount};

    const include = {infoPurchase: {include: {promotionIds: true, user: {select: {utorid: true, name: true}}}},
                     infoAdjustment: {include: {promotionIds: true, user: {select: {utorid: true, name: true}}}},
                     infoRedemption: {include: {cashier: {select: {utorid: true}}}},
                     infoTransfer: {include: {relatedUser: {select: {utorid: true}}}},
                     infoEvent: {include: {user: {select: {utorid: true, name: true}}}}};
    if (query['orderBy']) {
        let {orderBy, order, page, limit} = query;
        const result = await prisma.transaction.findMany({where: filter, include: include});
        const count = await prisma.transaction.count({where: filter});
        postProcessGetTransaction(include, result);
        sanitizeTransactions(result);

        limit = parseInt(limit, 10);
        page = parseInt(page, 10);    
        const take = isNaN(limit) ? 10 : limit;
        const skip = isNaN(page) ? 0 : take * (page - 1);
        
        const falsey = x => x == null || x == undefined || x == '' || (x.length && x.length == 0);
        const r = result.sort((a, b) => {
            if (falsey(a[orderBy]) && falsey(b[orderBy]))
                return 0;
            if (falsey(a[orderBy]))
                return order == 'asc' ? -1 : 1;
            if (falsey(b[orderBy]))
                return order == 'asc' ? 1 : -1;
            if (a[orderBy] < b[orderBy])
                return order == 'asc' ? -1 : 1;
            if (a[orderBy] > b[orderBy])
                return order == 'asc' ? 1 : -1;
            return 0;
        }).slice(skip, skip + take);
        return res.status(200).json({count: count, results: r});
    }
                     
    const [count, result, e3] = await findMany(prisma.transaction, filter, query, res, include);
    if (e3) return e3;
    postProcessGetTransaction(include, result);
    sanitizeTransactions(result);
    return res.status(200).json({count: count, results: result});
});


/*******************************************************************************
Purchase transaction, adjustment transaction
*******************************************************************************/
async function checkApplyPromotions(promotionIds, utorid, res, spent) {
    const now = new Date();
    const bonuses = [];
    for (let i = 0; i < promotionIds.length; i++) {
        const promotionId = promotionIds[i];
        const promotion = await prisma.promotion.findUnique({where: {id: promotionId}, include: {purchases: true}});
        
        const e3 = checkCondition(res, promotion, 400, `Bad promotionId ${promotionId}`);
        if (e3) return [null, e3];
        const c4 = promotion.startTime <= now && now <= promotion.endTime;
        const e4 = checkCondition(res, c4, 400, `Expired promotion ${promotionId}`);
        if (e4) return [null, e4];
        if (promotion.type == 'one-time') {
            const c5 = !promotion.purchases.find(x => x.utorid == utorid);
            const e5 = checkCondition(res, c5, 400, `Promotion ${promotionId} already used`);
            if (e5) return [null, e5];
        }
        let {minSpending, rate, points} = promotion;
        minSpending = (minSpending) ? minSpending : 0;
        rate = (rate) ? rate : 0;
        points = (points) ? points : 0;
        if (spent > minSpending)
            bonuses.push(Math.floor(spent * 100 * rate + points));
    }
    return [bonuses.reduce((a, b) => a + b), false];
}
async function purchaseTransaction(req, res, data1) {
    const e1 = bodyRequire(['utorid', 'spent'], req, res);
    if (e1) return e1;

    // Construct fields
    const {utorid} = req.body;
    const data2 = {};
    req.body['user'] = utorid;
    const validation2 = {user: [null, x => {return {connect: {utorid: x}}}],
                         spent: isCount(false), promotionIds: Array.isArray};
    const e2 = objectAddStrict(validation2, req.body, data2, res);
    if (e2) return e2;

    data2['earned'] = Math.round(data2['spent'] * 4);
    data2['suspicious'] = req.user.suspicious;

    const {promotionIds} = data2; 
    if (promotionIds) {
        if (promotionIds.length == 0) {
            delete data2['promotionIds'];
        } else {
            const [bonus, e3] = await checkApplyPromotions(promotionIds, utorid, res, data2['spent']);
            if (e3) return e3;
            data2['earned'] += bonus;
            data2['promotionIds'] = {connect: promotionIds.map(x => {return {id: x}})}
        }
    }

    // Create purchase
    const p1 = await prisma.transaction.create({data: data1});
    data2['transaction'] = {connect: {id: p1.id}};
    const p2 = await prisma.transactionPurchase.create({data: data2, include: {promotionIds: true}});
    console.log(`201,\np1=${JSON.stringify(p1)},\np2=${JSON.stringify(p2)}`);
    if (p2['promotionIds'])
        p2['promotionIds'] = p2['promotionIds'].map(x => x.id);

    // Apply purchase
    if (!req.user.suspicious) {
        await prisma.user.update({where: {utorid: utorid},
                                  data: {points: {increment: data2['earned']}}});
        console.log(`Non-suspicious, loaded ${data2['earned']} points to ${utorid}`);
    } else {
        p2['earned'] = 0;
        console.log(`Suspicious, withheld ${data2['earned']} points to ${utorid}`);
    }
    return res.status(201).json(Object.assign({}, p1, p2));
}
async function adjustmentTransaction(req, res, data1) {
    const e1 = bodyRequire(['utorid', 'amount', 'relatedId'], req, res);
    if (e1) return e1;

    // Construct fields
    const {utorid} = req.body;
    const data2 = {};
    req.body['user'] = utorid;
    req.body['related'] = req.body['relatedId'];
    const validation2 = {user: [null, x => {return {connect: {utorid: x}}}],
                        related: [null, x => {return {connect: {id: x}}}],
                        amount: x => !isNaN(parseFloat(x, 10)), promotionIds: Array.isArray};
    const e2 = objectAddStrict(validation2, req.body, data2, res);
    if (e2) return e2;

    const [result, e3] = await findUnique(prisma.transaction, {id: req.body['relatedId']}, res);
    if (e3) return e3;

    const {promotionIds} = data2; 
    if (promotionIds) {
        if (promotionIds.length == 0) {
            delete data2['promotionIds'];
        } else {
            const [bonus, e3] = await checkApplyPromotions(promotionIds, utorid, res, data2['spent']);
            if (e3) return e3;
            data2['earned'] += bonus;
            data2['promotionIds'] = {connect: promotionIds.map(x => {return {id: x}})};
        }
    }

    // Create/apply purchase
    const p1 = await prisma.transaction.create({data: data1});
    data2['transaction'] = {connect: {id: p1.id}};
    const p2 = await prisma.transactionAdjustment.create({data: data2, include: {promotionIds: true}});
    await prisma.user.update({where: {utorid: utorid}, data: {points: {increment: req.body['amount']}}});
    if (p2['promotionIds'])
        p2['promotionIds'] = p2['promotionIds'].map(x => x.id);

    console.log(`201,\np1=${JSON.stringify(p1)},\np2=${JSON.stringify(p2)}`);
    return res.status(201).json(Object.assign({}, p1, p2));
}

app.post('/transactions', permLevel('cashier'), async (req, res) => {
    const type = req.body['type'];
    
    // Transaction
    const data1 = {type: type, creator: {connect: {utorid: req.utorid}}};
    objectAddLax(['remark'], req.body, data1);

    if (type == 'purchase')
        return await purchaseTransaction(req, res, data1);

    if (type == 'adjustment') {
        if (hasPerms(req.user.role, 'manager'))
            return await adjustmentTransaction(req, res, data1);

        console.log(`403, trying to make adjustment transaction on role=${req.user.role}`);
        return res.status(403).json({'error': `trying to make adjustment transaction on role=${req.user.role}`});
    }
    console.log(`400, bad type=${type}`);
    return res.status(400).json({'error': `bad type=${type}`});
});


/*******************************************************************************
Process Redemption Transaction
*******************************************************************************/
app.patch('/transactions/:transactionId/processed', permLevel('cashier'), async (req, res) => {
    const e1 = bodyRequire(['processed'], req, res);
    if (e1) return e1;
    const [transactionId, e2] = getParamIndex('transactionId', req, res);
    if (e2) return e2;

    const {processed} = req.body;
    const e3 = checkCondition(res, processed === true, 400, `processed=${processed}, expected true`);
    if (e3) return e3;
    const [transaction, e4] = await findUnique(prisma.transaction, {id: transactionId}, res, {infoRedemption: true});
    if (e4) return e4;
    const c5 = transaction.type != 'redemption' || transaction.infoRedemption.relatedId;
    const e5 = checkCondition(res, !c5, 400, `type = ${transaction.type}, cashier = ${transaction.infoRedemption.relatedId}`);
    if (e5) return e5;

    const utorid = transaction.createdBy;
    const amount = transaction.infoRedemption.amount;
	await prisma.transactionRedemption.update({where: {id: transactionId}, data: {cashier: {connect: {id: req.user.id}}}});
    await prisma.user.update({where: {utorid: utorid}, data: {points: {increment: -amount}}});
    console.log(`200, redeemed ${amount} for ${utorid}`);

    const result = {id: transaction.id, utorid: utorid, type: "redemption", processedBy: req.utorid, redeemed: amount, remark: transaction.remark, createdBy: utorid};
    return res.status(200).json(result);
});


/*******************************************************************************
Suspicious Transaction
*******************************************************************************/
app.patch('/transactions/:transactionId/suspicious', permLevel('manager'), async (req, res) => {
	const e1 = bodyRequire(['suspicious'], req, res);
	if (e1) return e1;
    const [transactionId, e2] = getParamIndex('transactionId', req, res);
    if (e2) return e2;
    const include = {infoPurchase: {include: {promotionIds: true, user: {select: {utorid: true, name: true}}}},
                     infoAdjustment: {include: {promotionIds: true, user: {select: {utorid: true, name: true}}}},
                     infoRedemption: {include: {cashier: {select: {utorid: true}}}},
                     infoTransfer: {include: {relatedUser: {select: {utorid: true}}}},
                     infoEvent: {include: {user: {select: {utorid: true, name: true}}}}};
    let [transaction, e3] = await findUnique(prisma.transaction, {id: transactionId}, res, include);
    postProcessGetTransaction(include, transaction);
    if (e3) return e3;

    const {suspicious} = req.body;
    if (transaction.suspicious != suspicious) {
        transaction.suspicious = suspicious;
        let increment;
        if (transaction.type == 'purchase') {
            await prisma.transactionPurchase.update({where: {id: transactionId}, data: {suspicious: suspicious}});
            increment = transaction.earned * (-2 * suspicious + 1);
        } else {
            await prisma.transactionAdjustment.update({where: {id: transactionId}, data: {suspicious: suspicious}});
            increment = transaction.amount * (-2 * suspicious + 1);
        }
        await prisma.user.update({where: {utorid: transaction.utorid}, data: {points: {increment: increment}}});
    }
    if (transaction['earned'])
        transaction['amount'] = transaction['earned'];
    console.log(`200, set suspicious=${suspicious} for transactionId=${transactionId}`);
    return res.status(200).json(transaction);
});


/*******************************************************************************
Events
*******************************************************************************/
function isIso8601(str) {
    // now this allows ISO strings that dont include the time zone as well (not specified to be that way in A2)
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+([Z]|[\+\-]\d{2}:\d{2})?$/.test(str);
}
function isCount(allowZero) {
    if (allowZero)
        return x => parseFloat(x, 10) >= 0; 
    return x => parseFloat(x, 10) > 0;
}

app.get('/events', permLevel('regular'), async (req, res) => {
    const variables = ['name', 'location', 'started', 'ended', 'showFull', 'page', 'limit', 'published', 'order', 'orderBy'];
    const [query, e1] = queryAllow(variables, req, res)
    if (e1) return e1;
    
    const filter = {};
    const varTransforms = {name: null, location: null};
    if (hasPerms(req.user.role, 'manager')) {
        varTransforms['published'] = x => (x == 'true') ? true : false;
    } else {
        filter['published'] = true;
    }
    objectAddLax(varTransforms, query, filter, res);

    // Extra conditions
    const {started, ended} = req.query;
    if (started === true)                   filter['startTime'] = {lte: now()};
    else if (started === false)             filter['startTime'] = {gte: now()};
    if (ended === true)                     filter['endTime'] = {lte: now()};
    else if (ended === false)               filter['endTime'] = {gte: now()};

    // Ordering
    const orderBy = {};
    if (query['orderBy']) {
        orderBy[query['orderBy']] = query['order'];
        delete filter['orderBy'];
        delete filter['order'];
    }

    let [count, result, e3] = await findMany(prisma.event, filter, query, res, {guests: true}, {}, orderBy);
    if (e3) return e3;
    if (filter['showFull'] !== true)
        result = result.filter(x => x.guests.length != x.capacity);
    return res.status(200).json({count: count, results: result});
});

app.post('/events', permLevel('manager'), async (req, res) => {
    const variables = ['name', 'description', 'location', 'startTime', 'endTime', 'points'];
    const e1 = bodyRequire(variables, req, res);
    if (e1) return e1;

    // Extra conditions
    const {startTime, endTime} = req.body;
    const c2 = new Date(endTime) < new Date(startTime);
    const e2 = checkCondition(res, !c2, 400, `bad datetimes, start=${startTime}, end=${endTime}`);
    if (e2) return e2;

    // Build data
    req.body['pointsRemain'] = req.body['points'];
    const data = {};
    const validation = {name: null, description: null, location: null, startTime: isIso8601,
                        endTime: isIso8601, capacity: isCount(false), pointsRemain: isCount(false)};
    const e3 = objectAddStrict(validation, req.body, data, res);
    if (e3) return e3;

    const result = await prisma.event.create({data: data, include: {organizers: true, guests: true}});
    console.log(`201, created ${JSON.stringify(result)}`);
    return res.status(201).json(result);
});


/*******************************************************************************
Event Info
*******************************************************************************/
async function checkPermManagerOrganizer(eventId, req, res) {
    const include = {organizers: true, guests: true};
    const [event, e1] = await findUnique(prisma.event, {id: eventId}, res, include);
    if (e1) return [null, e1];

    const c2 = !hasPerms(req.user.role, 'manager') && !event.organizers.find(x => x.utorid == req.utorid);
    const e2 = checkCondition(res, !c2, 403, `utorid=${req.user.utorid} is not manager (${req.user.role}) or organizer`);
    if (e2) return [null, e2];

    return [event, false];
}

app.get('/events/:eventId', permLevel('regular'), async (req, res) => {
    const [eventId, e1] = getParamIndex('eventId', req, res);
    if (e1) return e1;

    const include = {organizers: true, guests: true};
    if (hasPerms(req.user.role, 'manager')) {
        const [result, e2] = await findUnique(prisma.event, {id: eventId}, res, include);
        if (e2) return e2;

        console.log(`200, found eventId=${eventId}`);
        return res.status(200).json(result);
    }
    const omit = {pointsRemain: true, pointsAwarded: true, published: true};
    const [result, e2] = await findUnique(prisma.event, {id: eventId, published: true}, res, include, omit);
    if (e2) return e2;

    result['numGuests'] = result['guests'].length;
    delete result['guests'];
    console.log(`200, found eventId=${eventId}`);
    return res.status(200).json(result);
});

app.patch('/events/:eventId', permLevel('regular'), async (req, res) => {
    const [eventId, e1] = getParamIndex('eventId', req, res);
    if (e1) return e1;
    const [event, e2] = await checkPermManagerOrganizer(eventId, req, res);
    if (e2) return e2;

    // Extra conditions
    const {capacity, points} = req.body;
    const [start, end, now, e3] = checkStartEnd(req.body, res);
    if (e3) return e3;
    const c6 = points < event.pointsAwarded;
    const e6 = checkCondition(res, !c6, 400, `points=${points} < pointsAwarded=${event.pointsAwarded}`);
    if (e6) return e6;

    // Build data
    req.body['pointsRemain'] = req.body['points'];
    const data = {};
    const validation = {name: null, description: null, location: null,
                        startTime: isIso8601, endTime: isIso8601, capacity: isCount(false),
                        pointsRemain: isCount(true), published: x => x === true};
    const e7 = objectAddStrict(validation, req.body, data, res);
    if (e7) return e7;

    // Extra checking
    const c8 = event.startTime < now && ['name', 'description', 'location', 'startTime', 'capacity'].find(x => x in data);
    const e8 = checkCondition(res, !c8, 400, `changing property after event started,\nnow=${now},\nstartTime=${event.startTime}`);
    if (e8) return e8;
    const c9 = event.endTime < now && 'endTime' in data;
    const e9 = checkCondition(res, !c9, 400, `changing endTime=${event.endTime} to endTime=${end} after event finished,\nnow=${now}`);
    if (e9) return e9;
    const c10 = !hasPerms(req.user.role, 'manager') && ('pointsRemain' in data || 'published' in data);
    const e10 = checkCondition(res, !c10, 403, `changing points/published with role=${req.user.role}`);
    if (e10) return e10;
    const c11 = 'capacity' in data && capacity < event.guests.length;
    const e11 = checkCondition(res, !c11, 400, `changing capacity=${capacity} to below current guests=${event.guests.length}`);
    if (e11) return e11;

    const select = {id: true, name: true, location: true};
    for (let name in data) {
        select[name] = true;
    }
    const result = await prisma.event.update({where: {id: eventId}, data: data, select: select});
    console.log(`200, update event ${JSON.stringify(result)}`);
    return res.status(200).json(result);
});

app.delete('/events/:eventId', async (req, res) => {
    const [eventId, e1] = getParamIndex('eventId', req, res);
    if (e1) return e1;

    let [result, e2] = await findUnique(prisma.event, {id: eventId}, res);
    if (e2) return e2;
    
    const c3 = result.published;
    const e3 = checkCondition(res, !c3, 400, `eventId=${eventId} already published`);
    if (e3) return e3;

    result = await prisma.event.delete({where: {id: eventId}});
    console.log(`204, deleted event ${JSON.stringify(result)}`);
    return res.status(204).end();
});


/*******************************************************************************
Event Organizer
*******************************************************************************/
app.post('/events/:eventId/organizers', permLevel('manager'), async (req, res) => {
    const e1 = bodyRequire(['utorid'], req, res);
    if (e1) return e1;
    const [eventId, e2] = getParamIndex('eventId', req, res);
    if (e2) return e2;

    // Get person to add
    const {utorid} = req.body;
    const [user, e3] = await findUnique(prisma.user, {utorid: utorid}, res);
    if (e3) return e3;

    // Get event
    const [event, e4] = await findUnique(prisma.event, {id: eventId}, res, {guests: true});
    if (e4) return e4;
    
    // Checking
    const now = new Date();
    const c5 = now > event.endTime;
    const e5 = checkCondition(res, !c5, 410, `eventId=${eventId} already done,\nfinished=${event.endTime},\nnow     =${now}`);
    if (e5) return e5;
    const c6 = event.guests.find(x => x.utorid == utorid);
    const e6 = checkCondition(res, !c6, 400, `utorid=${utorid} is a guest`);
    if (e6) return e6;

    const result = await prisma.event.update({where: {id: eventId},
                                              data: {organizers: {connect: {id: user.id}}},
                                              include: {organizers: true}});
    console.log(`201, added organizer utorid=${utorid} to event=${eventId}`);
    return res.status(201).json(result);	
});

app.delete('/events/:eventId/organizers/:userId', permLevel('manager'), async (req, res) => {
	const [eventId, e1] = getParamIndex('eventId', req, res);
    if (e1) return e1;
    const [userId, e2] = getParamIndex('userId', req, res);
    if (e2) return e2;
    const [event, e3] = await findUnique(prisma.event, {id: eventId}, res);
    if (e3) return e3;

    const result = await prisma.event.update({where: {id: eventId}, data: {organizers: {disconnect: {id: userId}}}});
    console.log(`204, delete userId=${userId} from eventId=${eventId}`);
    return res.status(204).json(result);
});


/*******************************************************************************
Event Guest
*******************************************************************************/
app.post('/events/:eventId/guests', permLevel('regular'), async (req, res) => {
	const e1 = bodyRequire(['utorid'], req, res);
    if (e1) return e1;
    const [eventId, e2] = getParamIndex('eventId', req, res);
    if (e2) return e2;

    // Get person to add
    const {utorid} = req.body;
    const [user, e3] = await findUnique(prisma.user, {utorid: utorid}, res);
    if (e3) return e3;

    // Get event (and check for perms)
    const [event, e4] = await checkPermManagerOrganizer(eventId, req, res);
    if (e4) return e4;

    // Checking
    const now = new Date();
    const c5 = now > event.endTime;
    const e5 = checkCondition(res, !c5, 410, `eventId=${eventId} already done,\nfinished=${event.endTime},\nnow     =${now}`);
    if (e5) return e5;
    const c6 = event.organizers.find(x => x.utorid == utorid);
    const e6 = checkCondition(res, !c6, 400, `utorid=${utorid} is an organizer`);
    if (e6) return e6;
    const c7 = event.capacity == event.guests.length;
    const e7 = checkCondition(res, !c7, 410, `eventId=${eventId} is at full capacity=${event.capacity}`);
    if (e7) return e7;

    const result = await prisma.event.update({where: {id: eventId},
                                            data: {guests: {connect: {id: user.id}}},
                                            include: {guests: true}});
    console.log(`201, added guest utorid=${utorid} to event=${eventId}`);
    result['numGuests'] = result.guests.length;
    result['guestAdded'] = result.guests.find(x => x.id == user.id);
    return res.status(201).json(result);
});

app.post('/events/:eventId/guests/me', permLevel('regular'), async (req, res) => {
    const [eventId, e1] = getParamIndex('eventId', req, res);
    if (e1) return e1;

    // Get person to add
    const utorid = req.utorid;
    const [user, e2] = await findUnique(prisma.user, {utorid: utorid}, res);
    if (e2) return e2;

    // Get event
    const [event, e3] = await findUnique(prisma.event, {id: eventId}, res, {organizers: true, guests: true});
    if (e3) return e3;
    
    // Checking
    const now = new Date();
    const c4 = now > event.endTime;
    const e4 = checkCondition(res, !c4, 410, `eventId=${eventId} already done,\nfinished=${event.endTime},\nnow=${now}`);
    if (e4) return e4;
    const c5 = event.organizers.find(x => x.utorid == utorid);
    const e5 = checkCondition(res, !c5, 400, `utorid=${utorid} is an organizer`);
    if (e5) return e5;
    const c6 = event.capacity == event.guests.length;
    const e6 = checkCondition(res, !c6, 410, `eventId=${eventId} is at full capacity=${event.capacity}`);
    if (e6) return e6;

    const result = await prisma.event.update({where: {id: eventId},
                                              data: {guests: {connect: {id: user.id}}},
                                              include: {guests: true}});
    console.log(`201, added organizer utorid=${utorid} to event=${eventId}`);
    result['numGuests'] = result.guests.length;
    result['guestAdded'] = result.guests.find(x => x.id == user.id);
    return res.status(201).json(result);
});

app.delete('/events/:eventId/guests/me', permLevel('regular'), async (req, res) => {
	const [eventId, e1] = getParamIndex('eventId', req, res);
    if (e1) return e1;
    const [event, e2] = await findUnique(prisma.event, {id: eventId}, res);
    if (e2) return e2;

    const now = new Date();
    const c3 = event.endTime >= now;
    const e3 = checkCondition(res, c3, 410, `event=${eventId} already ended,\nendTime=${event.endTime},\nnow=${now}`);
    if (e3) return e3;

    const result = await prisma.event.update({where: {id: eventId}, data: {guests: {disconnect: {id: req.user.id}}}});
    console.log(`204, delete userId=${req.user.id} from eventId=${eventId}`);
    return res.status(204).json(result);
});

app.delete('/events/:eventId/guests/:userId', permLevel('manager'), async (req, res) => {
    const [eventId, e1] = getParamIndex('eventId', req, res);
    if (e1) return e1;
    const [userId, e2] = getParamIndex('userId', req, res);
    if (e2) return e2;
    const [event, e3] = await findUnique(prisma.event, {id: eventId}, res);
    if (e3) return e3;

    const result = await prisma.event.update({where: {id: eventId}, data: {guests: {disconnect: {id: userId}}}});
    console.log(`204, delete userId=${userId} from eventId=${eventId}`);
    return res.status(204).json(result);
});


/*******************************************************************************
Event Transaction
*******************************************************************************/
app.post('/events/:eventId/transactions', permLevel('regular'), async (req, res) => {
    const e1 = bodyRequire(['type', 'amount'], req, res);
    if (e1) return e1;
    const [eventId, e2] = getParamIndex('eventId', req, res);
    if (e2) return e2;
    const [event, e3] = await checkPermManagerOrganizer(eventId, req, res);
    if (e3) return e3;

    // Data
    const data1 = {createdBy: req.utorid};
    const e4 = objectAddStrict({type: x => x == 'event'}, req.body, data1, res);
    if (e4) return e4;

    // Event-specific
    req.body['awarded'] = req.body['amount'];
    const data2 = {event: {connect: {id: eventId}}};
    const e5 = objectAddStrict({awarded: isCount(false)}, req.body, data2, res);
    if (e5) return e5;
    
    // Check conditions
    const awarded = parseInt(data2['awarded'], 10);
    let utorids;
    const u = req.body['utorid'];
    if (u) {
        const c6 = !event.guests.find(x => x.utorid == u);
        const e6 = checkCondition(res, !c6, 400, `${u} is not a guest in event=${JSON.stringify(event.guests)}`);
        if (e6) return e6;
        
        utorids = [u];
    } else {
        utorids = event.guests.map(x => x.utorid);
    }
    const c7 = awarded * utorids.length > event.pointsRemain;
    const e7 = checkCondition(res, !c7, 400, `${utorids.length} guests * event transaction awarded=${awarded} > pointsRemain=${event.pointsRemain}`);
    if (e7) return e7;

    let result = [];
    for (let i = 0; i < utorids.length; i++) {
        const utorid = utorids[i];
        const p1 = await prisma.transaction.create({data: data1});
        data2['user'] = {connect: {utorid: utorid}};
        data2['transaction'] = {connect: {id: p1.id}};
        const p2 = await prisma.transactionEvent.create({data: data2});
        await prisma.user.update({where: {utorid: utorid}, data: {points: {increment: awarded}}});
        await prisma.event.update({where: {id: eventId}, data: {pointsRemain: {increment: -awarded}, pointsAwarded: {increment: awarded}}});
        result.push(Object.assign({}, p1, p2));
    }
    /* TODO
    Awarding points to guests can be done after an event has ended.
    After this transaction is created, the points are awarded to the user immediately.
    */
    if (u)
        result = result[0];
    console.log(`201, utorids=${utorids}, awarded=${awarded},\nresult=${JSON.stringify(result)}`);
    return res.status(201).json(result);
});


/*******************************************************************************
Promotion
*******************************************************************************/
app.post('/promotions', permLevel('manager'), async (req, res) => {
    const e1 = bodyRequire(['name', 'description', 'type', 'startTime', 'endTime'], req, res);
    if (e1) return e1;
    const data = {};
    const validation = {name: null, description: null, type: x => ['automatic', 'one-time'].includes(x), startTime: isIso8601,
                        endTime: isIso8601, minSpending: isCount(true), rate: isCount(true), points: isCount(true)};
    const e2 = objectAddStrict(validation, req.body, data, res);
    if (e2) return e2;
    
    const {startTime, endTime} = req.body;
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();
    const e3 = checkCondition(res, start >= now, 400, `start=${start} is in the past, now=${now}`);
    if (e3) return e3;
    const e4 = checkCondition(res, start <= end, 400, `start=${start} after end=${end}`);
    if (e4) return e4;

	const result = await prisma.promotion.create({data: data});
    console.log(`201, created ${JSON.stringify(result)}`);
    return res.status(201).json(result);
});

app.get('/promotions', permLevel('regular'), async (req, res) => {
    const variablesFilter = ['name', 'type', 'page', 'limit', 'orderBy', 'order'];
    const variables = hasPerms(req.user.role, 'manager') ? ['name', 'type', 'page', 'limit', 'started', 'ended', 'orderBy', 'order'] : variablesFilter;
    const [query, e1] = queryAllow(variables, req, res);
    if (e1) return e1;

    const filter = {};
    objectAddLax(variablesFilter, query, filter);

    // Manager filters
    const now = new Date();
    if (hasPerms(req.user.role, 'manager')) {
        const {started, ended} = req.query;
        const e2 = checkCondition(res, !started || !ended, 400, `started=${started} and ended=${ended} both specified`);
        if (e2) return e2;

        if (started === 'true')         filter['startTime'] = {lte: now};
        else if (started === 'false')   filter['startTime'] = {gte: now};
        else if (ended === 'true')      filter['endTime'] = {lte: now};
        else if (ended === 'false')     filter['endTime'] = {gte: now};
    } else {
        filter['startTime'] = {lte: now};
        filter['endTime'] = {gte: now};
        // TODO FILTER to promotions not used by the user
    }

    const omit = {description: true};
    const orderBy = {};
    if (query['orderBy']) {
        orderBy[query['orderBy']] = query['order'];
        delete filter['orderBy'];
        delete filter['order'];
    }

    const [count, result, e3] = await findMany(prisma.promotion, filter, req.query, res, {}, omit, orderBy);
    if (e3) return e3;
    return res.status(200).json({count: count, results: result});
});


/*******************************************************************************
Promotion info
*******************************************************************************/
function checkStartEnd(body, res) {
    const {startTime, endTime} = body;
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();
    
    const c1 = startTime && endTime && end < start;
    const e1 = checkCondition(res, !c1, 400, `newStart after newEnd,\nstart=${start},\nend=${end}`);
    if (e1) return [null, null, null, e1];
    
    const c2 = startTime && start < now;
    const e2 = checkCondition(res, !c2, 400, `newStart is in the past,\nstart=${start},\nnow=${now}`);
    if (e2) return [null, null, null, e2];
    
    const c3 = endTime && end < now;
    const e3 = checkCondition(res, !c3, 400, `newEnd is in the past,\nend=${end},\nnow=${now}`);
    if (e3) return [null, null, null, e3];
    return [start, end, now, false];
}

app.get('/promotions/:promotionId', permLevel('regular'), async (req, res) => {
    const [promotionId, e1] = getParamIndex('promotionId', req, res);
    if (e1) return e1;

    const now = new Date();
    const [result, e2] = await findUnique(prisma.promotion, {id: promotionId}, res);
    if (e2) return e2;
    if (!hasPerms(req.user.role, 'manager')) {
        const c3 = result.startTime <= now && now <= result.endTime;
        const e3 = checkCondition(res, c3, 404, `Promotion is inactive,\nnow  =${now},\nstart=${result.startTime},\nend  =${result.endTime}`);
        if (e3) return e3;
        delete result['startTime'];
    }
    console.log(`200, now=${now},\nfound ${JSON.stringify(result)}`);
    return res.status(200).json(result);
});

app.patch('/promotions/:promotionId', permLevel('manager'), async (req, res) => {
    const [promotionId, e1] = getParamIndex('promotionId', req, res);
    if (e1) return e1;

    // Build data
    const data = {};
    const validation = {name: null, description: null, type: x => ['automatic', 'one-time'].includes(x), startTime: isIso8601,
                        endTime: isIso8601, minSpending: isCount(true), rate: isCount(true), points: isCount(true)};
    const e2 = objectAddStrict(validation, req.body, data, res);
    if (e2) return e2;
    
    const select = {id: true, name: true, type: true};
    for (let name in data) {
        select[name] = true;
    }

    // Error checking
    const [promotion, e3] = await findUnique(prisma.promotion, {id: promotionId}, res);
    if (e3) return e3;
    const [start, end, now, e4] = checkStartEnd(req.body, res);
    if (e4) return e4;
    const c5 = promotion.startTime < now && ['name', 'description', 'type', 'startTime', 'minSpending', 'rate', 'points'].find(x => x in data);
    const e5 = checkCondition(res, !c5, 400, `changing property after event started,\nnow=${now},\nstartTime=${promotion.startTime}`);
    if (e5) return e5;
    const c6 = promotion.endTime < now && 'endTime' in data;
    const e6 = checkCondition(res, !c6, 400, `changing endTime=${promotion.endTime} to endTime=${end} after event finished,\nnow=${now}`);
    if (e6) return e6;

    const result = await prisma.promotion.update({where: {id: promotionId}, data: data, select: select});
    console.log(`204, changed id=${promotionId}, promotion=${JSON.stringify(result)}`);
    return res.status(200).json(result);
});

app.delete('/promotions/:promotionId', permLevel('manager'), async (req, res) => {
	const [promotionId, e1] = getParamIndex('promotionId', req, res);
    if (e1) return e1;
    const [promotion, e2] = await findUnique(prisma.promotion, {id: promotionId}, res);
    if (e2) return e2;
    const now = new Date();
    const e3 = checkCondition(res, promotion.startTime > now, 403, `promotion=${promotionId} already started at ${now}`);
    if (e3) return e3;

    const result = await prisma.promotion.delete({where: {id: promotionId}});
    console.log(`204, deleted id=${promotionId}, promotion=${JSON.stringify(result)}`);
    return res.status(204).end();
});


app.use((req, res, next) => {
    return res.status(405).json({"error": `Unsupported method ${req.method}`});
})

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`cannot start server: ${err.message}`);
    process.exit(1);
});