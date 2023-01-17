import * as puppeteer from 'puppeteer';
import { flattenFolders, openAllFolders, traverseFolder, updateLogLine } from './helpers';

// const classID = "39075";
// const className = 'Dansk';

export async function getDownloadableFiles(page: puppeteer.Page, classID: string, className: string) {
  console.group('Setup')

  console.log('Login');
  await page.goto('https://aarhustech.itslearning.com/');
  const loginButton = await page.$('.h-box-sizing-bb.ccl-button.itsl-no-text-decoration.itsl-native-login-button.itsl-button-color-federated');
  
  await loginButton?.click();
  await page.waitForNavigation();

  const [ nameInput, passwordInput, submitButton ] = await Promise.all([
    page.$('#userNameInput'),
    page.$('#passwordInput'),
    page.$('#submitButton'),
  ]);

  await nameInput.type(process.env.UNILOGIN);
  await passwordInput.type(process.env.PASSWORD);

  await submitButton.click();

  await page.waitForNetworkIdle();

  console.log('Navigating to class');
  await page.goto(`https://aarhustech.itslearning.com/main.aspx?CourseID=${classID}`);

  await page.waitForSelector('#link-resources');

  console.log('Navigating to resources');
  const resourceButton = await page.$('#link-resources');

  await Promise.all([
    resourceButton.click(),
    page.waitForNetworkIdle(),
  ]);

  console.groupEnd();

  console.group('Gathering file data');

  console.log('Setup functions');
  await Promise.all([
  ]);

  console.log('Opening all folder');
  await Promise.all([
    page.evaluate(openAllFolders),
    page.waitForNetworkIdle()
  ]);

  console.group('Traversing folders');

  const folder = await page.evaluate(traverseFolder);
  const allFiles = flattenFolders(folder, className);
  console.info(`Found ${allFiles.length} files`);
  console.groupEnd()

  return allFiles;
}
