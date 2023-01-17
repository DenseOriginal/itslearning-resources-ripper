import { existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { createFolder, downloadFile, sanitizePath } from "../helpers";
import { DOWNLOAD_PATH } from "../cli";
import { ItemWithPath } from "../types";
import * as puppeteer from 'puppeteer';
import { outputPath } from "../cli";

export async function documentDownloadHandler(file: ItemWithPath, browser: puppeteer.Browser, page: puppeteer.Page) {
  const res = await page.evaluate((url) => {
    return new Promise<{ url: string, name: string } | undefined>((res, rej) => {
      fetch(url, { credentials: 'include' })
        .then(res => res.text())
        .then(d => {
          const urlMatch = d.match(/<a href=".+" target/g);
          const nameMatch = d.match(/Hent .+ (\(\d+ .+?\))/g);
          if(!urlMatch || !nameMatch) res(undefined);

          const nameString = nameMatch[0];
          res({
            url: 'https://aarhustech.itslearning.com/' + urlMatch[0].slice(12,-8),
            name: nameString.slice(5, nameString.lastIndexOf('(') - 1)
          })
        })
        .catch(rej)
    });
  }, file.url);
  
  if(!res) return;
  file.name = res.name;

  const newPage = await browser.newPage();
  await newPage.client().send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: DOWNLOAD_PATH,
  });

  const cookies = (await page.cookies()).map(c => `${c.name}=${c.value}`).join('; ');
  await newPage.close();

  const toPath = join(outputPath, file.path.replace(/ /g, '_'), file.name);
  createFolder(toPath);

  await downloadFile(
    res.url,
    sanitizePath(toPath),
    cookies
  );

  return;
}