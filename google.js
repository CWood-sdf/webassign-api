const puppeteer = require("puppeteer");
const dotenv = require("dotenv");
const fs = require("fs").promises;
const path = require("path");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");
dotenv.config();

const courses = [2, 3];
var assignments = [];

console.error("Starting");

async function runWebassignSite() {
    const browser = await puppeteer.launch();

    const page = await browser.newPage();
    console.error("Page created");

    // This link will redirect, so we need to wait for the page to load
    await page.goto("https://www.webassign.net/wa-auth/login");
    console.error("Page loaded");

    await page.waitForNavigation();
    console.error("Page loaded");

    // Fill in the #idp-discovery-username input with the email then click the #idp-discovery-submit button
    dotenv.config();

    await page.type("#idp-discovery-username", process.env.WEBASSIGN_EMAIL);
    console.error("Filled in email");

    await page.click("#idp-discovery-submit");

    await page.waitForSelector("#okta-signin-username");
    // Fill in the #okta-signin-username input with the email then click the #okta-signin-submit button
    await page.waitForSelector("#okta-signin-submit");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await page.type("#okta-signin-username", process.env.WEBASSIGN_PASSWORD);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await page.screenshot({ path: "example3.png" });
    await Promise.all([
        // page.waitForNavigation(),
        page.click("#okta-signin-submit"),
    ]);
    console.error("Filled in password");

    await new Promise((resolve) => setTimeout(resolve, 1000));
    // await page.screenshot({ path: "example2.png" });
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    // await page.screenshot({ path: "example.png" });
    console.error("Clicked submit");

    await page.waitForNavigation();

    // console.error("Page loaded");
    await page.screenshot({ path: "yeet.png" });

    // Wait for the page to load
    // await page2.waitForSelector("#page-h1");
    // await page2.reload();
    console.error("page-h1 loaded");
    await page.waitForSelector("section.add-courses");
    // console.error("div.quick-links loaded");
    console.error("Page loaded");
    await page.screenshot({ path: "asdfads.png" });

    await page.waitForSelector("#name-0");
    await page.screenshot({ path: "asdfads2.png" });

    var ret = [];

    for (const course of courses) {
        const newPage = await browser.newPage();
        await newPage.goto(
            "https://cengage.com/dashboard/#/my-dashboard/authenticated",
        );
        await newPage.screenshot({ path: `course${course}_0.png` });
        await newPage.waitForSelector("#name-0");
        // console.error(`Navigating to course ${course}`);
        await newPage.waitForSelector(`#tile${course} a`);
        console.error(`Found course ${course}`);
        const courseNameTile = await newPage.$(`#name-${course} .ng-binding`);
        const courseName = await courseNameTile.evaluate((el) => el.innerText);
        console.error(courseName);
        // console.error(courseName);
        await Promise.all([
            newPage.waitForNavigation(),
            newPage.click(`#tile${course} a`),
        ]);
        console.error(`Navigated to course ${course}`);

        await newPage.waitForSelector("#js-student-myAssignmentsWrapper");

        let arr = await newPage.evaluate(() => {
            const assignments = document.querySelectorAll(
                "#js-student-myAssignmentsWrapper section ul li",
            );
            return Array.from(assignments).map((assignment) => {
                return assignment.innerText.split("\n");
            });
        });
        // console.log(
        //     arr.map((v) => ({
        //         name: v[0],
        //         due: Date.parse(v[1]) / 1000,
        //     })),
        // );
        arr.forEach((v) => {
            ret.push({
                name: v[0],
                due: Date.parse(v[1]) / 1000,
                course: courseName,
            });
        });
        // console.log(arr);
        // console.log(`Found course ${course} assignments`);

        // await Promise.all([page.waitForNavigation(), page.click("#homeLink")]);
        // console.log(`Navigated to home from course ${course}`);
        // await page.waitForSelector("#name-0");
        // console.log(`Found home from course ${course}`);
        // await page.screenshot({ path: `course${course}2.png` });
        // console.log(`Took screenshot of home from course ${course}`);
    }
    //
    // // List the number of elements in the .title-list ul
    //
    // const titles = await page.evaluate(() => {
    //     const titleList = document.querySelectorAll("b.ng-binding");
    //     return Array.from(titleList).map((title) => title.innerText);
    // });
    // console.log(titles);
    //
    // console.log("###");
    // console.log(JSON.stringify(ret));
    // console.error(JSON.stringify(ret));
    assignments = ret;
    let pages = await browser.pages();
    await Promise.all(pages.map((page) => page.close()));

    await browser.close();
}

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: "authorized_user",
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listEvents(auth) {
    const calendar = google.calendar({ version: "v3", auth });
    const res = await calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: "startTime",
    });
    const events = res.data.items;
    if (!events || events.length === 0) {
        console.log("No upcoming events found.");
        return;
    }
    console.log("Upcoming 10 events:");
    events.map((event, _) => {
        const start = event.start.dateTime || event.start.date;
        console.log(`${start} - ${event.summary}`);
    });
}

async function addEvent(auth) {
    const calendar = google.calendar({ version: "v3", auth });
    const res = await calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults: 10000,
        singleEvents: true,
        auth: auth,
        orderBy: "startTime",
    });
    var events = res.data.items;
    events = events.map((event, _) => {
        return event.summary;
    });
    for (var i = 0; i < assignments.length; i++) {
        if (events.includes(assignments[i].name)) {
            continue;
        }
        const event = {
            summary: assignments[i].name,
            location: "Anywhere",
            description: `Due for ${assignments[i].course}`,
            start: {
                dateTime: new Date(assignments[i].due * 1000).toISOString(),
                timeZone: "America/New_York",
            },
            end: {
                dateTime: new Date(assignments[i].due * 1000).toISOString(),
                timeZone: "America/New_York",
            },
            // reminders: {
            //     overrides: [{ method: "email", minutes: 24 * 60 }],
            // },
        };
        const prom = new Promise((resolve, reject) => {
            // console.log(event);
            calendar.events.insert(
                {
                    api_key: process.env.GOOGLE_API_KEY,
                    auth: auth,
                    calendarId: "primary",
                    resource: event,
                },
                function (err, event) {
                    // if (err) {
                    //     console.log(
                    //         "There was an error contacting the Calendar service: " +
                    //             err.response.data.error.message,
                    //     );
                    //     // reject(err);
                    //     // return;
                    // }
                    console.log("Event created: ", event.data.summary);
                    resolve();
                },
            );
        });
        await prom;
    }
    // });
    // const res = calendar.events.insert(
    //     {
    //         calendarId: "primary",
    //         resource: event,
    //     },
    //     function (err, event) {
    //         if (err) {
    //             console.log(
    //                 "There was an error contacting the Calendar service: " +
    //                     err,
    //             );
    //             return;
    //         }
    //         console.log("Event created: %s", event.htmlLink);
    //     },
    // );
    // await prom;
    return auth;
}

runWebassignSite()
    .then(authorize)
    .then(addEvent)
    .then(listEvents)
    .catch(console.error);
