import { bold, gray, reset } from 'colorette';
import MultiProgress = require('multi-progress');
import { join, resolve } from 'path';
import * as puppeteer from 'puppeteer';
import { documentDownloadHandler } from './download-handlers/document';
import { docxDownloadHandler } from '././download-handlers/docx'
import { pdfDownloadHandler } from './download-handlers/pdf';
import { capitalize, updateLogLine } from './helpers';
import { getDownloadableFiles } from './main';
import { itemTypes, ItemWithPath } from './types';
import { pptxDownloadHandler } from './download-handlers/pptx';
import { noteDownloadHandler } from './download-handlers/note';
const { Input, MultiSelect } = require('enquirer');
require('dotenv').config();

export const outputPath = join(__dirname, '..', 'downloads');
export const DOWNLOAD_PATH = resolve(process.env.USERPROFILE + "/Downloads");

const concurrentDownloads = 10;

async function runCli() {

  console.log(bold('Welcome to Itslearning Resource Ripper'));
  console.log(bold('--------------------------------------'));

  // Prompt the user for the course ID and the name, using enquirer input.
  const courseId = await new Input({
    name: 'courseId',
    message: 'Enter the course ID:',
  }).run();

  const courseName = await new Input({
    name: 'courseName',
    message: 'Enter the course name:',
  }).run();

  const browser = await puppeteer.launch({
    headless: false,
  });

  const page = await browser.newPage();

  const filesToDownload = await getDownloadableFiles(page, courseId, courseName);

  // Log the number of files to download.
  console.log(bold(`Found ${filesToDownload.length} files`));

  // Get the type with the longest name
  const longestTypeName = filesToDownload.reduce((longest, file) => {
    return file.type.length > longest.length ? file.type : longest;
  }, '');

  // Prompt the user to include files by filetype, using a list of choices.
  const fileTypesToInclude = await new MultiSelect({
    name: 'filetypesToDownload',
    message: 'Include files by filetype:',
    choices: itemTypes.map(type => ({
      name:
        capitalize(type) +
        reset(' '.repeat(longestTypeName.length - type.length + 3)) +
        gray(`(${filesToDownload.filter(file => file.type === type).length} Files)`),
      value: type
    })),
    result(names) {
      return this.map(names);
    }
  }).run();

  // Filter the files to download by the filetypes to exclude.
  const filesToDownloadFiltered = filesToDownload.filter(
    file => Object.values(fileTypesToInclude).includes(file.type)
  );

  // Log the amount of files exluded
  console.log(bold(`Downloading ${filesToDownloadFiltered.length} files`));

  console.log("\n");

  // Only download 10 files at a time
  for (let i = 0; i < filesToDownloadFiltered.length; i += concurrentDownloads) {
    const filesToDownloadSlice = filesToDownloadFiltered.slice(i, i + concurrentDownloads);
    await Promise.all(
      filesToDownloadSlice.map((file, idx) => downloadHandler(file, browser, page, filesToDownloadSlice.length - idx))
    );
  }

  process.stdout.moveCursor(0, -filesToDownloadFiltered.length);
  process.stdout.clearScreenDown();

  await browser.close();
}

const multi = new MultiProgress(process.stdout);

async function downloadHandler(
  file: ItemWithPath,
  browser: puppeteer.Browser,
  page: puppeteer.Page,
  index: number,
) {

  const bar = multi.newBar(`:status :msg ${file.name}`, {
    total: 2,
  });

  bar.render({
    status: '🔲',
    msg: 'Downloading'
  });

  try {
    switch (file.type) {
      case 'document': await documentDownloadHandler(file, browser, page); break;
      case 'pdf': await pdfDownloadHandler(file, browser, page); break;
      case 'word': await docxDownloadHandler(file, browser, page); break;
      case 'powerpoint': await pptxDownloadHandler(file, browser, page); break;
      case 'note': await noteDownloadHandler(file, browser, page); break;
      default: throw new Error(`Unknown file type: ${file.type}`);
    }

    bar.tick({
      status: '🟩',
      msg: 'Finished'
    });
  } catch (error) {
    console.error(error);
    
    bar.tick({
      status: '🟥',
      msg: "Error downloading"
    });
  }

}

runCli();
