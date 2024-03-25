const puppeteer = require("puppeteer");
const dotenv = require("dotenv");

dotenv.config();
const courses = require("./courses.js");

console.error("Starting");

async function runWebassignSite() {
    const browser = await puppeteer.launch({ headless: true });

    const page = await browser.newPage();
    console.error("Page created");

    // This link will redirect, so we need to wait for the page to load
    await page.goto("https://www.webassign.net/wa-auth/login");
    console.error("Page loaded");

    await page.waitForSelector("#idp-discovery-username");
    console.error("Page loaded");

    // Fill in the #idp-discovery-username input with the email then click the #idp-discovery-submit button
    console.email = process.env.WEBASSIGN_EMAIL;
    await page.click("#idp-discovery-username");
    const el = await page.$("#idp-discovery-username");
    // el.setAttribute("value", process.env.WEBASSIGN_EMAIL);
    // console.log("Found email input");
    const evalFn = (function (email) {
        console.error(email);
        return (
            "document.getElementById('idp-discovery-username').setAttribute('value', '" +
            email +
            "');"
        );
    })(process.env.WEBASSIGN_EMAIL);

    await page.evaluate(evalFn, el);
    await page.type("#idp-discovery-username", " ");

    // wait 1 second
    // console.error("Filled in email");
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    // console.error("Waited");

    await page.click("#idp-discovery-submit");
    console.error("Filled in email");

    await page.click("#idp-discovery-submit");

    await page.waitForSelector("#okta-signin-username");
    // Fill in the #okta-signin-username input with the email then click the #okta-signin-submit button
    await page.waitForSelector("#okta-signin-submit");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const pwEl = await page.$("#okta-signin-password");

    const slicedPw = process.env.WEBASSIGN_PASSWORD.slice(1);
    const lastChar = process.env.WEBASSIGN_PASSWORD.at(0);
    const evalFn2 = (function (pw) {
        return (
            "document.getElementById('okta-signin-password').setAttribute('value', '" +
            pw +
            "');"
        );
    })(slicedPw);

    await page.evaluate(evalFn2, pwEl);

    await page.type("#okta-signin-password", lastChar);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await Promise.all([page.click("#okta-signin-submit")]);
    console.error("Filled in password");

    await new Promise((resolve) => setTimeout(resolve, 1000));
    // await page.screenshot({ path: "example2.png" });
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    // await page.screenshot({ path: "example.png" });
    console.error("Clicked submit");

    await page.waitForNavigation();

    // console.error("Page loaded");
    // await page.screenshot({ path: "yeet.png" });

    // Wait for the page to load
    // await page2.waitForSelector("#page-h1");
    // await page2.reload();
    console.error("page-h1 loaded");
    await page.waitForSelector(".css-1rpqxn4");
    // console.error("div.quick-links loaded");
    console.error("Page loaded");
    // await page.screenshot({ path: "asdfads.png" });

    // await page.waitForSelector("#name-0");
    // await page.screenshot({ path: "asdfads2.png" });

    var ret = [];

    const courseTiles = await page.$$(
        `a.css-dwce1g-LinkStyledAsButton-BaseStyledButton`,
    );
    var usedCourses = [];

    for (const course of courseTiles) {
        var courseNameTile = await course.getProperty("parentNode");
        courseNameTile = await courseNameTile.getProperty("parentNode");
        courseNameTile = await courseNameTile.getProperty("firstChild");
        courseNameTile = await courseNameTile.getProperty("lastChild");
        courseNameTile = await courseNameTile.getProperty("firstChild");
        // courseNameTile = await courseNameTile[0];

        // console.error(courseNameTile);
        const courseName = await courseNameTile.evaluate((el) => el.innerText);
        if (usedCourses.includes(courseName)) {
            continue;
        }
        usedCourses.push(courseName);
        const newPage = await browser.newPage();
        await newPage.goto(await course.evaluate((el) => el.href));
        // await newPage.screenshot({ path: `course${course}_0.png` });
        // await newPage.waitForSelector("section.css-1rpqxn4");
        // // console.error(`Navigating to course ${course}`);
        // await newPage.waitForSelector(
        //     `a.css-dwce1g-LinkStyledAsButton-BaseStyledButton e1v66uiy1`,
        // );
        // await newPage.waitForSelector(`#tile${course} a`);
        // console.error(`Found course ${course}`);
        console.error(courseName);
        // await Promise.all([
        //     newPage.waitForNavigation(),
        //     newPage.click(`#tile${course} a`),
        // ]);
        console.error(`Navigated to course ${course.href}`);

        await newPage.waitForSelector("#js-student-myAssignmentsWrapper");

        let arr = await newPage.evaluate(() => {
            const assignments = document.querySelectorAll(
                "#js-student-myAssignmentsWrapper section ul li",
            );
            return Array.from(assignments).map((assignment) => {
                return assignment.innerText.split("\n");
            });
        });
        arr.forEach((v) => {
            ret.push({
                name: v[0],
                due: Date.parse(v[1]) / 1000,
                course: courseName,
            });
        });
    }
    console.log(JSON.stringify(ret));
    // console.error(JSON.stringify(ret));
    let pages = await browser.pages();
    await Promise.all(pages.map((page) => page.close()));

    await browser.close();
}

(async () => {
    await runWebassignSite();
    console.error("Done");
})();
