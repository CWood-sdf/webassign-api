const puppeteer = require("puppeteer");
const dotenv = require("dotenv");

const courses = [2, 3];

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
    console.log(JSON.stringify(ret));
    console.error(JSON.stringify(ret));
    let pages = await browser.pages();
    await Promise.all(pages.map((page) => page.close()));

    await browser.close();
}

(async () => {
    await runWebassignSite();
    console.error("Done");
})();
