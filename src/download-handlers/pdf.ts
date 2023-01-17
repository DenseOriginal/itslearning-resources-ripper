import { ItemWithPath } from "../types";
import * as puppeteer from 'puppeteer';
import { createFolder, downloadFile, sanitizePath } from "../helpers";
import { join, dirname } from "path";
import { outputPath } from "../cli";

export async function pdfDownloadHandler(file: ItemWithPath, browser: puppeteer.Browser, page: puppeteer.Page) {
  const newPage = await browser.newPage();

  // Listen for request on the page, and look for "FileDownloadUrl" in the query parameters
  newPage.on('request', async request => {
    if (!request.url().startsWith("https://platform.itslearning.com/PdfViewer/Viewer.aspx?")) return;
    
    const params = new URLSearchParams(request.url().replace("https://platform.itslearning.com/PdfViewer/Viewer.aspx?", ""));
    
    if (params.has('FileDownloadUrl')) {
      const url = params.get('FileDownloadUrl');
      
      const cookies = (await page.cookies()).map(c => `${c.name}=${c.value}`).join('; ');

      const toPath = join(outputPath, file.path.replace(/ /g, '_'), params.get('FileName'));
      createFolder(toPath);
      
      await downloadFile(
        url,
        sanitizePath(toPath),
        cookies
      );
    }
  });

  // Fire off a request so we can listen for the "FileDownloadUrl"
  await newPage.goto(file.url);
  await newPage.close();
}